/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Provides overridden, system-specific type data for Foundry's CONFIG global.
 */

import GenesysActor from '@/actor/GenesysActor';
import GenesysEffect from '@/effects/GenesysEffect';
import GenesysItem from '@/item/GenesysItem';
import GenesysCombat from '@/combat/GenesysCombat';
import GenesysCombatant from '@/combat/GenesysCombatant';
import GenesysCombatTracker from '@/combat/GenesysCombatTracker';
import { GENESYS_CONFIG } from '@/config';
import GenesysActorDirectory from '@/sidebar/GenesysActorDirectory';
import GenesysItemDirectory from '@/sidebar/GenesysItemDirectory';

declare global {
	const ui: FoundryUI<
		GenesysActor,
		GenesysActorDirectory<GenesysActor>,
		GenesysItem,
		GenesysItemDirectory<GenesysItem>,
		ChatMessage<GenesysActor>,
		ChatLog<ChatMessage<GenesysActor>>,
		CompendiumDirectory,
		GenesysCombatTracker<GenesysCombat>
	>;
	const canvas: Canvas;

	interface GenesysConfig
		extends Config<
			AmbientLightDocument,
			GenesysEffect,
			GenesysActor,
			GenesysActorDirectory<GenesysActor>,
			ChatLog,
			ChatMessage,
			GenesysCombat,
			GenesysCombatant,
			GenesysCombatTracker,
			CompendiumDirectory,
			Hotbar,
			GenesysItem,
			GenesysItemDirectory<GenesysItem>,
			Macro,
			MeasuredTemplateDocument,
			TileDocument,
			TokenDocument,
			Scene,
			User,
			EffectsCanvasGroup
		> {
		genesys: typeof GENESYS_CONFIG;
	}

	// Override the typings for various CONFIG values in order to provide strongly-typed config within the system.
	const CONFIG: GenesysConfig;

	const game: Game<GenesysActor, Actors<GenesysActor>, ChatMessage<GenesysActor>, GenesysCombat, GenesysItem, Macro, Scene, User<GenesysActor>>;
}
