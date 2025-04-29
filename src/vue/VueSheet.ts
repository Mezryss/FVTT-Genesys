/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Mixin for empowering Applications with Sheets!
 */

import { App, createApp, reactive, UnwrapNestedRefs } from 'vue';
import { ContextBase, RootContext } from '@/vue/SheetContext';

type Constructor = new (...args: any[]) => {
	activateListeners(html: JQuery): void;
	close(options?: {}): Promise<void>;
};

function preventSubmit(event: SubmitEvent) {
	event.preventDefault();
}

export default function VueSheet<TBase extends Constructor, ContextType extends ContextBase | undefined = ContextBase>(base: TBase) {
	return class extends base {
		form?: HTMLFormElement;
		preventSubmit?: boolean;

		/**
		 * Handle for the active Vue app.
		 */
		vueApp?: App;

		/**
		 * Reactive context data that is injected into the active Vue app.
		 */
		vueContext?: UnwrapNestedRefs<ContextType>;

		/**
		 * This component must be implemented by children to define the Vue component to use for the sheet.
		 */
		get vueComponent(): any {
			return null;
		}

		/**
		 * Similar in purpose to {@link Application.getData}, but with some potentially Vue-specific context data.
		 */
		async getVueContext(): Promise<ContextType | undefined> {
			return undefined;
		}

		async _renderInner(_data: unknown, options: any) {
			const vueContext = await this.getVueContext();

			// Instantiate our form object.
			if (!this.form) {
				const form = document.createElement('form');

				const cssClass = (vueContext as any)?.data?.cssClass ?? (options?.classes && (options?.classes as string[] | undefined))?.join(' ') ?? '';

				form.className = `${cssClass} vue-app`;
				form.setAttribute('autocomplete', 'off');

				this.form = form;
				this.preventSubmit = !!options?.preventSubmit;
			}

			// Verify our reactive context is set up
			if (!this.vueContext && vueContext) {
				this.vueContext = reactive(vueContext);
			}

			// Initialize the vue app if necessary
			if (!this.vueApp) {
				this.vueApp = createApp(this.vueComponent);
				this.vueApp.provide(RootContext, this.vueContext);

				this.vueApp.mount(this.form);
			} else if (this.vueContext && vueContext) {
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
		 */
		deactivateListeners(html: JQuery) {
			html.find('img[data-edit]').off('click');
			html.find('input,select,textarea').off('change');
			html.find('button.file-picker').off('click');
			if (this.preventSubmit) {
				this.form?.removeEventListener('submit', preventSubmit);
			}
		}

		override activateListeners(html: JQuery) {
			this.deactivateListeners(html);

			super.activateListeners(html);

			if (this.preventSubmit) {
				this.form?.addEventListener('submit', preventSubmit);
			}
		}

		_activateEditor(_: JQuery | HTMLElement) {}
		async saveEditor(name: string, _: { remove?: boolean } = {}) {}
	};
}
