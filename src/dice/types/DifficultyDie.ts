/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Definition for the Difficulty die.
 */

import GenesysDie from '@/dice/types/GenesysDie';

/**
 * Difficulty (purple) Die
 */
export default class DifficultyDie extends GenesysDie {
	static override DENOMINATION = 'i';
	static override FACES = [' ', 'f', 'ff', 'h', 'h', 'h', 'hh', 'fh'];
}
