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

	override async getData(options: CombatTrackerOptions) {
		const data = await super.getData(options);
		const initiativeSkills = await this.initiativeSkills();

		if (this.viewed) {
			this.viewed.initiativeSkills = initiativeSkills;
		}

		const turns = data.turns.map((t) => {
			const combatant = this.viewed.combatants.get(t.id) as GenesysCombatant;
			return {
				...t,
				disposition: combatant.disposition,
				initiativeSkill: combatant.initiativeSkillName ?? initiativeSkills[0],
			};
		});

		return {
			...data,
			turns,
		};
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
}
