/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */

import { NAMESPACE as SETTINGS_NAMESPACE } from '@/settings';
import { KEY_USE_MAGICAL_GIRL_SYMBOLS } from '@/settings/user';

export const GENESYS_CONFIG = {
	/**
	 * Whether to use the Magical Girl symbols where possible in the system.
	 */
	useMagicalGirlSymbols: true,
};

/**
 * Called during 'init' hook to initialize the Genesys config data.
 */
export function register() {
	CONFIG.genesys = GENESYS_CONFIG;
}

/**
 * Called on 'ready' to initialize values that rely on items established in init.
 */
export function ready() {
	CONFIG.genesys.useMagicalGirlSymbols = game.settings.get(SETTINGS_NAMESPACE, KEY_USE_MAGICAL_GIRL_SYMBOLS) as boolean;
}
