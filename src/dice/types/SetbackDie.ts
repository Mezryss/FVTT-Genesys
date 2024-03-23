/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Definition for the Setback die.
 */

import GenesysDie from '@/dice/types/GenesysDie';
import { GenesysDieFace } from '@/dice/types/GenesysSymbol';

/**
 * Setback (black) Die
 */
export default class SetbackDie extends GenesysDie {
	static override DENOMINATION = 's';
	static override GLYPH = 'S';
	static override FORMULA = 'ds' as const;
	static override CATEGORY = 'negative' as const;
	static override COLOR = 'K';
	static override FACES: GenesysDieFace[] = [' ', ' ', 'f', 'f', 'h', 'h'];
}
