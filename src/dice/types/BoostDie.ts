/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Definition for the Boost die.
 */

import GenesysDie from '@/dice/types/GenesysDie';

/**
 * Boost (blue) Die
 */
export default class BoostDie extends GenesysDie {
	static override DENOMINATION = 'b';
	static override FACES = [' ', ' ', 's', 'sa', 'aa', 'a'];
}
