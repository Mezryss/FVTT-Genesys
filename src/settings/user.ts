/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file User-specific config options.
 */

/**
 * Whether the user wishes to use the Magical Girl symbols.
 */
export const KEY_USE_MAGICAL_GIRL_SYMBOLS = 'useMagicalGirlSymbols';

/**
 * Number of simulated rolls to do to calculate the dice pool success chance. A value of 0 disables the feature.
 */
export const KEY_DICE_POOL_APPROXIMATION = 'dicePoolApproximation';

export function register(namespace: string) {
	game.settings.register(namespace, KEY_USE_MAGICAL_GIRL_SYMBOLS, {
		name: game.i18n.localize('Genesys.Settings.UseMagicalGirlSymbols'),
		hint: game.i18n.localize('Genesys.Settings.UseMagicalGirlSymbolsHint'),
		scope: 'client',
		config: true,
		default: false,
		type: Boolean,
		requiresReload: true,
	});

	game.settings.register(namespace, KEY_DICE_POOL_APPROXIMATION, {
		name: game.i18n.localize('Genesys.Settings.DicePoolApproximation'),
		hint: game.i18n.localize('Genesys.Settings.DicePoolApproximationHint'),
		scope: 'client',
		config: true,
		default: 0,
		type: Number,
	});
}
