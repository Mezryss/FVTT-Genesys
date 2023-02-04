/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file VueActorSheet class definition.
 */

import { App, createApp, reactive, UnwrapNestedRefs } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import GenesysActorSheet from '@/actor/GenesysActorSheet';
import GenesysActor from '@/actor/GenesysActor';

/**
 * A specialized implementation of ActorSheet that makes use of a Vue component for rendering.
 */
export default abstract class VueActorSheet<ActorDataModel extends foundry.abstract.DataModel = foundry.abstract.DataModel> extends GenesysActorSheet<ActorDataModel> {
	/**
	 * Handle for the active Vue App.
	 * @protected
	 */
	protected vueApp?: App;

	/**
	 * Reactive context data that is injected into the active Vue app.
	 * @protected
	 */
	protected vueContext?: UnwrapNestedRefs<ActorSheetContext<ActorDataModel>>;

	/**
	 * This component must be implemented by children to define the Vue component to use for the sheet.
	 * @protected
	 */
	protected abstract get vueComponent(): any;

	/**
	 * Similar in purpose to {@link ActorSheet.getData}, but with some potentially Vue-specific context data.
	 *
	 * The base getData() result will be passed to data, so it is safe to follow standard Foundry practice if Vue-specific data is unnecessary.
	 */
	async getVueContext(): Promise<ActorSheetContext<ActorDataModel>> {
		return {
			sheet: this,
			data: await this.getData(),
		};
	}

	/**
	 * Initializes & updates the Vue app.
	 */
	protected override async _renderInner(_data: FormApplicationData<GenesysActor<ActorDataModel>>, _options: RenderOptions) {
		const vueContext = await this.getVueContext();

		// Instantiate our form object.
		if (!this.form) {
			const form = document.createElement('form');

			form.className = `${vueContext.data.cssClass} vue-app`;
			form.setAttribute('autocomplete', 'off');

			this.form = form;
		}

		// Verify our reactive context is set up
		if (!this.vueContext) {
			this.vueContext = reactive(vueContext);
		}

		// Initialize the vue app if necessary
		if (!this.vueApp) {
			this.vueApp = createApp(this.vueComponent);
			this.vueApp.provide(RootContext, this.vueContext);

			this.vueApp.mount(this.form);
		} else {
			// Update context & actor data injected into the existing Vue app
			for (const key of Object.keys(vueContext)) {
				this.vueContext[key] = vueContext[key];
			}
		}

		return $(<HTMLElement>this.form);
	}

	/**
	 * Unmount and destroy the sfc app for this sheet on close.
	 */
	override async close(options = {}) {
		this.vueApp?.unmount();
		this.vueApp = undefined;
		this.vueContext = undefined;

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

	protected override _activateEditor(_: JQuery | HTMLElement) {}
	override async saveEditor(name: string, _: { remove?: boolean } = {}): Promise<void> {}
}
