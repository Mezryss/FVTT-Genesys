<script lang="ts" setup>
import VehicleDataModel from '@/actor/data/VehicleDataModel';
import { inject, computed, toRaw, ref, watchEffect } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';

import Localized from '@/vue/components/Localized.vue';
import Role from '@/vue/components/vehicle/Role.vue';
import SortSlot from '@/vue/components/inventory/SortSlot.vue';
import ActorTile from '@/vue/components/ActorTile.vue';

import GenesysActor from '@/actor/GenesysActor';
import { CrewDragTransferData, CrewExtraDragTransferData, DragTransferData, extractDataFromDragTransferTypes } from '@/data/DragTransferData';
import CloneActorPrompt from '@/app/CloneActorPrompt';

type FromUuidSimpleReturnData = null | {
	name: string;
	type: string;
};

const context = inject<ActorSheetContext<VehicleDataModel>>(RootContext)!;
const system = computed(() => toRaw(context.data.actor).systemData);

const dragCounters = ref({
	role: 0,
	passenger: 0,
});
const passengersActors = ref<GenesysActor[]>([]);

const sortedPassengers = computed(() => [...toRaw(context.data.actor).systemData.passengers.list].sort(sortPassenger));

// Make sure to display only actors that exist.
watchEffect(async () => {
	const foundActors: GenesysActor[] = [];
	for (const passenger of sortedPassengers.value) {
		const actor = await fromUuid<GenesysActor>(passenger.uuid);
		if (actor) {
			foundActors.push(actor);
		}
	}
	passengersActors.value = foundActors;
});

function sortPassenger(left: { sort: number }, right: { sort: number }) {
	return left.sort - right.sort;
}

async function dropToPassengers(event: DragEvent, relativeToPassengerUuid: string) {
	// Check that we have the UUID of whatever was dropped and that it can be processed by this method.
	const dragData = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}') as CrewDragTransferData;
	if (!dragData.uuid || (dragData.genesysType && !VehicleDataModel.isRelevantTypeForContext('PASSENGER', dragData.genesysType))) {
		return;
	}

	// Make sure that the entity in question exists and can be processed by this method.
	const droppedEntity = fromUuidSync(dragData.uuid) as FromUuidSimpleReturnData;
	if (!droppedEntity || !VehicleDataModel.isRelevantTypeForContext('PASSENGER', droppedEntity.type)) {
		return;
	}
	// We are handling the dropped passenger here so no need to let other components process it.
	event.stopPropagation();

	// The user must own the actor, and end early if we are simply sorting a passenger to a position that won't change its order.
	const actor = toRaw(context.data.actor);
	if (!actor.isOwner || dragData.uuid === relativeToPassengerUuid) {
		return;
	}

	// If the passenger was dropped from another actor then we get a reference to the other actor.
	const isDropFromAnotherActor = dragData.sourceVehicleUuid && dragData.sourceVehicleUuid !== actor.uuid;
	let sourceVehicle = actor;
	if (isDropFromAnotherActor) {
		const aVehicle = await fromUuid<GenesysActor<VehicleDataModel>>(dragData.sourceVehicleUuid!);
		if (!aVehicle || aVehicle.type !== 'vehicle' || !aVehicle.isOwner) {
			return;
		}
		sourceVehicle = aVehicle;
	}

	const updateMap = new Map<string, any>();
	const passengers = [...sortedPassengers.value];

	const crewUuid = dragData.uuid;
	let droppedCrew: { uuid: string; sort: number };

	if (isDropFromAnotherActor) {
		// If the passenger was dropped from another actor then add it if it's not already on the vehicle.
		if (actor.systemData.hasCrew(crewUuid)) {
			return;
		}
		droppedCrew = { uuid: crewUuid, sort: 0 };
		passengers.push(droppedCrew);
	} else if (!dragData.sourceVehicleUuid) {
		// If the passenger was dropped from a folder or compendium then add it if it's not already on the vehicle.
		if (actor.systemData.hasCrew(crewUuid)) {
			return;
		}

		droppedCrew = { uuid: crewUuid, sort: 0 };

		// If the dropped actor produces unlinked tokens and the user can create actors then ask if they want to make a
		// clone and save a reference of it instead.
		if (!(droppedEntity as GenesysActor).prototypeToken.actorLink && (Actor.implementation as typeof GenesysActor).canUserCreate(game.user)) {
			const actorToAdd = await CloneActorPrompt.promptForInstantiation(droppedEntity as GenesysActor);

			if (actorToAdd) {
				droppedCrew = { uuid: actorToAdd.uuid, sort: 0 };
			} else {
				// The prompt was closed so cancel the drop.
				return;
			}
		}

		passengers.push(droppedCrew);
	} else {
		const targetCrew = passengers.find((passenger) => passenger.uuid === crewUuid);
		if (targetCrew) {
			// If the dropped passenger is already on the list of passengers then get a reference to it for sorting.
			droppedCrew = targetCrew;
		} else {
			// If the dropped passenger is not on the passengers list then it must come from one of the roles, so move it between both
			// lists.
			droppedCrew = { uuid: crewUuid, sort: 0 };
			passengers.push(droppedCrew);

			const roles = [...system.value.roles];
			roles.forEach((role) => {
				const memberIndex = role.members.findIndex((member) => member === crewUuid);
				if (memberIndex >= 0) {
					role.members.splice(memberIndex, 1);
				}
			});

			updateMap.set('system.roles', roles);
		}
	}

	// Move the dropped passenger to the proper sort order.
	const passengerIndex = relativeToPassengerUuid ? passengers.findIndex((passenger) => passenger.uuid !== relativeToPassengerUuid) : -1;
	const sortUpdates = SortingHelpers.performIntegerSort(droppedCrew, {
		target: passengers[passengerIndex < 0 ? 0 : passengerIndex],
		siblings: passengers.filter((passenger) => passenger !== droppedCrew),
		sortBefore: passengerIndex < 0,
	});

	sortUpdates.forEach((change) => {
		change.target.sort = change.update.sort;
	});

	updateMap.set('system.passengers.list', passengers);

	await actor.update(Object.fromEntries(updateMap));

	// Make sure to remove the passenger from the other actor if that was its source.
	if (isDropFromAnotherActor) {
		await sourceVehicle.systemData.removeCrew(crewUuid);
	}
}

async function dropToRole(event: DragEvent, roleId: string, memberUnder?: ActorUUID | TokenDocumentUUID) {
	// Check that we have the UUID of whatever was dropped and that it can be processed by this method.
	const dragData = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}') as CrewDragTransferData;
	if (!dragData.uuid || (dragData.genesysType && !VehicleDataModel.isRelevantTypeForContext('ROLE', dragData.genesysType))) {
		return;
	}

	// Make sure that the entity in question exists and can be processed by this method.
	const droppedEntity = fromUuidSync(dragData.uuid) as FromUuidSimpleReturnData;
	if (!droppedEntity || !VehicleDataModel.isRelevantTypeForContext('ROLE', droppedEntity.type)) {
		return;
	}
	// We are handling the dropped entity here so no need to let other components process it.
	event.stopPropagation();

	// Make sure the user owns the actor.
	const actor = toRaw(context.data.actor);
	if (!actor.isOwner) {
		return;
	}

	// If the dropped entity is a skill then add it to the role and end early.
	if (droppedEntity.type === 'skill') {
		await actor.systemData.addSkillToRole(roleId, droppedEntity.name);
		return;
	}

	// If the crew member was dropped from another actor then we get a reference to the other actor.
	const isDropFromAnotherActor = dragData.sourceVehicleUuid && dragData.sourceVehicleUuid !== actor.uuid;
	let sourceVehicle = actor;
	if (isDropFromAnotherActor) {
		const aVehicle = await fromUuid<GenesysActor<VehicleDataModel>>(dragData.sourceVehicleUuid!);
		if (!aVehicle || aVehicle.type !== 'vehicle' || !aVehicle.isOwner) {
			return;
		}
		sourceVehicle = aVehicle;
	}

	const updateMap = new Map<string, any>();
	const roles = [...system.value.roles];
	const roleIndex = roles.findIndex((role) => role.id === roleId);

	// Make sure we find the proper role.
	if (roleIndex === -1) {
		return;
	}

	let crewUuid = dragData.uuid;
	if (isDropFromAnotherActor) {
		// If the crew member was dropped from another actor then simply check that it's not already in the vehicle.
		if (actor.systemData.hasCrew(crewUuid)) {
			return;
		}
	} else if (!dragData.sourceVehicleUuid) {
		// If the crew member was dropped from a folder or compendium check that it's not already in the vehicle.
		if (actor.systemData.hasCrew(crewUuid)) {
			return;
		}

		// If the dropped actor produces unlinked tokens and the user can create actors then ask if they want to make a
		// clone and save a reference of it instead.
		if (!(droppedEntity as GenesysActor).prototypeToken.actorLink && (Actor.implementation as typeof GenesysActor).canUserCreate(game.user)) {
			const actorToAdd = await CloneActorPrompt.promptForInstantiation(droppedEntity as GenesysActor);

			if (actorToAdd) {
				crewUuid = actorToAdd.uuid;
			} else {
				// The prompt was closed so cancel the drop.
				return;
			}
		}
	} else {
		if (dragData.origin === 'passenger') {
			// If the crew member is currently a passenger then remove it from the list.
			const passengers = [...sortedPassengers.value];
			const passengerIndex = passengers.findIndex((passenger) => passenger.uuid === crewUuid);
			if (passengerIndex < 0) {
				return;
			}

			passengers.splice(passengerIndex, 1);
			updateMap.set('system.passengers.list', passengers);
		} else if (dragData.origin === 'role') {
			const crewIndex = roles[roleIndex].members.findIndex((member) => member === crewUuid);
			if (crewIndex === -1) {
				// If the crew member is currently on another role then remove it from it.
				const originRoleIndex = roles.findIndex((role) => role.id === dragData.roleId);
				if (originRoleIndex === -1) {
					return;
				}
				const memberIndex = roles[originRoleIndex].members.findIndex((member) => member === crewUuid);
				if (memberIndex === -1) {
					return;
				}

				roles[originRoleIndex].members.splice(memberIndex, 1);
			} else if (memberUnder && memberUnder !== crewUuid) {
				// If the crew member is on this role but we drop it on top of another crew member then we
				// want to change its position.
				roles[roleIndex].members.splice(crewIndex, 1);
			} else {
				// If the crew member is already on this role but we are not sorting it then exit.
				return;
			}
		} else {
			return;
		}
	}

	// Add the crew member to the role.
	const positionIndex = memberUnder ? roles[roleIndex].members.findIndex((member) => member === memberUnder) : roles[roleIndex].members.length;
	roles[roleIndex].members.splice(positionIndex, 0, crewUuid);
	updateMap.set('system.roles', roles);

	await actor.update(Object.fromEntries(updateMap));

	// Make sure to remove the crew member from the other actor if that was its source.
	if (isDropFromAnotherActor) {
		await sourceVehicle.systemData.removeCrew(crewUuid);
	}
}

async function resetDragCounters(_event: DragEvent) {
	dragCounters.value.role = 0;
	dragCounters.value.passenger = 0;
}

function modifyDragCounters(event: DragEvent, direction: number) {
	const dragDataFromType = extractDataFromDragTransferTypes(event.dataTransfer?.types);
	if (!dragDataFromType) {
		return;
	}

	if (VehicleDataModel.isRelevantTypeForContext('ROLE', dragDataFromType.genesysType)) {
		dragCounters.value.role += direction;
	}
	if (VehicleDataModel.isRelevantTypeForContext('PASSENGER', dragDataFromType.genesysType)) {
		dragCounters.value.passenger += direction;
	}
}

function dragStart(event: DragEvent, extraData: CrewExtraDragTransferData) {
	const dragData = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}') as DragTransferData;
	const dragDataWithExtra: CrewDragTransferData = {
		...dragData,
		...extraData,
		sourceVehicleUuid: context.data.actor.uuid,
	};

	event.dataTransfer?.setData('text/plain', JSON.stringify(dragDataWithExtra));
}

function dragEnter(event: DragEvent) {
	modifyDragCounters(event, 1);
}

function dragLeave(event: DragEvent) {
	modifyDragCounters(event, -1);
}
</script>

<template>
	<section class="tab-crew" @drop.capture="resetDragCounters" @dragenter="dragEnter" @dragleave="dragLeave">
		<div class="section-header">
			<span><Localized label="Genesys.Labels.Roles" /></span>
			<a @click="system.addRole()"><i class="fas fa-plus"></i> <Localized label="Genesys.Labels.Add" /></a>
		</div>

		<section class="roles">
			<TransitionGroup name="crew-trans">
				<template v-for="role in system.roles" :key="role.id">
					<Role
						:id="role.id"
						:name="role.name"
						:skills="role.skills"
						:members="role.members"
						:dragging="dragCounters.role > 0"
						@delete="system.deleteRole(role.id)"
						@update-name="(newName) => system.updateRoleName(role.id, newName)"
						@remove-skill="(skillName) => system.removeSkillFromRole(role.id, skillName)"
						@remove-member="(memberId) => system.removeMemberFromRole(role.id, memberId)"
						@actor-drag-start="dragStart($event, { origin: 'role', roleId: role.id })"
						@entity-drop="(event, memberUnder) => dropToRole(event, role.id, memberUnder)"
					/>
				</template>
			</TransitionGroup>
		</section>

		<div class="section-header">
			<span><Localized label="Genesys.Labels.Passengers" /></span>
			<div
				:class="{
					'capacity-section': true,
					'over-capacity': system.isOverCapacity,
				}"
			>
				<span v-if="system.isOverCapacity"><Localized label="Genesys.Labels.OverCapacity" /></span>
				<span><i class="fas fa-users"></i></span>
				<span>{{ system.currentPassengers.value }}/{{ system.currentPassengers.threshold }}</span>
			</div>
		</div>

		<section class="passengers">
			<SortSlot :active="dragCounters.passenger > 0" @drop="dropToPassengers($event, '')" />

			<TransitionGroup name="crew-trans">
				<template v-for="passenger in passengersActors" :key="passenger.uuid">
					<ActorTile
						:actor="passenger as GenesysActor"
						:mini="true"
						:dragging="dragCounters.passenger > 0"
						draggable="true"
						@remove-member="system.removePassenger(passenger.uuid)"
						@dragstart="dragStart($event, { origin: 'passenger' })"
					/>

					<SortSlot :active="dragCounters.passenger > 0" @drop="dropToPassengers($event, passenger.uuid)" />
				</template>
			</TransitionGroup>
		</section>
	</section>
</template>

<style lang="scss" scoped>
@use '@scss/mixins/reset.scss';
@use '@scss/vars/colors.scss';

.tab-crew {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	padding: 0.5em;

	.roles {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5em;
		margin-bottom: 1rem;
	}

	.crew-trans-move,
	.crew-trans-enter-active,
	.crew-trans-leave-active {
		transition: all 0.5s ease;
	}

	.crew-trans-enter-from,
	.crew-trans-leave-to {
		height: 0;
		opacity: 0;
		transform: translateY(50px);
	}

	.capacity-section {
		width: 100%;
		display: flex;
		flex-wrap: nowrap;
		gap: 0.25em;
		font-family: 'Bebas Neue', sans-serif;
		align-items: center;

		background: colors.$dark-blue;
		height: 100%;
		color: white;

		padding-right: 0.5em;
		border-radius: 0.5rem;

		span {
			margin-left: 0.5em;
		}

		&.over-capacity {
			color: #f63d3d;
		}
	}

	.section-header {
		display: grid;
		grid-template-columns: auto 1fr auto;
		font-size: 1.25em;
		font-family: 'Bebas Neue', sans-serif;
		margin-bottom: 0.5rem;

		> :first-child {
			grid-column: 1 / span 1;
		}

		> :last-child {
			grid-column: 3 / span 1;
		}
	}
}
</style>
