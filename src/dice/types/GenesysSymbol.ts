export const GenesysSymbol = {
	Triumph: {
		GLYPH: 't',
		CATEGORY: 'positive',
	},
	Success: {
		GLYPH: 's',
		CATEGORY: 'positive',
	},
	Advantage: {
		GLYPH: 'a',
		CATEGORY: 'positive',
	},

	Despair: {
		GLYPH: 'd',
		CATEGORY: 'negative',
	},
	Failure: {
		GLYPH: 'f',
		CATEGORY: 'negative',
	},
	Threat: {
		GLYPH: 'h',
		CATEGORY: 'negative',
	},
} as const;

type SingleGlyph = (typeof GenesysSymbol)[keyof typeof GenesysSymbol]['GLYPH'] | '';
export type GenesysDieFace = SingleGlyph | `${SingleGlyph}${SingleGlyph}` | ' ';
