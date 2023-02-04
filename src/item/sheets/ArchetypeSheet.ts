/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Archetype ItemSheet
 */

import ArchetypeDataModel from '@/item/data/ArchetypeDataModel';
import VueItemSheet from '@/vue/VueItemSheet';
import VueArchetypeSheet from '@/vue/sheets/item/ArchetypeSheet.vue';

import './WeaponSheet.scss';
import { DropData } from '@/item/GenesysItemSheet';
import GenesysItem from '@/item/GenesysItem';
import BaseItemDataModel from '@/item/data/BaseItemDataModel';

/**
 * List of item types that are not allowed to be granted by an archetype.
 */
const BLOCK_GRANTED_ITEM_TYPES = ['archetype', 'career', 'quality'];

export default class ArchetypeSheet extends VueItemSheet<ArchetypeDataModel> {
	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			classes: ['genesys', 'sheet', 'item', 'archetype'],
			width: 720,
			height: 780,
		};
	}

	protected override get vueComponent() {
		return VueArchetypeSheet;
	}

	protected override async _onDropItem(event: DragEvent, data: DropData): Promise<void> {
		if (!this.isEditable || !data.uuid) {
			return;
		}

		const droppedItem: GenesysItem<BaseItemDataModel> | undefined = await (<any>GenesysItem.implementation).fromDropData(data);
		if (!droppedItem) {
			return;
		}

		// Prevent dropping certain item types.
		if (BLOCK_GRANTED_ITEM_TYPES.includes(droppedItem.type)) {
			return;
		}

		// Prevent adding a granted item that's already present.
		if (this.item.systemData.grantedItems.find((i) => i.type === droppedItem.type && i.name === droppedItem.name)) {
			return;
		}

		await this.item.update({
			'system.grantedItems': [...this.item.systemData.grantedItems, droppedItem.toObject()],
		});
	}
}
