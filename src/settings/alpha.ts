export const KEY_ALPHA_VERSION = 'alphaVersion';
export const KEY_MIGRATION_VERSION = 'migrationVersion';

export function register(namespace: string) {
	game.settings.register(namespace, KEY_ALPHA_VERSION, {
		name: 'Alpha Version',
		config: false,
		default: '0.0.0',
		type: String,
		scope: 'world',
	});

	game.settings.register(namespace, KEY_MIGRATION_VERSION, {
		name: 'Migration Version',
		config: false,
		default: 2,
		type: Number,
		scope: 'world',
	});
}
