/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Minion Sheet
 */

import AdversarySheet from '@/actor/sheets/AdversarySheet';
import VueMinionSheet from '@/vue/sheets/actor/MinionSheet.vue';
import GenesysItem from '@/item/GenesysItem';
import BaseItemDataModel from '@/item/data/BaseItemDataModel';
import { ActorSheetContext } from '@/vue/SheetContext';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';

/**
 * Actor sheet used for Player Characters
 */
export default class MinionSheet extends AdversarySheet {
	override get vueComponent() {
		return VueMinionSheet;
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

		// If the dropped item is a Skill, verify we don't already have it on the sheet.
		if (droppedItem.type === 'skill' && this.actor.items.find((i) => i.type === droppedItem.type && i.name.toLowerCase() === droppedItem.name.toLowerCase())) {
			return false;
		}

		return super._onDropItem(event, data);
	}
}
