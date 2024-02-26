import { ContextBase } from '@/vue/SheetContext';
import VueSheet from '@/vue/VueSheet';
import VueSelectCharacterSkillPrompt from '@/vue/apps/SelectCharacterSkillPrompt.vue';

import GenesysActor from '@/actor/GenesysActor';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';

export type CharacterSkillOption = {
	actor: GenesysActor;
	skill: GenesysItem<SkillDataModel>;
};

export interface SelectCharacterSkillPromptContext extends ContextBase {
	characterSkillOptions: CharacterSkillOption[];
	resolvePromise: (selectedOption: CharacterSkillOption) => void;
}

export default class SelectCharacterSkillPrompt extends VueSheet(Application) {
	override get vueComponent() {
		return VueSelectCharacterSkillPrompt;
	}

	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			classes: ['app-select-character-skill-prompt'],
			width: 100,
			title: game.i18n.localize('Genesys.CharacterSkillPrompt.Title'),
		};
	}

	static async promptFromCharactersList(characterSkillOptions: CharacterSkillOption[]) {
		const sheet = new SelectCharacterSkillPrompt(characterSkillOptions);
		await sheet.render(true);

		return new Promise<CharacterSkillOption | undefined>((resolve) => {
			sheet.#resolvePromise = resolve;
		});
	}

	readonly characterSkillOptions: CharacterSkillOption[];
	#resolvePromise?: (selectedOption?: CharacterSkillOption) => void;

	constructor(characterSkillOptions: CharacterSkillOption[]) {
		super();

		this.characterSkillOptions = characterSkillOptions;
	}

	override async getVueContext(): Promise<SelectCharacterSkillPromptContext> {
		return {
			characterSkillOptions: this.characterSkillOptions,
			resolvePromise: async (selectedOption) => {
				this.#resolvePromise?.(selectedOption);
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
