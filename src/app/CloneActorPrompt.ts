import { ContextBase } from '@/vue/SheetContext';
import VueSheet from '@/vue/VueSheet';
import VueCloneActorPrompt from '@/vue/apps/CloneActorPrompt.vue';

import GenesysActor from '@/actor/GenesysActor';

export interface CloneActorPromptContext extends ContextBase {
	targetActor: GenesysActor;
	resolvePromise: (targetActor?: GenesysActor) => void;
}

export default class CloneActorPrompt extends VueSheet(Application) {
	override get vueComponent() {
		return VueCloneActorPrompt;
	}

	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			classes: ['app-clone-actor-prompt'],
			width: 100,
			title: game.i18n.localize('Genesys.CloneActorPrompt.Title'),
		};
	}

	static async promptForInstantiation(targetActor: GenesysActor) {
		const sheet = new CloneActorPrompt(targetActor);
		await sheet.render(true);

		return new Promise<GenesysActor | undefined>((resolve) => {
			sheet.#resolvePromise = resolve;
		});
	}

	readonly targetActor: GenesysActor;
	#resolvePromise?: (targetActor?: GenesysActor) => void;

	constructor(targetActor: GenesysActor) {
		super();

		this.targetActor = targetActor;
	}

	override async getVueContext(): Promise<CloneActorPromptContext> {
		return {
			targetActor: this.targetActor,
			resolvePromise: async (targetActor) => {
				this.#resolvePromise?.(targetActor);
				this.#resolvePromise = undefined;

				await this.close();
			},
		};
	}

	override async close(options = {}) {
		this.#resolvePromise?.();
		await super.close(options);
	}
}
