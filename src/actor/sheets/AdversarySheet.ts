/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Shared functionality between the Minion, Rival, and Nemesis Sheets.
 */

import GenesysActorSheet from '@/actor/GenesysActorSheet';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';
import GenesysItem from '@/item/GenesysItem';
import BaseItemDataModel from '@/item/data/BaseItemDataModel';
import TalentDataModel from '@/item/data/TalentDataModel';
import SkillDataModel from '@/item/data/SkillDataModel';
import VueSheet from '@/vue/VueSheet';
import { ActorSheetContext } from '@/vue/SheetContext';

/**
 * Actor sheet used for Player Characters
 */
export default class AdversarySheet extends VueSheet(GenesysActorSheet<AdversaryDataModel>) {
	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'stats',
				},
			],
			width: 480,
		};
	}

	override async getVueContext(): Promise<ActorSheetContext<AdversaryDataModel>> {
		return {
			sheet: this,
			data: await this.getData(),
		};
	}

	protected override async _onDropItem(event: DragEvent, data: DropCanvasData<'Item', GenesysItem<BaseItemDataModel>>) {
		if (!this.isEditable || !data.uuid) {
			return false;
		}

		const droppedItem: GenesysItem | undefined = await (<any>GenesysItem.implementation).fromDropData(data);
		if (!droppedItem) {
			return false;
		}

		// If the dropped item is an Ability, verify we don't already have it on the sheet.
		if (droppedItem.type === 'ability' && this.actor.items.find((i) => i.type === droppedItem.type && i.name.toLowerCase() === droppedItem.name.toLowerCase())) {
			return false;
		}

		// If the dropped item is a Talent, rank it up if we already have it instead of adding a new copy.
		if (['talent', 'skill'].includes(droppedItem.type)) {
			const existingItem = <GenesysItem<TalentDataModel> | GenesysItem<SkillDataModel> | undefined>this.actor.items.find((i) => i.type === droppedItem.type && i.name.toLowerCase() === droppedItem.name.toLowerCase());

			if (existingItem) {
				await existingItem.update({
					'system.rank': existingItem.systemData.rank + 1,
				});

				return false;
			}
		}

		// If it's a skill, and we've reached this point, we need to apply the first rank to it.
		if (droppedItem.type === 'skill' && this.actor.type !== 'minion') {
			const [skill] = await this._onDropItemCreate(droppedItem.toObject());

			await skill.update({ 'system.rank': 1 });

			return false;
		}

		return super._onDropItem(event, data);
	}
}
