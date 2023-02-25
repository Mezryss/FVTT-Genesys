/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Central point of registration for all game settings.
 */

import { register as registerCampaignSettings } from './campaign';
import { register as registerStoryPoints } from './storyPoints';

import { register as registerAlpha } from './alpha';

/**
 * Namespace used to access system settings from {@link Game.settings}.
 */
export const NAMESPACE = 'genesys';

/**
 * Register all system settings.
 */
export function register() {
	registerCampaignSettings(NAMESPACE);
	registerStoryPoints(NAMESPACE);

	registerAlpha(NAMESPACE);
}
