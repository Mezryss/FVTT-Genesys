/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */

import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';
import VueCareerSkillPrompt from '@/vue/apps/CareerSkillPrompt.vue';
import { ContextBase } from '@/vue/SheetContext';
import VueSheet from '@/vue/VueSheet';

export interface CareerSkillPromptContext extends ContextBase {
	skills: GenesysItem<SkillDataModel>[];
	resolvePromise: (skillIDs: string[]) => void;
}

export default class CareerSkillPrompt extends VueSheet(Application) {
	override get vueComponent() {
		return VueCareerSkillPrompt;
	}

	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			classes: ['app-career-skill-prompt'],
			width: 400,
			title: game.i18n.localize('Genesys.CareerSkillPrompt.Title'),
		};
	}

	static async promptForSkills(skills: GenesysItem<SkillDataModel>[]): Promise<string[]> {
		const sheet = new CareerSkillPrompt(skills);
		await sheet.render(true);

		return new Promise((resolve) => {
			sheet.#resolvePromise = resolve;
		});
	}

	#resolvePromise?: (value: string[]) => void;
	readonly #skills: GenesysItem<SkillDataModel>[];

	constructor(skills: GenesysItem<SkillDataModel>[]) {
		super();

		this.#skills = skills;
	}

	override async getVueContext(): Promise<CareerSkillPromptContext> {
		return {
			resolvePromise: async (skillIDs) => {
				this.#resolvePromise?.(skillIDs);
				this.#resolvePromise = undefined;

				await this.close();
			},
			skills: this.#skills,
		};
	}

	override async close(options = {}) {
		this.#resolvePromise?.([]);
		await super.close(options);
	}
}
