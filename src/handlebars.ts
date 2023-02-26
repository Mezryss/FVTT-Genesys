/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */

export function register() {
	/** String Utilities */
	Handlebars.registerHelper('capitalize', /** @param {string} value */ (value) => value.capitalize());
	Handlebars.registerHelper('toLowerCase', /** @param {string} value */ (value) => value.toLowerCase());
	Handlebars.registerHelper('toUpperCase', /** @param {string} value */ (value) => value.toUpperCase());
	Handlebars.registerHelper('concat', (...values) => values.filter((v) => v && typeof v === 'string').join(''));
	Handlebars.registerHelper('split', /** @param {string} value */ (value) => value.split(' '));

	/** Math Utilities */
	Handlebars.registerHelper('add', (lhs, rhs) => lhs + rhs);
	Handlebars.registerHelper('sub', (lhs, rhs) => lhs - rhs);
	Handlebars.registerHelper('mul', (lhs, rhs) => lhs * rhs);
	Handlebars.registerHelper('div', (lhs, rhs) => lhs / rhs);
	Handlebars.registerHelper('min', (lhs, rhs) => Math.min(lhs, rhs));
	Handlebars.registerHelper('max', (lhs, rhs) => Math.max(lhs, rhs));
	Handlebars.registerHelper('abs', (val) => Math.abs(val));
	Handlebars.registerHelper('floor', (val) => Math.floor(val));
	Handlebars.registerHelper('toFixed', (val: number, fractionDigits: number) => val.toFixed(fractionDigits));

	/** Logic Utilities */
	Handlebars.registerHelper('and', (lhs, rhs) => lhs && rhs);
	Handlebars.registerHelper('or', (lhs, rhs) => lhs || rhs);
	Handlebars.registerHelper('not', (val) => !val);

	/** Iteration utilities */
	Handlebars.registerHelper('repeat', (times, options) => {
		const results = [];

		for (let i = 0; i < times; i++) {
			results.push(options.fn(i));
		}

		return results.join('');
	});
}
