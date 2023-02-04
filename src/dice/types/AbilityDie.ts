/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Definition for the Ability die.
 */

import GenesysDie from '@/dice/types/GenesysDie';

/**
 * Ability (green) Die
 */
export default class AbilityDie extends GenesysDie {
	static override DENOMINATION = 'a';
	static override FACES = [' ', 's', 's', 'ss', 'a', 'a', 'sa', 'aa'];
}
