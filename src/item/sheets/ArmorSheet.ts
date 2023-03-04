/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */
import GenesysItemSheet, { DropData } from '@/item/GenesysItemSheet';
import ArmorDataModel from '@/item/data/ArmorDataModel';
import VueSheet from '@/vue/VueSheet';
import { GenesysItemSheetData, ItemSheetContext } from '@/vue/SheetContext';
import VueArmorSheet from '@/vue/sheets/item/ArmorSheet.vue';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';
import WeaponDataModel from '@/item/data/WeaponDataModel';
import ItemQualityDataModel from '@/item/data/ItemQualityDataModel';

export default class ArmorSheet extends VueSheet(GenesysItemSheet<ArmorDataModel>) {
	override get vueComponent() {
		return VueArmorSheet;
	}

	override async getVueContext(): Promise<ItemSheetContext | undefined> {
		return {
			sheet: this,
			data: (await this.getData()) as GenesysItemSheetData<ArmorDataModel>,
		};
	}

	protected override async _onDropItem(event: DragEvent, data: DropData): Promise<void> {
		if (!this.isEditable || !data.uuid) {
			return;
		}

		const droppedItem: GenesysItem<SkillDataModel | WeaponDataModel> | undefined = await (<any>GenesysItem.implementation).fromDropData(data);
		if (!droppedItem) {
			return;
		}

		if (droppedItem.type === 'quality') {
			const existingIndex = this.item.systemData.qualities.findIndex((i) => i.name.toLowerCase() === droppedItem.name.toLowerCase());
			const qualities = this.item.systemData.qualities;

			if (existingIndex >= 0) {
				// Do nothing if it's not a rated quality.
				if (!qualities[existingIndex].isRated) {
					return;
				}

				qualities[existingIndex].rating += 1;
				await this.item.update({
					'system.qualities': qualities,
				});
			} else {
				// New Quality
				await this.item.update({
					'system.qualities': [
						...qualities,
						{
							name: droppedItem.name,
							description: droppedItem.systemData.description,
							isRated: (<ItemQualityDataModel>(<unknown>droppedItem.systemData)).isRated,
							rating: 1,
						},
					],
				});
			}
		}
	}
}
