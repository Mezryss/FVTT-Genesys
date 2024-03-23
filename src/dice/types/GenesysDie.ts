/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Root type of all the custom Die types in the Genesys system.
 */

import { GenesysDieFace } from '@/dice/types/GenesysSymbol';

export type DieCategory = 'positive' | 'negative';

/**
 * Base type of all custom Genesys dice.
 */
export default abstract class GenesysDie extends Die {
	/**
	 * The text glyph used to symbolize this die.
	 */
	static readonly GLYPH: string = '';

	/**
	 * The format used when adding this die to a roll.
	 */
	static readonly FORMULA: `d${string}` = 'd';

	/**
	 * The category to which the die belongs.
	 */
	static readonly CATEGORY: DieCategory = 'positive';

	/**
	 * The color glyph used to symbolize this die.
	 */
	static readonly COLOR: string = '';

	/**
	 * Faces of this die type.
	 */
	static readonly FACES: GenesysDieFace[] = [];

	/**
	 * Utility method for accessing the class's static denomination from the child.
	 */
	get denomination() {
		return (this.constructor as typeof Die).DENOMINATION;
	}

	constructor(termData: DiceTermData) {
		super({ ...termData, faces: 1 });

		this.faces = (this.constructor as typeof GenesysDie).FACES.length;
	}

	/**
	 * Result display should always use the symbol font class.
	 */
	override getResultCSS(_: DiceTermResult): (string | null)[] {
		return ['font-genesys-symbols'];
	}

	/**
	 * Fetch the actual label for each result from the die class's specified faces.
	 */
	override getResultLabel(result: DiceTermResult): string {
		const FACES = (this.constructor as typeof GenesysDie).FACES;

		return FACES[result.result - 1] ?? 'unknown';
	}
}
