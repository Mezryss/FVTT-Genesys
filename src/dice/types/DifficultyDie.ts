/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Definition for the Difficulty die.
 */

import GenesysDie from '@/dice/types/GenesysDie';
import { GenesysDieFace } from '@/dice/types/GenesysSymbol';

/**
 * Difficulty (purple) Die
 */
export default class DifficultyDie extends GenesysDie {
	static override DENOMINATION = 'i';
	static override GLYPH = 'D';
	static override FORMULA = 'di' as const;
	static override CATEGORY = 'negative' as const;
	static override COLOR = 'P';
	static override FACES: GenesysDieFace[] = [' ', 'f', 'ff', 'h', 'h', 'h', 'hh', 'fh'];
}
