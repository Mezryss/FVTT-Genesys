/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Dice roll prompt app.
 */

import GenesysActor from '@/actor/GenesysActor';
import SkillDataModel from '@/item/data/SkillDataModel';
import GenesysItem from '@/item/GenesysItem';
import { ContextBase } from '@/vue/SheetContext';
import VueDicePrompt from '@/vue/apps/DicePrompt.vue';
import WeaponDataModel from '@/item/data/WeaponDataModel';
import VueSheet from '@/vue/VueSheet';

export enum RollType {
	Skill,
	Attack,
	Initiative,
}

export interface DicePromptContext extends ContextBase {
	actor: GenesysActor;
	skills: GenesysItem<SkillDataModel>[];
	startingDifficulty: number;
	startingSkillId: string;
	app: DicePrompt;
	rollType: RollType;
	rollData: any;
}

export type AttackRollData = {
	weapon: GenesysItem<WeaponDataModel>;
};

export type InitiativeRollData = {
	resolvePromise: (roll: { roll: Roll; skillName: string }) => void;
	rejectPromise: () => void;
};

type DicePromptOptions = {
	rollType?: RollType;
	startingDifficulty?: number;
	rollData?: { [key: string]: any };
};

/**
 * Dice pool prompt.
 */
export default class DicePrompt extends VueSheet(Application) {
	override get vueComponent() {
		return VueDicePrompt;
	}

	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			classes: ['app-dice-prompt'],
			width: 500,
		};
	}

	static async promptForRoll(actor: GenesysActor, skillId: string, options: DicePromptOptions = {}) {
		const app = new DicePrompt(actor, skillId, options);
		await app.render(true);
	}

	static async promptForInitiative(actor: GenesysActor, skillId: string, options: DicePromptOptions = {}) {
		return new Promise<{ roll: Roll; skillName: string }>((resolve, reject) => {
			const app = new DicePrompt(actor, skillId, {
				...options,
				rollType: RollType.Initiative,
				rollData: { resolvePromise: resolve, rejectPromise: reject },
			});

			app.render(true);
		});
	}

	actor: GenesysActor;
	skillId: string;
	startingDifficulty: number;
	rollType: RollType;
	rollData?: { [key: string]: any };

	get actorSkills(): GenesysItem<SkillDataModel>[] {
		return <GenesysItem<SkillDataModel>[]>this.actor.items.filter((i) => i.type === 'skill');
	}

	constructor(actor: GenesysActor, skillId: string, { rollType, startingDifficulty, rollData }: DicePromptOptions = {}) {
		super();

		this.actor = actor;
		this.skillId = skillId;
		this.startingDifficulty = startingDifficulty ?? 2;
		this.rollType = rollType ?? RollType.Skill;
		this.rollData = rollData;
	}

	override async close(options: {} = {}) {
		if (this.rollType === RollType.Initiative) {
			(this.rollData as InitiativeRollData).rejectPromise();
		}

		await super.close(options);
	}

	override async getVueContext(): Promise<DicePromptContext> {
		return {
			actor: this.actor,
			skills: this.actorSkills,
			startingDifficulty: this.startingDifficulty,
			startingSkillId: this.skillId,
			app: this,
			rollType: this.rollType,
			rollData: this.rollData,
		};
	}
}
