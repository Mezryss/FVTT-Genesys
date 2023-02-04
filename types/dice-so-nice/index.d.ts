type DicePreset = {
	/**
	 * Should be a registered dice term (e.g. "d20")
	 */
	type: string;

	/**
	 * Contains either string (Unicode) or a path to a texture (png, gif, jpg, webp)
	 */
	labels: string[];

	/**
	 * Should be a system ID previously registered.
	 *
	 * @see {@link dice3d.addSystem}
	 */
	system: string;

	/**
	 * The name of a colorset (either a custom one or from the DsN colorset list)
	 */
	colorset?: string;

	/**
	 * The name of the font family. This can be a Webfont too (ex: Arial, monospace, etc). This setting overwrites the colorset font setting.
	 */
	font?: string;

	/**
	 * Scale of the font size (default: 1). This setting overwrites the colorset fontScale setting.
	 */
	fontScale?: number;

	/**
	 * Array of bumpMap textures that should follow the exact same order as labels.
	 */
	bumpMaps?: (string|undefined)[];

	/**
	 * Min and max value on the die.
	 */
	values?: {
		min: number;
		max: number;
	};

	/**
	 * Array of emissive textures that should follow the exact same order as labels.
	 */
	emissiveMaps?: string[];

	/**
	 * Color of the light (hexa code) emitted by the dice. Default: 0x000000 (no light)
	 */
	emissive?: string;
};

type ColorSet = {
	/**
	 * A string ID for the colorset.
	 */
	name: string;

	/**
	 * Localized string for settings
	 */
	description: string;

	/**
	 * Used to group the colorsets in the settings.
	 */
	category: string;

	/**
	 * Colors of the labels.
	 */
	foreground?: string|string[];

	/**
	 * Colors of the dice.
	 */
	background?: string|string[];

	/**
	 * Colors of the label outline. Can be 'none'.
	 */
	outline?: string|string[];

	/**
	 * Colors of the edges. Can be 'none'.
	 */
	edge?: string|string[];

	/**
	 * Array of ID, or a single ID of the texture to use if "None / Auto (Theme)" is selected in settings. If it is a custom texture, make sure to call this function after the Promise from `addTexture` is resolved.
	 */
	texture?: string|string[];

	/**
	 * ID of the material to use if "Auto (Theme)" is selected in settings.
	 */
	material?: 'plastic'|'metal'|'glass'|'wood'|'pristine'|'iridescent'|'chrome';

	/**
	 * Name of the font family. This can be a Webfont too (ex: Arial, monospace, etc)
	 */
	font?: string;

	/**
	 * Object containing the fontScale for as many dice types as wanted.
	 */
	fontScale?: Record<string, number>;

	/**
	 * Set to 'hidden' if you do not want this colorset to be visible in the players' theme list. Useful for internal colorsets.
	 */
	visibility?: 'visible'|'hidden';
};

declare class Dice3d {
	/**
	 * Register a new system.
	 *
	 * The id is to be used with the addDicePreset method.
	 * The name can be a localized string.
	 *
	 * @param system
	 * @param mode "preferred" will enable this system by default until a user changes it to anything else. Default will add the system as a choice left to each user.
	 *
	 * @see {@link https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/wikis/API/Customization#adding-a-custom-model-system-aka-dice-face-preset}
	 */
	addSystem(system: {id: string, name: string}, mode: 'preferred'|'default'): void;

	/**
	 * A custom DicePreset will override a default dice type when its system is selected in the "Dice So Nice" settings.
	 *
	 * Note: the texture files size have to be 256*256 pixels
	 *
	 * @param data
	 * @param shape
	 *
	 * @see {@link https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/wikis/API/Customization#adding-a-custom-dicepreset-dice-faces}
	 */
	addDicePreset(data: DicePreset, shape?: string);

	/**
	 * Add a texture to the list of textures and preload it.
	 *
	 * @param textureID
	 * @param data
	 *
	 * @see {@link https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/wikis/API/Customization#adding-a-custom-texture}
	 */
	addTexture(textureID: string, data: {name: string, composite: string, source: string, bump?: string}): Promise<unknown>;

	/**
	 * Add a colorset (theme)
	 *
	 * @param colorset
	 * @param mode "default" only register the colorset, "preferred" apply the colorset if the player didn't already change his dice appearance for this world.
	 *
	 * @see {@link https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/wikis/API/Customization#adding-a-custom-colorset-theme}
	 */
	addColorset(colorset: ColorSet, mode: 'default'|'preferred')

	/**
	 * Change the default value of the showExtraDice settings.
	 *
	 * @param show
	 *
	 * @see {@link https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/wikis/API/Customization#show-all-extra-dice-by-default-for-new-users}
	 */
	showExtraDiceByDefault(show?: boolean);
}
