/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Definition for the Ability die.
 */

import GenesysDie, { DieCategory } from '@/dice/types/GenesysDie';

/**
 * Ability (green) Die
 */
export default class AbilityDie extends GenesysDie {
	static override DENOMINATION = 'a';
	static override GLYPH = 'A';
	static override FORMULA = 'da';
	static override CATEGORY = 'positive' as DieCategory;
	static override FACES = [' ', 's', 's', 'ss', 'a', 'a', 'sa', 'aa'];
}
