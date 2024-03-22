import VehicleDataModel from '@/actor/data/VehicleDataModel';
import GenesysActorSheet from '@/actor/GenesysActorSheet';
import VueSheet from '@/vue/VueSheet';
import VueVehicleSheet from '@/vue/sheets/actor/VehicleSheet.vue';
import { ActorSheetContext } from '@/vue/SheetContext';
import BaseItemDataModel from '@/item/data/BaseItemDataModel';
import GenesysItem from '@/item/GenesysItem';
import GenesysActor from '@/actor/GenesysActor';
import { CrewDragTransferData, DragTransferData } from '@/data/DragTransferData';
import { transferInventoryBetweenActors } from '@/operations/TransferBetweenActors';
import { EquipmentState } from '@/item/data/EquipmentDataModel';
import CloneActorPrompt from '@/app/CloneActorPrompt';

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
		if (VehicleDataModel.isRelevantTypeForContext('INVENTORY', droppedItem.type)) {
			if (droppedItem.actor) {
				// If the item was dropped from another actor then we try transfering it and save a reference to it.
				clonedDroppedItem = await transferInventoryBetweenActors(dragData, this.actor, (type) => VehicleDataModel.isRelevantTypeForContext('INVENTORY', type));
			} else {
				// If the item comes from a folder or compendium then let `super` handle the drop and save a reference to it.
				clonedDroppedItem = await super._onDropItem(event, data);
			}

			// If we sucessfully cloned the dropped inventory item then update the state for any associated effect.
			if (Array.isArray(clonedDroppedItem)) {
				await this.actor.systemData.handleEffectsStatus(clonedDroppedItem, { equipmentState: EquipmentState.Carried });
			}
		} else if (VehicleDataModel.isRelevantTypeForContext('COMBAT', droppedItem.type)) {
			// Let `super` handle the drop and save a reference to it.
			clonedDroppedItem = await super._onDropItem(event, data);
		} else {
			// If the dropped item is not of a type that we have a default behavior then end early.
			return false;
		}

		return clonedDroppedItem ?? false;
	}

	protected override async _onDropActor(event: DragEvent, data: DropCanvasData<'Actor', GenesysActor<VehicleDataModel>>): Promise<false | void> {
		// Regardless of what was dropped this is the last spot to process it.
		event.stopPropagation();

		// Check that we have the UUID of the passenger that was dropped and that it can be processed by this method.
		const dragData = data as CrewDragTransferData;
		if (!dragData.uuid || (dragData.genesysType && !VehicleDataModel.isRelevantTypeForContext('PASSENGER', dragData.genesysType))) {
			return false;
		}

		// Make sure that the passenger in question exists and can be processed by this method.
		let crewUuid = dragData.uuid;
		const droppedEntity = fromUuidSync(crewUuid) as { type: string } | null;
		if (!droppedEntity || !VehicleDataModel.isRelevantTypeForContext('PASSENGER', droppedEntity.type)) {
			return false;
		}

		// We must be able to edit the actor to proceed.
		if (!this.isEditable) {
			return false;
		}

		const isDropFromAnotherActor = dragData.sourceVehicleUuid && dragData.sourceVehicleUuid !== this.actor.uuid;
		if (isDropFromAnotherActor) {
			// If the passenger was dropped from another actor then check it's not already on our list and then remove it from the source.
			if (this.actor.systemData.hasCrew(crewUuid)) {
				return false;
			}

			const aVehicle = await fromUuid<GenesysActor<VehicleDataModel>>(dragData.sourceVehicleUuid!);
			if (!aVehicle || aVehicle.type !== 'vehicle' || !aVehicle.isOwner) {
				return false;
			}

			await aVehicle.systemData.removeCrew(crewUuid);
		} else if (!dragData.sourceVehicleUuid) {
			// If the item comes from a folder or compendium then check it's not already on our list.
			if (this.actor.systemData.hasCrew(crewUuid)) {
				return false;
			}

			// If the dropped actor produces unlinked tokens and the user can create actors then ask if they want to
			// make a clone and save a reference of it instead.
			if (!(droppedEntity as GenesysActor).prototypeToken.actorLink && (Actor.implementation as typeof GenesysActor).canUserCreate(game.user)) {
				const actorToAdd = await CloneActorPrompt.promptForInstantiation(droppedEntity as GenesysActor);

				if (actorToAdd) {
					crewUuid = actorToAdd.uuid;
				} else {
					// The prompt was closed so cancel the drop.
					return false;
				}
			}
		} else {
			// Ignore dropped passengers if they are already on this actor; they should be handled by specific components on the sheet.
			return false;
		}

		await this.actor.systemData.addPassenger(crewUuid);

		return;
	}
}
