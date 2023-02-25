export const KEY_ALPHA_VERSION = 'alphaVersion';

export function register(namespace: string) {
	game.settings.register(namespace, KEY_ALPHA_VERSION, {
		name: 'Alpha Version',
		config: false,
		default: '0.0.0',
		type: String,
		scope: 'world',
	});
}
