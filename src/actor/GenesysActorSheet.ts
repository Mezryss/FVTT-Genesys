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

		if (this.isEditable) {
			// Foundry v10 and v11 bind this functionality differently so instead we override that behavior with our own.
			html.find('img[data-edit]').off('click');
			html.find('img[data-edit]').on('click', this._onEditImage.bind(this));
		}

		setTimeout(() => {
			html.find('[data-skill-check]').on('click', async (event) => {
				const target = $(event.delegateTarget);

				// Grab the skill name & difficulty
				const skillName = <string>target.data('skill-check');
				const difficulty = parseInt(target.data('difficulty'));

				await DicePrompt.promptForRoll(this.actor, skillName, { difficulty });
			});
		}, 250);
	}
}
