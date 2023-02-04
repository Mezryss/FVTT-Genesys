/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Definition for the Setback die.
 */

import GenesysDie from '@/dice/types/GenesysDie';

/**
 * Setback (black) Die
 */
export default class SetbackDie extends GenesysDie {
	static override DENOMINATION = 's';
	static override FACES = [' ', ' ', 'f', 'f', 'h', 'h'];
}
