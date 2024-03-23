/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Definition for the Challenge die.
 */

import GenesysDie from '@/dice/types/GenesysDie';
import { GenesysDieFace } from '@/dice/types/GenesysSymbol';

/**
 * Challenge (red) Die
 */
export default class ChallengeDie extends GenesysDie {
	static override DENOMINATION = 'c';
	static override GLYPH = 'C';
	static override FORMULA = 'dc' as const;
	static override CATEGORY = 'negative' as const;
	static override COLOR = 'R';
	static override FACES: GenesysDieFace[] = [' ', 'f', 'f', 'ff', 'ff', 'h', 'h', 'fh', 'fh', 'hh', 'hh', 'd'];
}
