// Override the typings for various CONFIG values in order to provide strongly-typed config within the system.
declare const CONFIG: Config<
	AmbientLightDocument,
	ActiveEffect,
	Actor,
	ActorDirectory<Actor>,
	ChatLog,
	ChatMessage,
	Combat,
	Combatant<Combat, Actor>,
	CombatTracker<Combat>,
	CompendiumDirectory,
	Hotbar,
	Item,
	Macro,
	MeasuredTemplateDocument,
	TileDocument,
	TokenDocument,
	Scene,
	User,
	EffectsCanvasGroup
>;
