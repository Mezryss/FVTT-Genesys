/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */

import GenesysCombat from '@/combat/GenesysCombat';
import GenesysCombatant from '@/combat/GenesysCombatant';
import SkillDataModel from '@/item/data/SkillDataModel';
import { NAMESPACE as SETTINGS_NAMESPACE } from '@/settings';
import { KEY_SKILLS_COMPENDIUM } from '@/settings/campaign';
import GenesysItem from '@/item/GenesysItem';

export default class GenesysCombatTracker extends CombatTracker<GenesysCombat> {
	override get template(): string {
		return 'systems/genesys/templates/sidebar/combat-tracker.hbs';
	}

	#initiativeSkills?: string[];

	async initiativeSkills(): Promise<string[]> {
		if (!this.#initiativeSkills || this.#initiativeSkills.length === 0) {
			const compendiumId = game.settings.get(SETTINGS_NAMESPACE, KEY_SKILLS_COMPENDIUM) as string;
			const compendium = game.packs.get(compendiumId);

			if (!compendium) {
				return ['Unskilled'];
			}

			this.#initiativeSkills = (await compendium.getDocuments()).filter((i) => (i as Item).type === 'skill' && (i as GenesysItem<SkillDataModel>).systemData.initiative).map((s) => s.name);
		}

		return this.#initiativeSkills;
	}

	async _onClaimInitiativeSlot(event: JQuery.ClickEvent) {
		const slotIndex = +$(event.currentTarget).data('claim-slot');

		const controlledTokenCount = canvas.tokens.controlled.length;

		// Ensure we have a single token selected to claim this slot.
		if (controlledTokenCount === 0) {
			ui.notifications.warn('You need to have a token selected in order to claim this initiative slot!');
			return;
		} else if (controlledTokenCount > 1) {
			ui.notifications.warn('Too many tokens selected! Select a single token to claim this initiative slot.');
			return;
		}

		const userToken = canvas.tokens.controlled[0];
		const combatant = userToken.combatant as GenesysCombatant;

		// No claiming initiative slots if you aren't in the combat!
		if (!combatant) {
			return;
		}

		// Ensure our token disposition matches that of the slot.
		if (combatant.disposition !== (this.viewed.turns[slotIndex] as GenesysCombatant).disposition) {
			ui.notifications.warn(`You can't claim this initiative slot with ${combatant.name} - it's on the wrong side!`);
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
		const initiativeSkills = await this.initiativeSkills();

		console.warn(this.viewed?.flags);

		if (this.viewed) {
			this.viewed.initiativeSkills = initiativeSkills;
		}

		const turns = data.turns.map((t, index) => {
			const combatant = this.viewed.combatants.get(t.id) as GenesysCombatant;
			const claimantId = this.viewed.claimantForSlot(this.viewed.round, index);
			const claimant = claimantId ? (this.viewed.combatants.get(claimantId) as GenesysCombatant) : undefined;

			const claimed = this.viewed.started ? claimantId !== undefined : true;
			const canClaim = combatant.disposition === 'friendly' || game.user.isGM;

			let claimantOverride = {};

			if (this.viewed.started && claimant) {
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
						} else if (e.icon) {
							effects.add(e.icon);
						}
					}
				}

				claimantOverride = {
					id: claimant.id,
					name: claimant.name,
					img: claimant.img ?? CONST.DEFAULT_TOKEN,
					owner: claimant.isOwner,
					defeated: claimant.isDefeated,
					hidden: claimant.hidden,
					canPing: claimant.sceneId === canvas.scene?.id && game.user.hasPermission('PING_CANVAS'),
					effects,
				};
			}

			return {
				...t,
				...claimantOverride,
				disposition: combatant.disposition,
				initiativeSkill: combatant.initiativeSkillName ?? initiativeSkills[0],
				claimed,
				canClaim,
			};
		});

		return {
			...data,
			turns,
		};
	}

	protected override _contextMenu(html: JQuery<HTMLElement>) {
		ContextMenu.create(this, html, '.directory-item.claimed', this._getEntryContextOptions());
	}

	protected override _getEntryContextOptions(): EntryContextOption[] {
		const baseEntries = super._getEntryContextOptions();

		const rerollIndex = baseEntries.findIndex((e) => e.name === 'COMBAT.CombatantReroll');

		if (rerollIndex >= 0) {
			baseEntries[rerollIndex].callback = (li) => {
				const combatant = this.viewed.combatants.get(li.data('combatant-id'));
				if (combatant) return this.viewed.rollInitiative([combatant.id], {}, true);
			};
		}

		return baseEntries;
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
				await combat.rollInitiative([li.dataset.combatantId as string], {}, true);
				break;

			case 'cycleInitiativeSkill':
				const combatant = this.viewed.combatants.get(li.dataset.combatantId as string) as GenesysCombatant | undefined;
				const initiativeSkills = await this.initiativeSkills();
				if (initiativeSkills.length < 2) {
					return;
				}

				if (combatant) {
					let skillIndex = 0;
					if (combatant.initiativeSkillName) {
						skillIndex = initiativeSkills.findIndex((s) => s.toLowerCase() === combatant.initiativeSkillName?.toLowerCase());
					}

					skillIndex += 1;

					if (skillIndex >= initiativeSkills.length) {
						skillIndex = 0;
					}

					combatant.initiativeSkillName = initiativeSkills[skillIndex];
					btn.innerText = initiativeSkills[skillIndex];
					btn.setAttribute('data-initiative-skill', initiativeSkills[skillIndex]);
				}
				break;

			default:
				await super._onCombatantControl(event);
		}
	}

	protected override async _onCombatantHoverIn(event: MouseEvent) {
		event.preventDefault();

		if (!(event.currentTarget as HTMLElement).dataset.combatantId) {
			return;
		}

		return super._onCombatantHoverIn(event);
	}

	protected override async _onCombatantMouseDown(event: MouseEvent) {
		event.preventDefault();

		if (!(event.currentTarget as HTMLElement).dataset.combatantId) {
			return;
		}

		return super._onCombatantMouseDown(event);
	}
}
