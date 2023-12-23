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
		default: GENESYS_CONFIG.useMagicalGirlSymbols,
		type: Boolean,
		requiresReload: true,
	});

	// This setting is only available for FVTT v11+ because it depends on the changes made to the workers API
	// introduced in that version.
	if (game.workers.get) {
		game.settings.register(namespace, KEY_CHANCE_TO_SUCCEED_BY_PERMUTATION, {
			name: game.i18n.localize('Genesys.Settings.DicePoolChanceToSucceedByPermutation'),
			hint: game.i18n.localize('Genesys.Settings.DicePoolChanceToSucceedByPermutationHint'),
			scope: 'client',
			config: true,
			default: GENESYS_CONFIG.showChanceToSucceedFromPermutations,
			type: Boolean,
			requiresReload: true,
		});
	}

	game.settings.register(namespace, KEY_CHANCE_TO_SUCCEED_BY_SIMULATION, {
		name: game.i18n.localize('Genesys.Settings.DicePoolChanceToSucceedBySimulation'),
		hint: game.i18n.localize('Genesys.Settings.DicePoolChanceToSucceedBySimulationHint'),
		scope: 'client',
		config: true,
		default: GENESYS_CONFIG.showChanceToSucceedFromSimulations.amountOfRolls,
		type: Number,
		onChange: (value) => {
			const valueAsInt = Math.floor(Math.abs((value as unknown as number) ?? 0));
			CONFIG.genesys.showChanceToSucceedFromSimulations.enabled = valueAsInt > 0;
			CONFIG.genesys.showChanceToSucceedFromSimulations.amountOfRolls = valueAsInt;
		},
	});
}
