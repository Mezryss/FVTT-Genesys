/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Custom dice type registration.
 */

import AbilityDie from '@/dice/types/AbilityDie';
import BoostDie from '@/dice/types/BoostDie';
import ProficiencyDie from '@/dice/types/ProficiencyDie';
import SetbackDie from '@/dice/types/SetbackDie';
import DifficultyDie from '@/dice/types/DifficultyDie';
import ChallengeDie from '@/dice/types/ChallengeDie';

import './diceSoNice';

/**
 * An object used to get general details of each dice type.
 */
export const DieType = {
	Proficiency: ProficiencyDie,
	Ability: AbilityDie,
	Boost: BoostDie,

	Challenge: ChallengeDie,
	Difficulty: DifficultyDie,
	Setback: SetbackDie,
};

/**
 * Registers custom dice types.
 */
export function register() {
	Object.values(DieType).forEach((dieType) => {
		CONFIG.Dice.terms[dieType.DENOMINATION] = dieType;
	});
}
