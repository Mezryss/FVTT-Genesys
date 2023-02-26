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
		GenesysCombat,
		GenesysCombatant,
		GenesysCombatTracker,
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

	const game: Game<GenesysActor, Actors, ChatMessage, GenesysCombat, GenesysItem, Macro, Scene, User>;
}
