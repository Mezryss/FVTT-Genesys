/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Weapon ItemSheet
 */

import GenesysItemSheet, { DropData } from '@/item/GenesysItemSheet';

import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';
import ItemQualityDataModel from '@/item/data/ItemQualityDataModel';
import VueSheet from '@/vue/VueSheet';
import BaseWeaponDataModel from '@/item/data/BaseWeaponDataModel';

export default class BaseWeaponSheet extends VueSheet(GenesysItemSheet<BaseWeaponDataModel>) {
	override async _onDropItem(_event: DragEvent, data: DropData): Promise<void> {
		if (!this.isEditable || !data.uuid) {
			return;
		}

		const droppedItem: GenesysItem<SkillDataModel | ItemQualityDataModel> | undefined = await (<any>GenesysItem.implementation).fromDropData(data);
		if (!droppedItem) {
			return;
		}

		const systemData = this.item.systemData as BaseWeaponDataModel;
		switch (droppedItem.type) {
			// Skill Drop
			case 'skill':
				// Don't allow duplicates of the same skill.
				if (systemData.skills.find((s) => s.toLowerCase() === droppedItem.name.toLowerCase())) {
					return;
				}

				await this.item.update({
					'system.skills': [...systemData.skills, droppedItem.name],
				});

				await this.render();

				return;

			// Item Quality Drop
			case 'quality':
				const existingIndex = systemData.qualities.findIndex((i) => i.name.toLowerCase() === droppedItem.name.toLowerCase());
				const qualities = systemData.qualities;

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
								isRated: (droppedItem.systemData as ItemQualityDataModel).isRated,
								rating: 1,
							},
						],
					});
				}

				return;
		}
	}
}
