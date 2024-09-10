/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */

export function register() {
	/** String Utilities */
	Handlebars.registerHelper('capitalize', (value: string) => value.capitalize());
	Handlebars.registerHelper('toLowerCase', (value: string) => value.toLowerCase());
	Handlebars.registerHelper('toUpperCase', (value: string) => value.toUpperCase());
	Handlebars.registerHelper('concat', (...values: any[]) => values.filter((v) => v && typeof v === 'string').join(''));
	Handlebars.registerHelper('split', (value: string) => value.split(' '));
	Handlebars.registerHelper('isSubstringOf', (substring: string, fullString: string) => fullString.includes(substring));

	/** Math Utilities */
	Handlebars.registerHelper('add', (lhs: number, rhs: number) => lhs + rhs);
	Handlebars.registerHelper('sub', (lhs: number, rhs: number) => lhs - rhs);
	Handlebars.registerHelper('mul', (lhs: number, rhs: number) => lhs * rhs);
	Handlebars.registerHelper('div', (lhs: number, rhs: number) => lhs / rhs);
	Handlebars.registerHelper('min', (lhs: number, rhs: number) => Math.min(lhs, rhs));
	Handlebars.registerHelper('max', (lhs: number, rhs: number) => Math.max(lhs, rhs));
	Handlebars.registerHelper('abs', (val: number) => Math.abs(val));
	Handlebars.registerHelper('floor', (val: number) => Math.floor(val));
	Handlebars.registerHelper('toFixed', (val: number, fractionDigits: number) => val.toFixed(fractionDigits));

	/** Logic Utilities */
	Handlebars.registerHelper('and', (lhs: boolean, rhs: boolean) => lhs && rhs);
	Handlebars.registerHelper('or', (lhs: boolean, rhs: boolean) => lhs || rhs);
	Handlebars.registerHelper('not', (val: boolean) => !val);

	/** Iteration utilities */
	Handlebars.registerHelper('repeat', (times: number, options: { fn: (time: number) => string | number }) => {
		const results = [];

		for (let i = 0; i < times; i++) {
			results.push(options.fn(i));
		}

		return results.join('');
	});
}
