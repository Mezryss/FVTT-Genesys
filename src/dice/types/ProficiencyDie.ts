/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Definition for the Proficiency die.
 */

import GenesysDie from '@/dice/types/GenesysDie';

/**
 * Proficiency (yellow) Die
 */
export default class ProficiencyDie extends GenesysDie {
	static override DENOMINATION = 'p';
	static override FACES = [' ', 's', 's', 'ss', 'ss', 'a', 'sa', 'sa', 'sa', 'aa', 'aa', 't'];
}
