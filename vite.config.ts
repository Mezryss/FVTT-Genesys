import { AliasOptions, defineConfig } from 'vite';
import pluginVue from '@vitejs/plugin-vue';
import path from 'path';

/**
 * A list of aliases to be applied only in production.
 */
let releaseOnlyAliases: AliasOptions = [];

let devOnlyAliases: AliasOptions = [];

if (process.env.NODE_ENV === 'production') {
	releaseOnlyAliases = [{ find: 'vue', replacement: path.resolve(__dirname, 'external/vue.esm-browser.prod.js') }];
} else {
	devOnlyAliases = [];
}

// https://vitejs.dev/config/
export default defineConfig({
	// Proxy w/Foundry. See https://foundryvtt.wiki/en/development/guides/vite
	base: '/systems/genesys',
	server: {
		port: 30001,
		open: true,
		proxy: {
			'^/assets': 'http://localhost:30000/systems/genesys/',
			'^(?!/systems/genesys)': 'http://localhost:30000/',
			'/socket.io': {
				target: 'ws://localhost:30000',
				ws: true,
			},
		},
	},
	publicDir: 'public',
	build: {
		outDir: 'dist',
		emptyOutDir: true,
		sourcemap: true,
		// Avoiding minification is important, because we don't want names of globals/etc. to be mangled.
		minify: false,
		lib: {
			name: 'Genesys',
			entry: 'src/Genesys.ts',
			formats: ['es'], // ES Modules
			fileName: 'Genesys',
		},
	},
	plugins: [pluginVue()],
	resolve: {
		alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }, { find: '@scss', replacement: path.resolve(__dirname, 'src/scss') }, ...devOnlyAliases, ...releaseOnlyAliases],
	},
});
