/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Effect registration
 */
import GenesysEffect from '@/effects/GenesysEffect';
import GenesysEffectSheet from '@/effects/GenesysEffectSheet';
import GenesysEffectSheetV2 from './GenesysEffectSheetV2';

export function register() {
	CONFIG.ActiveEffect.documentClass = GenesysEffect;

	if (!game.version.startsWith('12')) {
		// @ts-expect-error
		CONFIG.ActiveEffect.legacyTransferral = true;
		// foundry.applications.sheets.ActiveEffectConfig = GenesysEffectSheetV2;
	}

	DocumentSheetConfig.unregisterSheet(ActiveEffect, 'core', ActiveEffectConfig);
	if (game.version.startsWith('12')) {
		DocumentSheetConfig.registerSheet(ActiveEffect, 'genesys', GenesysEffectSheet, {
			makeDefault: true,
		});
	} else {
		DocumentSheetConfig.registerSheet(ActiveEffect, 'genesys', GenesysEffectSheetV2, {
			makeDefault: true,
		});
	}
}
