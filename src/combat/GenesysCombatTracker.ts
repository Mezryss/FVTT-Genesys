/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */

import GenesysCombat from '@/combat/GenesysCombat';
import GenesysCombatant from '@/combat/GenesysCombatant';

export default class GenesysCombatTracker extends CombatTracker<GenesysCombat> {
	override get template(): string {
		return 'systems/genesys/templates/sidebar/combat-tracker.hbs';
	}

	override async getData(options: CombatTrackerOptions) {
		const data = await super.getData(options);

		const turns = data.turns.map((t) => {
			return {
				...t,
				disposition: (this.viewed.combatants.get(t.id) as GenesysCombatant).disposition,
			};
		});

		return {
			...data,
			turns,
		};
	}

	protected override async _onCombatantControl(event: JQuery.ClickEvent<HTMLElement, HTMLElement, HTMLElement>) {
		event.preventDefault();
		event.stopPropagation();

		const btn = event.currentTarget;
		const li = btn.closest('.combatant') as HTMLElement;
		const combat = this.viewed;

		// Intercept use of the individual Roll Initiative buttons.
		if (btn.dataset.control === 'rollInitiative') {
			await combat.rollInitiative([li.dataset.combatantId as string], {}, true);
			return;
		}

		// Fall back to default behavior.
		await super._onCombatantControl(event);
	}
}
