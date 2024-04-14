/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file User-specific config options.
 */

import { GENESYS_CONFIG } from '@/config';

/**
 * Whether the user wishes to use the Magical Girl symbols.
 */
export const KEY_USE_MAGICAL_GIRL_SYMBOLS = 'useMagicalGirlSymbols';

/**
 * Wheter to collapse the 'Pool Modifications' section when a dice prompt renders.
 */
export const KEY_COLLAPSE_POOL_MODIFICATIONS = 'dicePoolCollapseModificationsDetails';

/**
 * Wheter to automatically apply all the pool modifications shown on the dice prompt.
 */
export const KEY_AUTO_APPLY_POOL_MODIFICATIONS = 'dicePoolAutoApplyModifications';

/**
 * Wheter the user wants to calculate the chance to succeed by constructing the permutations on a Web Worker.
 */
export const KEY_CHANCE_TO_SUCCEED_BY_PERMUTATION = 'dicePoolChanceToSucceedByPermutation';

/**
 * Number of simulated rolls to do to calculate the dice pool success chance. A value of 0 disables the feature.
 */
export const KEY_CHANCE_TO_SUCCEED_BY_SIMULATION = 'dicePoolApproximation';

export function register(namespace: string) {
	game.settings.register(namespace, KEY_USE_MAGICAL_GIRL_SYMBOLS, {
		name: game.i18n.localize('Genesys.Settings.UseMagicalGirlSymbols'),
		hint: game.i18n.localize('Genesys.Settings.UseMagicalGirlSymbolsHint'),
		scope: 'client',
		config: true,
		default: GENESYS_CONFIG.settings.useMagicalGirlSymbols,
		type: Boolean,
		requiresReload: true,
	});

	game.settings.register(namespace, KEY_COLLAPSE_POOL_MODIFICATIONS, {
		name: game.i18n.localize('Genesys.Settings.DicePoolCollapseModifications'),
		hint: game.i18n.localize('Genesys.Settings.DicePoolCollapseModificationsHint'),
		scope: 'client',
		config: true,
		default: GENESYS_CONFIG.settings.startWithCollapsedPoolModifications,
		type: Boolean,
		onChange: (value) => {
			const valueAsBool = (value as unknown as boolean) ?? false;
			CONFIG.genesys.settings.startWithCollapsedPoolModifications = valueAsBool;
		},
	});

	game.settings.register(namespace, KEY_AUTO_APPLY_POOL_MODIFICATIONS, {
		name: game.i18n.localize('Genesys.Settings.DicePoolAutoApplyModifications'),
		hint: game.i18n.localize('Genesys.Settings.DicePoolAutoApplyModificationsHint'),
		scope: 'client',
		config: true,
		default: GENESYS_CONFIG.settings.autoApplyPoolModifications,
		type: Boolean,
		onChange: (value) => {
			const valueAsBool = (value as unknown as boolean) ?? false;
			CONFIG.genesys.settings.autoApplyPoolModifications = valueAsBool;
		},
	});

	game.settings.register(namespace, KEY_CHANCE_TO_SUCCEED_BY_PERMUTATION, {
		name: game.i18n.localize('Genesys.Settings.DicePoolChanceToSucceedByPermutation'),
		hint: game.i18n.localize('Genesys.Settings.DicePoolChanceToSucceedByPermutationHint'),
		scope: 'client',
		config: !!game.workers.get, // eslint-disable-line -- Only show setting for FVTT v11+
		default: GENESYS_CONFIG.settings.showChanceToSucceedFromPermutations,
		type: Boolean,
		requiresReload: true,
	});

	game.settings.register(namespace, KEY_CHANCE_TO_SUCCEED_BY_SIMULATION, {
		name: game.i18n.localize('Genesys.Settings.DicePoolChanceToSucceedBySimulation'),
		hint: game.i18n.localize('Genesys.Settings.DicePoolChanceToSucceedBySimulationHint'),
		scope: 'client',
		config: true,
		default: GENESYS_CONFIG.settings.showChanceToSucceedFromSimulations.amountOfRolls,
		type: Number,
		onChange: (value) => {
			const valueAsInt = Math.floor(Math.abs((value as unknown as number) ?? 0));
			CONFIG.genesys.settings.showChanceToSucceedFromSimulations.enabled = valueAsInt > 0;
			CONFIG.genesys.settings.showChanceToSucceedFromSimulations.amountOfRolls = valueAsInt;
		},
	});
}
