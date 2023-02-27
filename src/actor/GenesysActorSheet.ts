/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Basic Actor Sheet
 */
import GenesysActor from '@/actor/GenesysActor';
import BaseItemDataModel from '@/item/data/BaseItemDataModel';
import GenesysItem from '@/item/GenesysItem';

import './GenesysActorSheet.scss';
import DicePrompt from '@/app/DicePrompt';

export default class GenesysActorSheet<ActorDataModel extends foundry.abstract.DataModel = foundry.abstract.DataModel, ItemDataModel extends BaseItemDataModel = BaseItemDataModel> extends ActorSheet<
	GenesysActor<ActorDataModel>,
	GenesysItem<ItemDataModel>
> {
	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			classes: ['genesys', 'sheet', 'actor'],
			width: 720,
			height: 640,
		};
	}

	override activateListeners(html: JQuery) {
		super.activateListeners(html);

		setTimeout(() => {
			html.find('[data-skill-check]').on('click', async (event) => {
				const target = $(event.delegateTarget);

				// Grab the skill name & difficulty
				const skillName = <string>target.data('skill-check');
				const difficulty = parseInt(target.data('difficulty'));

				// Does this actor possess the skill in question?
				const matchingSkill = <GenesysItem>this.actor.items.find((i) => i.name.toLowerCase() === skillName.toLowerCase());

				const skillId = matchingSkill ? matchingSkill.id : '-';

				await DicePrompt.promptForRoll(this.actor, skillId, { startingDifficulty: difficulty });
			});
		}, 250);
	}
}
