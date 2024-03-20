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
import { DragTransferData } from '@/data/DragTransferData';

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

		let clonedDroppedItem: GenesysItem<BaseItemDataModel>[] | undefined | boolean;
		if (AdversaryDataModel.isRelevantTypeForContext('SKILL', droppedItem.type)) {
			const existingItem = this.actor.items.find((item) => item.type === droppedItem.type && item.name === droppedItem.name) as GenesysItem<SkillDataModel> | undefined;

			if (existingItem) {
				// If the skill already exists just rank it.
				await existingItem.update({
					'system.rank': existingItem.systemData.rank + 1,
				});
			} else if (this.actor.type !== 'minion') {
				// If the skill is not on this adversary then add it with 1 rank.
				clonedDroppedItem = await this._onDropItemCreate(droppedItem.toObject());

				await clonedDroppedItem[0].update({ 'system.rank': 1 });
			} else {
				// Let `super` handle the drop and save a reference to it.
				clonedDroppedItem = await super._onDropItem(event, data);
			}
		} else if (AdversaryDataModel.isRelevantTypeForContext('COMBAT', droppedItem.type)) {
			// Let `super` handle the drop and save a reference to it.
			clonedDroppedItem = await super._onDropItem(event, data);
		} else if (AdversaryDataModel.isRelevantTypeForContext('TALENT', droppedItem.type)) {
			const existingItem = this.actor.items.find((item) => item.type === droppedItem.type && item.name === droppedItem.name);

			if (droppedItem.type === 'ability') {
				// If the dropped item is an ability, verify we don't already have it on the sheet.
				if (existingItem) {
					return false;
				} else {
					// Let `super` handle the drop and save a reference to it.
					clonedDroppedItem = await super._onDropItem(event, data);
				}
			} else if (droppedItem.type === 'talent') {
				if (existingItem) {
					// If the talent already exists just rank it.
					await existingItem.update({
						'system.rank': (existingItem as GenesysItem<TalentDataModel>).systemData.rank + 1,
					});
				} else {
					// Let `super` handle the drop and save a reference to it.
					clonedDroppedItem = await super._onDropItem(event, data);
				}
			} else {
				// Let `super` handle the drop and save a reference to it.
				clonedDroppedItem = await super._onDropItem(event, data);
			}
		} else if (AdversaryDataModel.isRelevantTypeForContext('INVENTORY', droppedItem.type)) {
			// Let `super` handle the drop and save a reference to it.
			clonedDroppedItem = await super._onDropItem(event, data);
		} else {
			// If the dropped item is not of a type that we have a default behavior then end early.
			return false;
		}

		return clonedDroppedItem ?? false;
	}
}
