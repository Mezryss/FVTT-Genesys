/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Weapon ItemSheet
 */

import GenesysItemSheet, { DropData } from '@/item/GenesysItemSheet';
import WeaponDataModel from '@/item/data/WeaponDataModel';
import VueWeaponSheet from '@/vue/sheets/item/WeaponSheet.vue';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';
import ItemQualityDataModel from '@/item/data/ItemQualityDataModel';
import VueSheet from '@/vue/VueSheet';
import { GenesysItemSheetData, ItemSheetContext } from '@/vue/SheetContext';

export default class WeaponSheet extends VueSheet(GenesysItemSheet<WeaponDataModel>) {
	override get vueComponent() {
		return VueWeaponSheet;
	}

	override async getVueContext(): Promise<ItemSheetContext | undefined> {
		return {
			sheet: this,
			data: (await this.getData()) as GenesysItemSheetData<WeaponDataModel>,
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

		switch (droppedItem.type) {
			// Skill Drop
			case 'skill':
				// Don't allow duplicates of the same skill.
				if (this.item.systemData.skills.find((s) => s.toLowerCase() === droppedItem.name.toLowerCase())) {
					return;
				}

				await this.item.update({
					'system.skills': [...this.item.systemData.skills, droppedItem.name],
				});

				await this.render();

				return;

			// Item Quality Drop
			case 'quality':
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

				return;
		}
	}
}
