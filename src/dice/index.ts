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
 * Registers custom dice types.
 */
export function register() {
	CONFIG.Dice.terms[BoostDie.DENOMINATION] = BoostDie;
	CONFIG.Dice.terms[AbilityDie.DENOMINATION] = AbilityDie;
	CONFIG.Dice.terms[ProficiencyDie.DENOMINATION] = ProficiencyDie;
	CONFIG.Dice.terms[SetbackDie.DENOMINATION] = SetbackDie;
	CONFIG.Dice.terms[DifficultyDie.DENOMINATION] = DifficultyDie;
	CONFIG.Dice.terms[ChallengeDie.DENOMINATION] = ChallengeDie;
}
