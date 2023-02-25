/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file System settings data related to campaign setting customization.
 */

/**
 * The Skills Compendium to use for default skill data.
 */
export const KEY_SKILLS_COMPENDIUM = 'skillsCompendium';

/**
 * The name of the skill to use for healing Critical Injuries.
 */
export const KEY_SKILL_FOR_INJURIES = 'skillForInjuries';

/**
 * Name of the currency used for the setting.
 */
export const KEY_MONEY_NAME = 'currency';

/**
 * Number of free skill ranks characters gain from careers.
 */
export const KEY_CAREER_SKILL_RANKS = 'careerSkillRanks';

/**
 * Whether to allow use of the Uncoupling Skills from Characteristics alternate rule.
 */
export const KEY_UNCOUPLE_SKILLS_FROM_CHARACTERISTICS = 'uncoupleSkills';

/**
 * Default skills compendium to use if the setting is misconfigured.
 */
export const DEFAULT_SKILLS_COMPENDIUM = 'genesys.crb-skills';

/**
 * Whether to show Damage, Critical, and Qualities on attack roll chat cards even when the roll was a failure.
 */
export const KEY_SHOW_DAMAGE_ON_FAILURE = 'showDamageOnFailure';

/**
 * Register campaign settings.
 * @param namespace Namespace to register settings under.
 */
export function register(namespace: string) {
	game.settings.register(namespace, KEY_SKILLS_COMPENDIUM, {
		name: game.i18n.localize('Genesys.Settings.SkillsCompendium'),
		hint: game.i18n.localize('Genesys.Settings.SkillsCompendiumHint'),
		scope: 'world',
		config: true,
		default: DEFAULT_SKILLS_COMPENDIUM,
		type: String,
	});

	game.settings.register(namespace, KEY_SKILL_FOR_INJURIES, {
		name: game.i18n.localize('Genesys.Settings.SkillForInjuries'),
		hint: game.i18n.localize('Genesys.Settings.SkillForInjuriesHint'),
		scope: 'world',
		config: true,
		default: 'Resilience',
		type: String,
	});

	game.settings.register(namespace, KEY_MONEY_NAME, {
		name: game.i18n.localize('Genesys.Settings.Money'),
		hint: game.i18n.localize('Genesys.Settings.MoneyHint'),
		scope: 'world',
		config: true,
		default: 'Money',
		type: String,
	});

	game.settings.register(namespace, KEY_CAREER_SKILL_RANKS, {
		name: game.i18n.localize('Genesys.Settings.CareerSkillRanks'),
		hint: game.i18n.localize('Genesys.Settings.CareerSkillRanksHint'),
		scope: 'world',
		config: true,
		default: 4,
		type: Number,
	});

	game.settings.register(namespace, KEY_UNCOUPLE_SKILLS_FROM_CHARACTERISTICS, {
		name: game.i18n.localize('Genesys.Settings.UncoupleSkillsAlternateRule'),
		hint: game.i18n.localize('Genesys.Settings.UncoupleSkillsAlternateRuleHint'),
		scope: 'world',
		config: true,
		default: false,
		type: Boolean,
	});

	game.settings.register(namespace, KEY_SHOW_DAMAGE_ON_FAILURE, {
		name: game.i18n.localize('Genesys.Settings.ShowDamageOnFailure'),
		hint: game.i18n.localize('Genesys.Settings.ShowDamageOnFailureHint'),
		scope: 'world',
		config: true,
		default: false,
		type: Boolean,
	});
}
