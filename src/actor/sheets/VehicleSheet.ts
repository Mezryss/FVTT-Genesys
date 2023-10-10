import VehicleDataModel from '@/actor/data/VehicleDataModel';
import GenesysActorSheet from '@/actor/GenesysActorSheet';
import VueSheet from '@/vue/VueSheet';
import VueVehicleSheet from '@/vue/sheets/actor/VehicleSheet.vue';
import { ActorSheetContext } from '@/vue/SheetContext';
import BaseItemDataModel from '@/item/data/BaseItemDataModel';
import GenesysItem from '@/item/GenesysItem';
import GenesysEffect from '@/effects/GenesysEffect';

export default class VehicleSheet extends VueSheet(GenesysActorSheet<VehicleDataModel>) {
	override get vueComponent() {
		return VueVehicleSheet;
	}

	override async getVueContext(): Promise<ActorSheetContext<VehicleDataModel>> {
		return {
			sheet: this,
			data: await this.getData(),
		};
	}

	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'skills',
				},
			],
		};
	}

	protected override async _onDropItem(event: DragEvent, data: DropCanvasData<'Item', GenesysItem<BaseItemDataModel>>) {
		if (!this.isEditable || !data.uuid) {
			return false;
		}

		const droppedItem: GenesysItem | undefined = await (<any>GenesysItem.implementation).fromDropData(data);
		if (!droppedItem || !VehicleDataModel.RELEVANT_TYPES.DROP_ITEM.includes(droppedItem.type)) {
			return false;
		}

		const [newItem] = await super._onDropItemCreate(droppedItem.toObject());
		console.log(newItem.sort);

		// TODO: Currently we are disabling every after effect but we should only disable active effects from items unrelated to vehicles.
		//       Additionally, effects related only to encumbrance should remain enabled.
		await Promise.all(
			this.actor.effects
				.filter((effect) => (effect as GenesysEffect).originItem?.id === newItem.id && !effect.disabled)
				.map(
					async (effect) =>
						await effect.update({
							disabled: true,
						}),
				),
		);

		return [newItem];
	}
}
