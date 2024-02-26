/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file XP Award Prompt Application
 */

import VueAwardXPPrompt from '@/vue/apps/AwardXPPrompt.vue';
import { ContextBase } from '@/vue/SheetContext';
import VueSheet from '@/vue/VueSheet';

type AwardData = {
	/**
	 * Amount of XP awarded to the player.
	 */
	amount: number;

	/**
	 * Details about why the XP was awarded.
	 */
	reason: string;
};

export interface AwardXPContext extends ContextBase {
	resolvePromise: (value: AwardData) => void;
}

/**
 * Prompt the user for an XP Award.
 */
export default class AwardXPPrompt extends VueSheet(Application) {
	override get vueComponent() {
		return VueAwardXPPrompt;
	}

	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			classes: ['app-award-xp-prompt'],
			width: 400,
			title: game.i18n.localize('Genesys.RewardsPrompt.Title'),
		};
	}

	static async promptForXPAward(): Promise<AwardData | undefined> {
		const sheet = new AwardXPPrompt();
		await sheet.render(true);

		return new Promise<AwardData | undefined>((resolve) => {
			sheet.#resolvePromise = resolve;
		});
	}

	#resolvePromise?: (value: AwardData | undefined) => void;

	override async getVueContext(): Promise<AwardXPContext> {
		return {
			resolvePromise: async (data) => {
				this.#resolvePromise?.(data);
				this.#resolvePromise = undefined;

				await this.close();
			},
		};
	}

	override async close(options = {}) {
		this.#resolvePromise?.(undefined);
		await super.close(options);
	}
}
