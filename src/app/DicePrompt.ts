/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Dice roll prompt app.
 */

import GenesysActor from '@/actor/GenesysActor';
import GenesysItem from '@/item/GenesysItem';
import { ContextBase } from '@/vue/SheetContext';
import VueDicePrompt from '@/vue/apps/DicePrompt.vue';
import WeaponDataModel from '@/item/data/WeaponDataModel';
import VueSheet from '@/vue/VueSheet';
import { Characteristic } from '@/data/Characteristics';

export enum RollType {
	Simple,
	Skill,
	Attack,
	Initiative,
}

export interface DicePromptContext extends ContextBase {
	actor?: GenesysActor;
	skillName?: string;
	rollType: RollType;
	difficulty: number;
	rollUnskilled?: Characteristic;
	rollData: any;
	app: DicePrompt;
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
	difficulty?: number;
	rollUnskilled?: Characteristic;
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
			title: game.i18n.localize('Genesys.DicePrompt.Title'),
		};
	}

	static async promptForRoll(actor: GenesysActor | undefined, skillName: string, options: DicePromptOptions = {}) {
		const app = new DicePrompt(actor, skillName, options);
		await app.render(true);
	}

	static async promptForInitiative(actor: GenesysActor, skillName: string, options: DicePromptOptions = {}) {
		return new Promise<{ roll: Roll; skillName: string }>((resolve, reject) => {
			const app = new DicePrompt(actor, skillName, {
				...options,
				rollType: RollType.Initiative,
				rollData: { resolvePromise: resolve, rejectPromise: reject },
			});

			app.render(true);
		});
	}

	actor?: GenesysActor;
	skillName?: string;
	rollType: RollType;
	difficulty: number;
	rollUnskilled?: Characteristic;
	rollData?: { [key: string]: any };

	constructor(actor?: GenesysActor, skillName?: string, { rollType, difficulty, rollUnskilled, rollData }: DicePromptOptions = {}) {
		super();

		this.actor = actor;
		this.skillName = skillName;
		this.rollType = rollType ?? RollType.Skill;
		this.difficulty = difficulty ?? 2;
		this.rollUnskilled = rollUnskilled;
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
			skillName: this.skillName,
			rollType: this.rollType,
			difficulty: this.difficulty,
			rollUnskilled: this.rollUnskilled,
			rollData: this.rollData,
			app: this,
		};
	}
}

export const CALCULATE_CHANCE_WORKER_NAME = 'CalculateChance';

export function registerWorker() {
	// eslint-disable-next-line
	if (!!game.workers.get) {
		if (CONFIG.genesys.settings.showChanceToSucceedFromPermutations) {
			game.workers.createWorker(CALCULATE_CHANCE_WORKER_NAME, {
				scripts: ['../systems/genesys/scripts/calculate-chance-worker.js'],
			});
		}
	}
}
