/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Effect registration
 */
import GenesysEffect from '@/effects/GenesysEffect';
import GenesysEffectSheet from '@/effects/GenesysEffectSheet';

export function register() {
	CONFIG.ActiveEffect.documentClass = GenesysEffect;

	if (game.version.startsWith('13')) {
		// @ts-expect-error
		CONFIG.ActiveEffect.legacyTransferral = true;
	}

	DocumentSheetConfig.unregisterSheet(ActiveEffect, 'core', ActiveEffectConfig);
	DocumentSheetConfig.registerSheet(ActiveEffect, 'genesys', GenesysEffectSheet, {
		makeDefault: true,
	});
}
