/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Actor Sheet Registration
 */

import CharacterSheet from '@/actor/sheets/CharacterSheet';
import MinionSheet from '@/actor/sheets/MinionSheet';
import RivalSheet from '@/actor/sheets/RivalSheet';
import NemesisSheet from '@/actor/sheets/NemesisSheet';

export function register() {
	Actors.unregisterSheet('core', ActorSheet);

	Actors.registerSheet('genesys', CharacterSheet, {
		types: ['character'],
		makeDefault: true,
	});

	Actors.registerSheet('genesys', MinionSheet, {
		types: ['minion'],
		makeDefault: true,
	});

	Actors.registerSheet('genesys', RivalSheet, {
		types: ['rival'],
		makeDefault: true,
	});

	Actors.registerSheet('genesys', NemesisSheet, {
		types: ['nemesis'],
		makeDefault: true,
	});
}
