/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file System Entry Point
 */

import { register as registerDice } from '@/dice';
import { register as registerEnrichers } from '@/enrichers';
import { register as registerFonts } from '@/fonts';
import { register as registerHandlebarsHelpers } from '@/handlebars';
import { register as registerSettings } from '@/settings';

import { register as registerStoryPointTracker } from '@/app/StoryPointTracker';
import { register as registerActors } from '@/actor';
import { register as registerEffects } from '@/effects';
import { register as registerItems } from '@/item';

import './scss/index.scss';

Hooks.once('init', async () => {
	console.debug('Genesys | Initializing...');

	// System Documents
	registerActors();
	registerEffects();
	registerItems();

	// Misc. modules with one-time registrations
	registerDice();
	registerEnrichers();
	registerFonts();
	registerHandlebarsHelpers();
	registerSettings();

	console.debug('Genesys | Initialization Complete.');
});

Hooks.once('ready', async () => {
	registerStoryPointTracker();
});
