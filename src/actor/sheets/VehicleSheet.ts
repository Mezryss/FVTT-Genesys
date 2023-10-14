import VehicleDataModel from '@/actor/data/VehicleDataModel';
import GenesysActorSheet from '@/actor/GenesysActorSheet';
import VueSheet from '@/vue/VueSheet';
import VueVehicleSheet from '@/vue/sheets/actor/VehicleSheet.vue';
import { ActorSheetContext } from '@/vue/SheetContext';
import BaseItemDataModel from '@/item/data/BaseItemDataModel';
import GenesysItem from '@/item/GenesysItem';
import GenesysEffect from '@/effects/GenesysEffect';
import GenesysActor from '@/actor/GenesysActor';

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

		// A vehicle doesn't own any skills but we allow dropping them only when they are being dropped into a role. This associates
		// the skill name to the target role.
		if (droppedItem.type === 'skill' && this._tabs[0].active === 'crew') {
			const targetRoleId = ((event.target as HTMLElement)?.closest('.role-section') as HTMLElement)?.dataset.roleId;
			const roles = [...this.actor.systemData.roles];

			const targetRole = roles.find((role) => role.id === targetRoleId);

			if (targetRole && !targetRole.skills.includes(droppedItem.name)) {
				targetRole.skills = [...targetRole.skills, droppedItem.name];

				await this.actor.update({
					'system.roles': roles,
				});
			}

			return false;
		}

		const newItems = await super._onDropItemCreate(droppedItem.toObject());

		// TODO: Currently we are disabling every active effect but we should only disable active effects from items unrelated to vehicles.
		//       Additionally, effects related only to encumbrance should remain enabled.
		await Promise.all(
			this.actor.effects
				.filter((effect) => (effect as GenesysEffect).originItem?.id === newItems[0].id && !effect.disabled)
				.map(
					async (effect) =>
						await effect.update({
							disabled: true,
						}),
				),
		);

		return newItems;
	}

	protected override async _onDropActor(event: DragEvent, data: DropCanvasData<'Actor', GenesysActor<VehicleDataModel>>): Promise<false | void> {
		if (!this.isEditable || !data.uuid) {
			return false;
		}

		const actor = (await fromUuid(data.uuid)) as GenesysActor;
		if (!actor || !VehicleDataModel.RELEVANT_TYPES.DROP_ACTOR.includes(actor.type)) {
			return false;
		}
		const actorId = actor.id;

		// If the actor is being dropped specifically into one of the roles then we add the actor to the role instead of to the passengers
		// list. Note that this is the only way for an actor to be part of more than one role.
		if (this._tabs[0].active === 'crew') {
			const targetRoleId = ((event.target as HTMLElement)?.closest('.role-section') as HTMLElement)?.dataset.roleId;
			const roles = [...this.actor.systemData.roles];

			const targetRole = roles.find((role) => role.id === targetRoleId);

			if (targetRole && !targetRole.members.includes(actorId)) {
				targetRole.members = [...targetRole.members, actorId];

				const updates: Record<string, any> = {
					'system.roles': roles,
				};

				// If the dropped actor is already a passenger then remove it from that list.
				const passengersList = this.actor.systemData.passengers.list;
				const passengerIndex = passengersList.findIndex((passenger) => passenger.id === actorId);

				if (passengerIndex >= 0) {
					const updatedList = [...passengersList];
					updatedList.splice(passengerIndex, 1);
					updates['system.passengers.list'] = updatedList;
				}

				await this.actor.update(updates);
				return false;
			}
		}

		const passengersList = this.actor.systemData.passengers.list;
		const isPresent = passengersList.some((passenger) => passenger.id === actorId) || this.actor.systemData.roles.some((role) => role.members.includes(actorId));

		// If the dropped actor is not part of the passenggers nor is it in any role then add it as a passenger.
		if (!isPresent) {
			const updatedList = [...passengersList].sort((left, right) => left.sort - right.sort);
			const lastPassengerSort = updatedList[updatedList.length - 1]?.sort ?? 0;
			updatedList.push({ id: actorId, sort: lastPassengerSort + CONST.SORT_INTEGER_DENSITY });
			await this.actor.update({
				'system.passengers.list': updatedList,
			});
		}

		return false;
	}
}
