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
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';
import { DragTransferData } from '@/data/DragTransferData';

/**
 * Actor sheet used for Player Characters
 */
export default class MinionSheet extends AdversarySheet {
	override get vueComponent() {
		return VueMinionSheet;
	}

	protected override async _onDropItem(event: DragEvent, data: DropCanvasData<'Item', GenesysItem<BaseItemDataModel>>) {
		// Regardless of what was dropped this is the last spot to process it.
		event.stopPropagation();

		// Check that the we have the UUID of the item that was dropped.
		const dragData = data as DragTransferData;
		if (!dragData.uuid) {
			return false;
		}

		// Make sure that the item in question exists and this actor doesn't own it.
		const droppedItem = await fromUuid<GenesysItem<BaseItemDataModel>>(dragData.uuid);
		if (!droppedItem || droppedItem.actor?.uuid === this.actor.uuid) {
			return false;
		}

		// We must be able to edit the actor to proceed.
		if (!this.isEditable) {
			return false;
		}

		// If the dropped item is a skill make sure we don't have it already.
		if (AdversaryDataModel.isRelevantTypeForContext('SKILL', droppedItem.type)) {
			if (this.actor.items.find((item) => item.type === droppedItem.type && item.name === droppedItem.name)) {
				return false;
			}
		}

		// Let `super` handle the drop.
		return super._onDropItem(event, data);
	}
}
