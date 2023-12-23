/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Definition for the Challenge die.
 */

import GenesysDie, { DieCategory } from '@/dice/types/GenesysDie';

/**
 * Challenge (red) Die
 */
export default class ChallengeDie extends GenesysDie {
	static override DENOMINATION = 'c';
	static override GLYPH = 'C';
	static override FORMULA = 'dc';
	static override CATEGORY = 'negative' as DieCategory;
	static override FACES = [' ', 'f', 'f', 'ff', 'ff', 'h', 'h', 'fh', 'fh', 'hh', 'hh', 'd'];
}
