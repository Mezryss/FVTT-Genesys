/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Career ItemSheet
 */

import CareerDataModel from '@/item/data/CareerDataModel';
import VueCareerSheet from '@/vue/sheets/item/CareerSheet.vue';
import GenesysItemSheet, { DropData } from '@/item/GenesysItemSheet';
import SkillDataModel from '@/item/data/SkillDataModel';
import GenesysItem from '@/item/GenesysItem';
import VueSheet from '@/vue/VueSheet';
import { GenesysItemSheetData, ItemSheetContext } from '@/vue/SheetContext';

export default class CareerSheet extends VueSheet(GenesysItemSheet<CareerDataModel>) {
	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			classes: ['genesys', 'sheet', 'item', 'career'],
			width: 500,
			height: 400,
		};
	}

	override get vueComponent() {
		return VueCareerSheet;
	}

	override async getVueContext(): Promise<ItemSheetContext | undefined> {
		return {
			sheet: this,
			data: (await this.getData()) as GenesysItemSheetData<CareerDataModel>,
		};
	}

	protected override async _onDropItem(event: DragEvent, data: DropData): Promise<void> {
		if (!this.isEditable || !data.uuid) {
			return;
		}

		const droppedItem: GenesysItem<SkillDataModel> | undefined = await (<any>GenesysItem.implementation).fromDropData(data);
		if (!droppedItem || droppedItem.type !== 'skill') {
			return;
		}

		// Prevent adding a skill that's already present.
		if (this.item.systemData.careerSkills.find((i) => i.name.toLowerCase() === droppedItem.name.toLowerCase())) {
			return;
		}

		await this.item.update({
			'system.careerSkills': [...this.item.systemData.careerSkills, droppedItem.toObject()],
		});
	}
}
