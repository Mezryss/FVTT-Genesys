/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Definition for the Ability die.
 */

import GenesysDie from '@/dice/types/GenesysDie';
import { GenesysDieFace } from '@/dice/types/GenesysSymbol';

/**
 * Ability (green) Die
 */
export default class AbilityDie extends GenesysDie {
	static override DENOMINATION = 'a';
	static override GLYPH = 'A';
	static override FORMULA = 'da' as const;
	static override CATEGORY = 'positive' as const;
	static override COLOR = 'G';
	static override FACES: GenesysDieFace[] = [' ', 's', 's', 'ss', 'a', 'a', 'sa', 'aa'];
}
