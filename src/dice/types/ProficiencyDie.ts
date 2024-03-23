/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Definition for the Proficiency die.
 */

import GenesysDie from '@/dice/types/GenesysDie';
import { GenesysDieFace } from '@/dice/types/GenesysSymbol';

/**
 * Proficiency (yellow) Die
 */
export default class ProficiencyDie extends GenesysDie {
	static override DENOMINATION = 'p';
	static override GLYPH = 'P';
	static override FORMULA = 'dp' as const;
	static override CATEGORY = 'positive' as const;
	static override COLOR = 'Y';
	static override FACES: GenesysDieFace[] = [' ', 's', 's', 'ss', 'ss', 'a', 'sa', 'sa', 'sa', 'aa', 'aa', 't'];
}
