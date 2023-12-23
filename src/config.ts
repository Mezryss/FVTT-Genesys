/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */

import { NAMESPACE as SETTINGS_NAMESPACE } from '@/settings';
import {
	KEY_CAREER_SKILL_RANKS,
	KEY_MONEY_NAME,
	KEY_SHOW_DAMAGE_ON_FAILURE,
	KEY_SKILLS_COMPENDIUM,
	KEY_SKILL_FOR_INJURIES,
	KEY_SKILL_FOR_REPAIRING_VEHICLE_HITS,
	KEY_SUPER_CHARACTERISTICS,
	KEY_UNCOUPLE_SKILLS_FROM_CHARACTERISTICS,
} from '@/settings/campaign';
import { KEY_CHANCE_TO_SUCCEED_BY_PERMUTATION, KEY_CHANCE_TO_SUCCEED_BY_SIMULATION, KEY_USE_MAGICAL_GIRL_SYMBOLS } from '@/settings/user';

/**
 * Default skills compendium to use if the setting is misconfigured.
 */
export const DEFAULT_SKILLS_COMPENDIUM = 'genesys.crb-skills';

export const GENESYS_CONFIG = {
	/** World Settings **/

	// Default skills compendium to use if the setting is misconfigured.
	skillsCompendium: DEFAULT_SKILLS_COMPENDIUM,

	// The name of the skill to use for healing Critical Injuries.
	skillForHealingInjury: 'Resilience',

	// The name of the skill to use for repairing Critical Hits.
	skillForRepairingHit: 'Mechanics',

	// Name of the currency used for the setting.
	currencyName: 'Money',

	// Number of free skill ranks characters gain from careers.
	freeCareerSkillRanks: 4,

	// Whether to allow use of the Uncoupling Skills from Characteristics alternate rule.
	uncoupleSkillsFromCharacteristics: false,

	// Whether to show Damage, Critical, and Qualities on attack roll chat cards even when the roll was a failure.
	showAttackDetailsOnFailure: false,

	// Whether to use the optional rule for super-characteristics.
	useSuperCharacteristics: false,

	/** User Settings **/

	// Whether to use the Magical Girl symbols where possible in the system.
	useMagicalGirlSymbols: false,

	// Wheter to show the chance to succeed of a dice pool by constructing permutations.
	showChanceToSucceedFromPermutations: false,

	showChanceToSucceedFromSimulations: {
		// Wheter to show the chance to succeed of a dice pool by performing simulations.
		enabled: false,

		// Number of simulated rolls to do to calculate the dice pool success chance.
		amountOfRolls: 0,
	},
};

/**
 * Called during 'init' hook to initialize the Genesys config data.
 */
export function register() {
	CONFIG.genesys = GENESYS_CONFIG;
}

/**
 * Called on 'ready' to initialize the values of the Genesys CONFIG with the settings established in init.
 */
export function ready() {
	/** World Settings **/

	CONFIG.genesys.skillsCompendium = (game.settings.get(SETTINGS_NAMESPACE, KEY_SKILLS_COMPENDIUM) as string) ?? '';
	CONFIG.genesys.skillForHealingInjury = (game.settings.get(SETTINGS_NAMESPACE, KEY_SKILL_FOR_INJURIES) as string) ?? '';
	CONFIG.genesys.skillForRepairingHit = (game.settings.get(SETTINGS_NAMESPACE, KEY_SKILL_FOR_REPAIRING_VEHICLE_HITS) as string) ?? '';
	CONFIG.genesys.currencyName = (game.settings.get(SETTINGS_NAMESPACE, KEY_MONEY_NAME) as string) ?? '';
	CONFIG.genesys.freeCareerSkillRanks = Math.floor(Math.abs((game.settings.get(SETTINGS_NAMESPACE, KEY_CAREER_SKILL_RANKS) as number) ?? 0));
	CONFIG.genesys.uncoupleSkillsFromCharacteristics = (game.settings.get(SETTINGS_NAMESPACE, KEY_UNCOUPLE_SKILLS_FROM_CHARACTERISTICS) as boolean) ?? false;
	CONFIG.genesys.showAttackDetailsOnFailure = (game.settings.get(SETTINGS_NAMESPACE, KEY_SHOW_DAMAGE_ON_FAILURE) as boolean) ?? false;
	CONFIG.genesys.useSuperCharacteristics = (game.settings.get(SETTINGS_NAMESPACE, KEY_SUPER_CHARACTERISTICS) as boolean) ?? false;

	/** User Settings **/

	CONFIG.genesys.useMagicalGirlSymbols = (game.settings.get(SETTINGS_NAMESPACE, KEY_USE_MAGICAL_GIRL_SYMBOLS) as boolean) ?? false;

	if (game.workers.get) {
		CONFIG.genesys.showChanceToSucceedFromPermutations = (game.settings.get(SETTINGS_NAMESPACE, KEY_CHANCE_TO_SUCCEED_BY_PERMUTATION) as boolean) ?? false;
	}

	const amountOfRolls = Math.floor(Math.abs((game.settings.get(SETTINGS_NAMESPACE, KEY_CHANCE_TO_SUCCEED_BY_SIMULATION) as number) ?? 0));
	CONFIG.genesys.showChanceToSucceedFromSimulations.enabled = amountOfRolls > 0;
	CONFIG.genesys.showChanceToSucceedFromSimulations.amountOfRolls = amountOfRolls;
}
