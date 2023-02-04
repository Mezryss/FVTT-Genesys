/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file VueApplication class definition.
 */

import { App, createApp, reactive, UnwrapNestedRefs } from 'vue';
import { ContextBase, RootContext } from '@/vue/SheetContext';

export default abstract class VueApplication<ContextClass extends ContextBase = ContextBase> extends Application {
	/**
	 * Root element the Vue app is mounted to.
	 */
	protected rootElement?: HTMLElement;

	/**
	 * Handle for the active Vue App.
	 * @protected
	 */
	protected vueApp?: App;

	/**
	 * Reactive context data that is injected into the active Vue app.
	 * @protected
	 */
	protected vueContext?: UnwrapNestedRefs<ContextClass>;

	/**
	 * This component must be implemented by children to define the Vue component to use for the sheet.
	 * @protected
	 */
	protected abstract get vueComponent(): any;

	/**
	 * Similar in purpose to getData but with some potentially Vue-specific context data.
	 *
	 * The base getData() result will be passed to data, so it is safe to follow standard Foundry practice if Vue-specific data is unnecessary.
	 */
	protected abstract getVueContext(): Promise<ContextClass>;

	/**
	 * Initializes & updates the Vue app.
	 */
	protected override async _renderInner(data: object, options: RenderOptions) {
		const vueContext = await this.getVueContext();

		// Instantiate our form object.
		if (!this.rootElement) {
			const rootElement = document.createElement('div');

			rootElement.className = `vue-app ${options?.classes?.join(' ') ?? ''}`;
			rootElement.setAttribute('autocomplete', 'off');

			this.rootElement = rootElement;
		}

		// Verify our reactive context is set up
		if (!this.vueContext) {
			this.vueContext = reactive(vueContext);
		}

		// Initialize the vue app if necessary
		if (!this.vueApp) {
			this.vueApp = createApp(this.vueComponent);
			this.vueApp.provide(RootContext, this.vueContext);

			this.vueApp.mount(this.rootElement);
		} else {
			// Update context & actor data injected into the existing Vue app
			for (const key of Object.keys(vueContext)) {
				(<any>this.vueContext)[key] = vueContext[key];
			}
		}

		return $(this.rootElement);
	}

	/**
	 * Unmount and destroy the sfc app for this sheet on close.
	 */
	override async close(options = {}) {
		this.vueApp?.unmount();
		this.vueApp = undefined;
		this.vueContext = undefined;
		this.rootElement = undefined;

		await super.close(options);
	}

	/**
	 * Deactivate JQuery event listeners to prevent them triggering multiple times.
	 * @param html
	 */
	deactivateListeners(html: JQuery) {
		// ActorSheet Listeners
		html.find('img[data-edit]').off('click');

		// FormApplication Listeners
		html.find('input,select,textarea').off('change');
		html.find('button.file-picker').off('click');
	}

	override activateListeners(html: JQuery) {
		this.deactivateListeners(html);

		super.activateListeners(html);
	}
}
