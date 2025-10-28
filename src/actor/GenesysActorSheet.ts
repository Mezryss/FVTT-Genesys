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

	protected override async _onDropFolder(event: DragEvent, data: DropCanvasData<'Folder'>): Promise<GenesysItem<ItemDataModel>[]> {
		if (!this.actor.isOwner) return [];
		const folder = await Folder.fromDropData(data);
		if (!folder) return [];
		if (folder.type !== 'Item') return [];

		const createdItems: GenesysItem<BaseItemDataModel>[] = [];

		const folderContent = folder.contents;
		for (const item of folderContent) {
			const creationResult = await this._onDropItem(new DragEvent(event.type), {
				uuid: item.uuid,
				x: data.x,
				y: data.y,
			});

			if (!creationResult) {
				continue;
			}

			if (Array.isArray(creationResult)) {
				createdItems.push(...creationResult);
			}
		}

		return createdItems;
	}

	override activateListeners(html: JQuery) {
		super.activateListeners(html);

		if (this.isEditable) {
			// Foundry v10 and v11 bind this functionality differently so instead we override that behavior with our own.
			html.find('img[data-edit]').off('click');
			html.find('img[data-edit]').on('click', this._onEditImage.bind(this));
		}

		setTimeout(() => {
			html.find('[data-skill-check]').off('click');
			html.find('[data-skill-check]').on('click', async (event) => {
				const target = $(event.delegateTarget);

				// Grab the skill name & difficulty
				const skillName: string = target.data('skill-check');
				const difficulty: string = target.data('difficulty');

				await DicePrompt.promptForRoll(this.actor, skillName, { difficulty });
			});
		}, 250);
	}
}
