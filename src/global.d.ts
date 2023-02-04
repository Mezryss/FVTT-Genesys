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

declare global {
	const ui: FoundryUI;

	// Override the typings for various CONFIG values in order to provide strongly-typed config within the system.
	const CONFIG: Config<
		AmbientLightDocument,
		GenesysEffect,
		GenesysActor,
		ActorDirectory<GenesysActor>,
		ChatLog,
		ChatMessage,
		Combat,
		Combatant<Combat, GenesysActor>,
		CombatTracker<Combat>,
		CompendiumDirectory,
		Hotbar,
		GenesysItem,
		Macro,
		MeasuredTemplateDocument,
		TileDocument,
		TokenDocument,
		Scene,
		User,
		EffectsCanvasGroup
	>;

	const game: Game<GenesysActor, Actors, ChatMessage, Combat, GenesysItem, Macro, Scene, User>;
}
