import VehicleDataModel from '@/actor/data/VehicleDataModel';
import GenesysActorSheet from '@/actor/GenesysActorSheet';
import VueSheet from '@/vue/VueSheet';
import VueVehicleSheet from '@/vue/sheets/actor/VehicleSheet.vue';
import { ActorSheetContext } from '@/vue/SheetContext';

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
}
