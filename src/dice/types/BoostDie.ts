/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Definition for the Boost die.
 */

import GenesysDie from '@/dice/types/GenesysDie';
import { GenesysDieFace } from '@/dice/types/GenesysSymbol';

/**
 * Boost (blue) Die
 */
export default class BoostDie extends GenesysDie {
	static override DENOMINATION = 'b';
	static override GLYPH = 'B';
	static override FORMULA = 'db' as const;
	static override CATEGORY = 'positive' as const;
	static override COLOR = 'B';
	static override FACES: GenesysDieFace[] = [' ', ' ', 's', 'sa', 'aa', 'a'];
}
