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
import SkillDataModel from '@/item/data/SkillDataModel';
import GenesysItem from '@/item/GenesysItem';

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

	/** Miscellaneous **/
	skills: [] as GenesysItem<SkillDataModel>[],
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

	game.settings.settings.get<string>(`${SETTINGS_NAMESPACE}.${KEY_SKILLS_COMPENDIUM}`)?.onChange?.(game.settings.get(SETTINGS_NAMESPACE, KEY_SKILLS_COMPENDIUM));
	game.settings.settings.get<string>(`${SETTINGS_NAMESPACE}.${KEY_SKILL_FOR_INJURIES}`)?.onChange?.(game.settings.get(SETTINGS_NAMESPACE, KEY_SKILL_FOR_INJURIES));
	game.settings.settings.get<string>(`${SETTINGS_NAMESPACE}.${KEY_SKILL_FOR_REPAIRING_VEHICLE_HITS}`)?.onChange?.(game.settings.get(SETTINGS_NAMESPACE, KEY_SKILL_FOR_REPAIRING_VEHICLE_HITS));
	game.settings.settings.get<string>(`${SETTINGS_NAMESPACE}.${KEY_MONEY_NAME}`)?.onChange?.(game.settings.get(SETTINGS_NAMESPACE, KEY_MONEY_NAME));
	game.settings.settings.get<number>(`${SETTINGS_NAMESPACE}.${KEY_CAREER_SKILL_RANKS}`)?.onChange?.(game.settings.get(SETTINGS_NAMESPACE, KEY_CAREER_SKILL_RANKS));
	game.settings.settings.get<boolean>(`${SETTINGS_NAMESPACE}.${KEY_UNCOUPLE_SKILLS_FROM_CHARACTERISTICS}`)?.onChange?.(game.settings.get(SETTINGS_NAMESPACE, KEY_UNCOUPLE_SKILLS_FROM_CHARACTERISTICS));
	game.settings.settings.get<boolean>(`${SETTINGS_NAMESPACE}.${KEY_SHOW_DAMAGE_ON_FAILURE}`)?.onChange?.(game.settings.get(SETTINGS_NAMESPACE, KEY_SHOW_DAMAGE_ON_FAILURE));
	game.settings.settings.get<boolean>(`${SETTINGS_NAMESPACE}.${KEY_SUPER_CHARACTERISTICS}`)?.onChange?.(game.settings.get(SETTINGS_NAMESPACE, KEY_SUPER_CHARACTERISTICS));

	/** User Settings **/

	CONFIG.genesys.useMagicalGirlSymbols = game.settings.get<boolean>(SETTINGS_NAMESPACE, KEY_USE_MAGICAL_GIRL_SYMBOLS) ?? false;

	// eslint-disable-next-line
	if (!!game.workers.get) {
		CONFIG.genesys.showChanceToSucceedFromPermutations = game.settings.get<boolean>(SETTINGS_NAMESPACE, KEY_CHANCE_TO_SUCCEED_BY_PERMUTATION) ?? false;
	}

	game.settings.settings.get<number>(`${SETTINGS_NAMESPACE}.${KEY_CHANCE_TO_SUCCEED_BY_SIMULATION}`)?.onChange?.(game.settings.get(SETTINGS_NAMESPACE, KEY_CHANCE_TO_SUCCEED_BY_SIMULATION));
}
