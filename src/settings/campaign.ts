/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file System settings data related to campaign setting customization.
 */

import { DEFAULT_DIFFICULTY, DEFAULT_SKILLS_COMPENDIUM, GENESYS_CONFIG } from '@/config';
import { PoolModGlyphPattern } from '@/dice/types/GenesysPoolModifications';
import SkillDataModel from '@/item/data/SkillDataModel';
import GenesysItem from '@/item/GenesysItem';

/**
 * The Skills Compendium to use for default skill data.
 */
export const KEY_SKILLS_COMPENDIUM = 'skillsCompendium';

/**
 * The default difficulty of a check.
 */
export const KEY_DEFAULT_DIFFICULTY = 'defaultDifficulty';

/**
 * The name of the skill to use for healing Critical Injuries.
 */
export const KEY_SKILL_FOR_INJURIES = 'skillForInjuries';

/**
 * The name of the skill to use for repairing Critical Hits.
 */
export const KEY_SKILL_FOR_REPAIRING_VEHICLE_HITS = 'skillForRepairingVehicleHits';

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
 * Whether to show Damage, Critical, and Qualities on attack roll chat cards even when the roll was a failure.
 */
export const KEY_SHOW_DAMAGE_ON_FAILURE = 'showDamageOnFailure';

/**
 * Whether to use the optional rule for super-characteristics.
 */
export const KEY_SUPER_CHARACTERISTICS = 'useSuperCharacteristics';

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
		default: GENESYS_CONFIG.settings.skillsCompendium,
		type: String,
		onChange: async (value) => {
			// We always want a skill compendium so fallback to the default value if it's ever removed.
			let skillsCompendiumName = DEFAULT_SKILLS_COMPENDIUM;
			if (!value) {
				ui.notifications.warn('Genesys.Notifications.NoSkillsCompendium', { localize: true });
				CONFIG.genesys.settings.skillsCompendium = skillsCompendiumName;
			} else {
				CONFIG.genesys.settings.skillsCompendium = skillsCompendiumName = value;
			}

			let skills: GenesysItem<SkillDataModel>[] = [];

			// Attempt to load the pack.
			const pack = game.packs.get(skillsCompendiumName);
			if (!pack) {
				ui.notifications.error(game.i18n.format('Genesys.Notifications.MissingCompendium', { name: skillsCompendiumName }));
			} else if (pack.metadata.type !== 'Item') {
				ui.notifications.error(game.i18n.format('Genesys.Notifications.WrongCompendiumType', { name: skillsCompendiumName, type: pack.metadata.type }));
			} else if (!pack.index.some((item) => item.type === 'skill')) {
				ui.notifications.warn(game.i18n.format('Genesys.Notifications.NoSkillsInCompendium', { name: skillsCompendiumName }));
			} else {
				skills = (await pack.getDocuments()).filter((item) => (item as GenesysItem).type === 'skill') as GenesysItem<SkillDataModel>[];
			}

			CONFIG.genesys.skills = skills;
		},
	});

	game.settings.register(namespace, KEY_DEFAULT_DIFFICULTY, {
		name: game.i18n.localize('Genesys.Settings.DefaultDifficulty'),
		hint: game.i18n.localize('Genesys.Settings.DefaultDifficultyHint'),
		scope: 'world',
		config: true,
		default: GENESYS_CONFIG.settings.defaultDifficulty,
		type: String,
		onChange: (value) => {
			const difficulty = value ?? '';
			const difficultyPattern = new RegExp(`^${PoolModGlyphPattern.source}*$`);
			CONFIG.genesys.settings.defaultDifficulty = difficultyPattern.test(difficulty) ? difficulty : DEFAULT_DIFFICULTY;
		},
	});

	game.settings.register(namespace, KEY_SKILL_FOR_INJURIES, {
		name: game.i18n.localize('Genesys.Settings.SkillForInjuries'),
		hint: game.i18n.localize('Genesys.Settings.SkillForInjuriesHint'),
		scope: 'world',
		config: true,
		default: GENESYS_CONFIG.settings.skillForHealingInjury,
		type: String,
		onChange: (value) => {
			CONFIG.genesys.settings.skillForHealingInjury = value ?? '';
		},
	});

	game.settings.register(namespace, KEY_SKILL_FOR_REPAIRING_VEHICLE_HITS, {
		name: game.i18n.localize('Genesys.Settings.SkillForRepairingVehicleHits'),
		hint: game.i18n.localize('Genesys.Settings.SkillForRepairingVehicleHitsHint'),
		scope: 'world',
		config: true,
		default: GENESYS_CONFIG.settings.skillForRepairingHit,
		type: String,
		onChange: (value) => {
			CONFIG.genesys.settings.skillForRepairingHit = value ?? '';
		},
	});

	game.settings.register(namespace, KEY_MONEY_NAME, {
		name: game.i18n.localize('Genesys.Settings.Money'),
		hint: game.i18n.localize('Genesys.Settings.MoneyHint'),
		scope: 'world',
		config: true,
		default: GENESYS_CONFIG.settings.currencyName,
		type: String,
		onChange: (value) => {
			CONFIG.genesys.settings.currencyName = value ?? '';
		},
	});

	game.settings.register(namespace, KEY_CAREER_SKILL_RANKS, {
		name: game.i18n.localize('Genesys.Settings.CareerSkillRanks'),
		hint: game.i18n.localize('Genesys.Settings.CareerSkillRanksHint'),
		scope: 'world',
		config: true,
		default: GENESYS_CONFIG.settings.freeCareerSkillRanks,
		type: Number,
		onChange: (value) => {
			const valueAsInt = Math.floor(Math.abs((value as unknown as number) ?? 0));
			CONFIG.genesys.settings.freeCareerSkillRanks = valueAsInt;
		},
	});

	game.settings.register(namespace, KEY_UNCOUPLE_SKILLS_FROM_CHARACTERISTICS, {
		name: game.i18n.localize('Genesys.Settings.UncoupleSkillsAlternateRule'),
		hint: game.i18n.localize('Genesys.Settings.UncoupleSkillsAlternateRuleHint'),
		scope: 'world',
		config: true,
		default: GENESYS_CONFIG.settings.uncoupleSkillsFromCharacteristics,
		type: Boolean,
		onChange: (value) => {
			const valueAsBool = (value as unknown as boolean) ?? false;
			CONFIG.genesys.settings.uncoupleSkillsFromCharacteristics = valueAsBool;
		},
	});

	game.settings.register(namespace, KEY_SHOW_DAMAGE_ON_FAILURE, {
		name: game.i18n.localize('Genesys.Settings.ShowDamageOnFailure'),
		hint: game.i18n.localize('Genesys.Settings.ShowDamageOnFailureHint'),
		scope: 'world',
		config: true,
		default: GENESYS_CONFIG.settings.showAttackDetailsOnFailure,
		type: Boolean,
		onChange: (value) => {
			const valueAsBool = (value as unknown as boolean) ?? false;
			CONFIG.genesys.settings.showAttackDetailsOnFailure = valueAsBool;
		},
	});

	game.settings.register(namespace, KEY_SUPER_CHARACTERISTICS, {
		name: game.i18n.localize('Genesys.Settings.SuperCharacteristics'),
		hint: game.i18n.localize('Genesys.Settings.SuperCharacteristicsHint'),
		scope: 'world',
		config: true,
		default: GENESYS_CONFIG.settings.useSuperCharacteristics,
		type: Boolean,
		onChange: (value) => {
			const valueAsBool = (value as unknown as boolean) ?? false;
			CONFIG.genesys.settings.useSuperCharacteristics = valueAsBool;
		},
	});
}
