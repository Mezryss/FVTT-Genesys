/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Fonts registration.
 */

import './scss/all.scss';

/**
 * Build a shared font definition structure.
 *
 * @param path Path to the font file, including extension, within the assets/fonts/ folder.
 * @param style Font style
 * @param weight Font weights
 */
function buildDefinition(path: string, style: 'normal' | 'italic' = 'normal', weight: string = '400'): FontDefinition {
	return {
		urls: [`systems/genesys/assets/fonts/${path}`],
		style,
		weight,
	};
}

/**
 * Registers all fonts that should be made available to the text editor.
 */
export function register() {
	// Bebas Neue, often used for headers. Only Regular is available as OFL, though.
	CONFIG.fontDefinitions['Bebas Neue'] = {
		editor: true,
		fonts: [buildDefinition('BebasNeue-Regular.ttf')],
	};

	// Roboto
	CONFIG.fontDefinitions['Roboto'] = {
		editor: true,
		fonts: [
			buildDefinition('Roboto/Roboto-Thin.ttf', 'normal', '100'),
			buildDefinition('Roboto/Roboto-ThinItalic.ttf', 'italic', '100'),
			buildDefinition('Roboto/Roboto-Light.ttf', 'normal', '300'),
			buildDefinition('Roboto/Roboto-LightItalic.ttf', 'italic', '300'),
			buildDefinition('Roboto/Roboto-Regular.ttf', 'normal', '400'),
			buildDefinition('Roboto/Roboto-Italic.ttf', 'italic', '400'),
			buildDefinition('Roboto/Roboto-Medium.ttf', 'normal', '500'),
			buildDefinition('Roboto/Roboto-MediumItalic.ttf', 'italic', '500'),
			buildDefinition('Roboto/Roboto-Bold.ttf', 'normal', '700'),
			buildDefinition('Roboto/Roboto-BoldItalic.ttf', 'italic', '700'),
			buildDefinition('Roboto/Roboto-Black.ttf', 'normal', '900'),
			buildDefinition('Roboto/Roboto-BlackItalic.ttf', 'italic', '900'),
		],
	};

	// Roboto Condensed
	CONFIG.fontDefinitions['Roboto Condensed'] = {
		editor: true,
		fonts: [
			buildDefinition('Roboto_Condensed/RobotoCondensed-Light.ttf', 'normal', '300'),
			buildDefinition('Roboto_Condensed/RobotoCondensed-LightItalic.ttf', 'italic', '300'),
			buildDefinition('Roboto_Condensed/RobotoCondensed-Regular.ttf', 'normal', '400'),
			buildDefinition('Roboto_Condensed/RobotoCondensed-Italic.ttf', 'italic', '400'),
			buildDefinition('Roboto_Condensed/RobotoCondensed-Bold.ttf', 'normal', '700'),
			buildDefinition('Roboto_Condensed/RobotoCondensed-BoldItalic.ttf', 'italic', '700'),
		],
	};

	// Roboto Slab
	CONFIG.fontDefinitions['Roboto Slab'] = {
		editor: true,
		fonts: [buildDefinition('RobotoSlab-VariableFont_wght.ttf', 'normal', '100 900')],
	};

	// Roboto Mono
	CONFIG.fontDefinitions['Roboto Mono'] = {
		editor: true,
		fonts: [buildDefinition('RobotoMono-VariableFont_wght.ttf', 'normal', '100 700'), buildDefinition('RobotoMono-Italic-VariableFont_wght.ttf', 'italic', '100 700')],
	};

	// Roboto Serif
	CONFIG.fontDefinitions['Roboto Serif'] = {
		editor: true,
		fonts: [buildDefinition('RobotoSerif-VariableFont_GRAD,opsz,wdth,wght.ttf', 'normal', '100 900'), buildDefinition('RobotoSerif-Italic-VariableFont_GRAD,opsz,wdth,wght.ttf', 'italic', '100 900')],
	};

	// Genesys Symbols
	CONFIG.fontDefinitions['Genesys Symbols'] = {
		// Making this available for the editor allows the font to be used for dice symbols, meaning users can customize their colors if they choose!
		editor: true,
		fonts: [buildDefinition('GenesysSymbols-Regular-Ligatures.woff2', 'normal', '400')],
	};
}
