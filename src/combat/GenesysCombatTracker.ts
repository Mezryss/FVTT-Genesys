/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */

import GenesysCombat, { InitiativeSkill } from '@/combat/GenesysCombat';
import GenesysCombatant from '@/combat/GenesysCombatant';
import SkillDataModel from '@/item/data/SkillDataModel';
import GenesysItem from '@/item/GenesysItem';
import { Characteristic } from '@/data/Characteristics';

export default class GenesysCombatTracker extends CombatTracker<GenesysCombat> {
	override get template(): string {
		return 'systems/genesys/templates/sidebar/combat-tracker.hbs';
	}

	#initiativeSkills?: InitiativeSkill[];

	async initiativeSkills() {
		if (!this.#initiativeSkills || this.#initiativeSkills.length === 0) {
			const compendium = game.packs.get(CONFIG.genesys.settings.skillsCompendium);

			if (!compendium) {
				return [{ skillName: 'Unskilled', skillChar: Characteristic.Brawn }];
			}

			this.#initiativeSkills = (await compendium.getDocuments())
				.filter((i) => (i as Item).type === 'skill' && (i as GenesysItem<SkillDataModel>).systemData.initiative)
				.map((s) => ({ skillName: s.name, skillChar: (s as GenesysItem<SkillDataModel>).systemData.characteristic }));
		}

		return this.#initiativeSkills;
	}

	async _onClaimInitiativeSlot(event: JQuery.ClickEvent) {
		const slotIndex = +$(event.currentTarget).data('claim-slot');

		const controlledTokenCount = canvas.tokens.controlled.length;

		// Ensure we have a single token selected to claim this slot.
		if (controlledTokenCount !== 1) {
			ui.notifications.warn(game.i18n.localize('Genesys.Notifications.SelectOneTokenForAction'));
			return;
		}

		const userToken = canvas.tokens.controlled[0];
		const combatant = userToken.combatant as GenesysCombatant;

		// No claiming initiative slots if you aren't in the combat!
		if (!combatant) {
			ui.notifications.warn(game.i18n.localize('Genesys.Notifications.TokenIsNotCombatant'));
			return;
		}

		// Ensure the selected combatant matches the PC/NPC side of the slot.
		if (
			(combatant.disposition === 'friendly' && (this.viewed.turns[slotIndex] as GenesysCombatant).disposition !== 'friendly') ||
			(combatant.disposition !== 'friendly' && (this.viewed.turns[slotIndex] as GenesysCombatant).disposition === 'friendly')
		) {
			ui.notifications.warn(game.i18n.format('Genesys.Notifications.CannotClaimOppositeSlot', { name: combatant.name }));
			return;
		}

		await this.viewed.claimSlot(this.viewed.round, slotIndex, combatant.id);
	}

	override activateListeners(html: JQuery) {
		super.activateListeners(html);

		html.find('a[data-claim-slot]').on('click', this._onClaimInitiativeSlot.bind(this));
	}

	override async getData(options: CombatTrackerOptions) {
		const data = await super.getData(options);
		const combat = this.viewed;

		if (!combat) {
			return data;
		}

		combat.initiativeSkills = await this.initiativeSkills();

		// Compile a list of all the initiatives for all the combatants.
		const initiatives = combat.combatants.reduce(
			(accumulator, combatant) => {
				accumulator[combatant.id] = [{ activationId: -1, initiative: combatant.initiative }];
				return accumulator;
			},
			{} as Record<string, { activationId: number; initiative: number | null }[]>,
		);

		combat.extraSlotsForRound(combat.round).forEach((slot) => {
			if (initiatives[slot.activationSource]) {
				initiatives[slot.activationSource].push({
					activationId: slot.index,
					initiative: slot.initiative,
				});
				initiatives[slot.activationSource].sort(this._sortByInitiative);
			}
		});

		const turns = data.turns.map((t, index) => {
			const combatant = combat.combatants.get(t.id) as GenesysCombatant;
			const claimantId = combat.claimantForSlot(combat.round, index);
			const claimant = claimantId ? (combat.combatants.get(claimantId) as GenesysCombatant) : undefined;

			const claimed = combat.started ? claimantId !== undefined : true;
			const canClaim = combatant.disposition === 'friendly' || game.user.isGM;

			// Get the highest possible initiative for this combatant.
			const slotInitiative = initiatives[combatant.id].pop()!;

			let claimantOverride = {};

			if (combat.started && claimant) {
				let defeated = claimant.isDefeated;
				const effects = new Set();
				if (claimant.token) {
					claimant.token.effects.forEach((e) => effects.add(e));
					if ((claimant.token as any).overlayEffect) {
						effects.add((claimant.token as any).overlayEffect);
					}
				}
				if (claimant.actor) {
					for (const e of claimant.actor.temporaryEffects) {
						if ((e as any).getFlag('core', 'statusId') === CONFIG.specialStatusEffects.DEFEATED) {
							defeated = true;
						} else if (e.img) {
							effects.add(e.img);
						}
					}
				}

				claimantOverride = {
					id: claimant.id,
					name: claimant.name,
					img: claimant.img ?? CONST.DEFAULT_TOKEN,
					owner: claimant.isOwner,
					defeated,
					hidden: claimant.hidden,
					canPing: claimant.sceneId === canvas.scene?.id && game.user.hasPermission('PING_CANVAS'),
					effects,
				};
			}

			return {
				...t,
				...claimantOverride,
				slotType: combatant.disposition === 'friendly' ? 'pc' : 'npc',
				initiative: slotInitiative.initiative,
				hasRolled: slotInitiative.initiative !== null,
				initiativeSkill: combatant.initiativeSkill?.skillName ?? combat.initiativeSkills[0].skillName,
				claimed,
				canClaim,
				activationId: slotInitiative.activationId,
			};
		});

		// Give the player that claims the current slot the ability to control the turn.
		const claimantId = combat.claimantForSlot(combat.round, combat.turn);
		const claimant = claimantId ? (combat.combatants.get(claimantId) as GenesysCombatant) : undefined;

		return {
			...data,
			turns,
			control: claimant?.players?.includes(game.user) ?? false,
		};
	}

	protected _sortByInitiative(first: { initiative: number | null }, second: { initiative: number | null }) {
		// Sort all the initiatives from a combatant in ascending order.
		return (first.initiative ?? -Infinity) - (second.initiative ?? -Infinity);
	}

	protected override _contextMenu(html: JQuery<HTMLElement>) {
		ContextMenu.create(this, html, '.directory-item.claimed', this._getEntryContextOptions());
	}

	protected override _getEntryContextOptions(): EntryContextOption[] {
		const baseEntries = super._getEntryContextOptions();

		// Update the Reroll Initiative behavior.
		const rerollIndex = baseEntries.findIndex((e) => e.name === 'COMBAT.CombatantReroll');

		if (rerollIndex >= 0) {
			baseEntries[rerollIndex].callback = (li) => {
				const combatant = this.viewed.combatants.get(li.data('combatant-id'));
				const activationId = +li.data('activation-id');
				const extraSlotsRolls = activationId >= 0 ? [activationId] : [];
				if (combatant) {
					return this.viewed.rollInitiative([combatant.id], {}, { prompt: true, extraSlotsRolls });
				}
			};
		}

		// Allow GMs to revoke an initiative slot claim.
		const revokeClaim = {
			name: 'Genesys.CombatTracker.RevokeInitiativeClaim',
			icon: '<i class="fas fa-broom"></i>',
			callback: async (li: JQuery<HTMLElement>) => {
				const index = +li.data('slot-index');
				if (!isNaN(index)) {
					await this.viewed.revokeSlot(this.viewed.round, index);
				}
			},
		};

		return [...baseEntries, revokeClaim];
	}

	protected override async _onCombatantControl(event: JQuery.ClickEvent<HTMLElement, HTMLElement, HTMLElement>) {
		event.preventDefault();
		event.stopPropagation();

		const btn = event.currentTarget;
		const li = btn.closest('.combatant') as HTMLElement;
		const combat = this.viewed;

		// Intercept use of the individual Roll Initiative buttons.
		switch (btn.dataset.control) {
			case 'rollInitiative':
				const activationId = +(li.dataset.activationId as string);
				const extraSlotsRolls = activationId >= 0 ? [activationId] : [];
				await combat.rollInitiative([li.dataset.combatantId as string], {}, { prompt: true, extraSlotsRolls });
				break;

			case 'cycleInitiativeSkill':
				const combatant = this.viewed.combatants.get(li.dataset.combatantId as string) as GenesysCombatant | undefined;
				const initiativeSkills = await this.initiativeSkills();
				if (initiativeSkills.length < 2) {
					return;
				}

				if (combatant) {
					let skillIndex = 0;
					if (combatant.initiativeSkill) {
						skillIndex = initiativeSkills.findIndex((s) => s.skillName.toLowerCase() === combatant.initiativeSkill?.skillName.toLowerCase());
					}

					skillIndex += 1;

					if (skillIndex >= initiativeSkills.length) {
						skillIndex = 0;
					}

					combatant.initiativeSkill = initiativeSkills[skillIndex];
					btn.innerText = initiativeSkills[skillIndex].skillName;
				}
				break;

			default:
				await super._onCombatantControl(event);
		}
	}

	protected override async _onCombatantHoverIn(event: MouseEvent) {
		event.preventDefault();

		if (!(event.currentTarget as HTMLElement).classList.contains('claimed')) {
			return;
		}

		return super._onCombatantHoverIn(event);
	}

	protected override async _onCombatantMouseDown(event: MouseEvent) {
		event.preventDefault();

		if (!(event.currentTarget as HTMLElement).classList.contains('claimed')) {
			return;
		}

		return super._onCombatantMouseDown(event);
	}
}
