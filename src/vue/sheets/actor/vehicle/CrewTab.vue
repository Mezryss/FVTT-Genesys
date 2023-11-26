<script lang="ts" setup>
import VehicleDataModel from '@/actor/data/VehicleDataModel';
import { inject, computed, toRaw, ref } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';

import Localized from '@/vue/components/Localized.vue';
import Role from '@/vue/components/vehicle/Role.vue';
import InventorySortSlot from '@/vue/components/inventory/InventorySortSlot.vue';
import ActorTile from '@/vue/components/ActorTile.vue';

const context = inject<ActorSheetContext<VehicleDataModel>>(RootContext)!;
const system = computed(() => toRaw(context.data.actor).systemData);

const draggingActor = ref(false);

const sortedPassengers = computed(() => [...toRaw(context.data.actor).systemData.passengers.list].sort(sortPassenger));

function sortPassenger(left: { sort: number }, right: { sort: number }) {
	return left.sort - right.sort;
}

async function addRole() {
	const roles = [...system.value.roles];
	roles.push({
		id: randomID(),
		name: '',
		skills: [],
		members: [],
	});

	await toRaw(context.data.actor).update({
		'system.roles': roles,
	});
}

async function deleteRole(roleIndex: number) {
	const roles = [...system.value.roles];
	roles.splice(roleIndex, 1);

	await toRaw(context.data.actor).update({
		'system.roles': roles,
	});
}

async function updateRoleName(roleIndex: number, newName: string) {
	const roles = [...system.value.roles];
	roles[roleIndex].name = newName;

	await toRaw(context.data.actor).update({
		'system.roles': roles,
	});
}

async function removeSkillFromRole(roleIndex: number, skillIndex: number) {
	const roles = [...system.value.roles];
	roles[roleIndex].skills.splice(skillIndex, 1);

	await toRaw(context.data.actor).update({
		'system.roles': roles,
	});
}

async function removeMemberFromRole(roleIndex: number, memberIndex: number) {
	const roles = [...system.value.roles];
	roles[roleIndex].members.splice(memberIndex, 1);
	await toRaw(context.data.actor).update({
		'system.roles': roles,
	});
}

async function dropToPassengers(event: DragEvent, passengerIndex: number) {
	const dragSource = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');
	if (!dragSource.id || !dragSource.origin) {
		return;
	}

	const updateObject: any = {};
	const passengers = [...sortedPassengers.value];

	let droppedPassenger = passengers.find((passenger) => passenger.id === dragSource.id);
	if (!droppedPassenger) {
		// If the actor is being drag-dropped from a role to the passengers then add it to the list and remove it from every role.
		if (dragSource.origin === 'role') {
			const lastPassengerSort = passengers[passengers.length - 1]?.sort ?? 0;
			droppedPassenger = { id: dragSource.id, sort: lastPassengerSort + CONST.SORT_INTEGER_DENSITY };
			passengers.push(droppedPassenger);

			const roles = [...system.value.roles];
			roles.forEach((role) => {
				const memberIndex = role.members.findIndex((member) => member === dragSource.id);
				if (memberIndex >= 0) {
					role.members.splice(memberIndex, 1);
				}
			});

			updateObject['system.roles'] = roles;
		} else {
			return;
		}
	}

	// Move the drag-dropped actor to the proper sort order.
	const sortUpdates = SortingHelpers.performIntegerSort(droppedPassenger, {
		target: passengers[passengerIndex < 0 ? 0 : passengerIndex],
		siblings: passengers.filter((sortedItem) => sortedItem !== droppedPassenger),
		sortBefore: passengerIndex < 0,
	});

	sortUpdates.forEach((change) => {
		change.target.sort = change.update.sort;
	});

	updateObject['system.passengers.list'] = passengers;

	await toRaw(context.data.actor).update(updateObject);
}

async function dropToRole(event: DragEvent, roleIndex: number) {
	const dragSource = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');
	if (!dragSource.id || !dragSource.origin) {
		return;
	}

	const updateObject: any = {};
	const roles = [...system.value.roles];

	// If the drag-dropped actor comes from the passengers list then remove it from there.
	if (dragSource.origin === 'passenger') {
		const passengers = [...sortedPassengers.value];
		const passengerIndex = passengers.findIndex((passenger) => passenger.id === dragSource.id);
		if (passengerIndex < 0) {
			return;
		}

		passengers.splice(passengerIndex, 1);

		updateObject['system.passengers.list'] = passengers;

		// If the drag-dropped actor comes from another role and it's not present on the new role then remove it from the original role.
	} else if (dragSource.origin === 'role') {
		if (roles[roleIndex].members.includes(dragSource.id)) {
			return;
		}

		const memberIndex = roles[dragSource.originRoleIndex].members.findIndex((member) => member === dragSource.id);
		roles[dragSource.originRoleIndex].members.splice(memberIndex, 1);
	} else {
		return;
	}

	roles[roleIndex].members = [...roles[roleIndex].members, dragSource.id];
	updateObject['system.roles'] = roles;

	await toRaw(context.data.actor).update(updateObject);
}

async function removePassenger(passengerIndex: number) {
	const passengers = [...sortedPassengers.value];
	passengers.splice(passengerIndex, 1);

	await toRaw(context.data.actor).update({
		'system.passengers.list': passengers,
	});
}

function dragStart(event: DragEvent, extraData?: object) {
	draggingActor.value = true;

	if (extraData) {
		const dragSource = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');
		event.dataTransfer?.setData('text/plain', JSON.stringify(foundry.utils.mergeObject(dragSource, extraData)));
	}
}

function dragEnd() {
	draggingActor.value = false;
}
</script>

<template>
	<section class="tab-crew">
		<div class="section-header">
			<span><Localized label="Genesys.Labels.Roles" /></span>
			<a @click="addRole"><i class="fas fa-plus"></i> <Localized label="Genesys.Labels.Add" /></a>
		</div>

		<section class="roles">
			<TransitionGroup name="crew-trans">
				<template v-for="(role, roleIndex) in system.roles" :key="role.id">
					<Role
						:id="role.id"
						:name="role.name"
						:skills="role.skills"
						:members="role.members"
						:dragging="draggingActor"
						@delete="deleteRole(roleIndex)"
						@update-name="(newName) => updateRoleName(roleIndex, newName)"
						@remove-skill="(skillIndex) => removeSkillFromRole(roleIndex, skillIndex)"
						@remove-member="(memberIndex) => removeMemberFromRole(roleIndex, memberIndex)"
						@actor-drag-start="dragStart($event, { origin: 'role', originRoleIndex: roleIndex })"
						@actor-drag-end="dragEnd"
						@actor-drop="dropToRole($event, roleIndex)"
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
			<InventorySortSlot :active="draggingActor" @drop="dropToPassengers($event, -1)" />

			<TransitionGroup name="crew-trans">
				<template v-for="(passenger, passengerIndex) in sortedPassengers" :key="passenger.id">
					<ActorTile :actor-id="passenger.id" :mini="true" :dragging="draggingActor" draggable="true" @remove-member="removePassenger(passengerIndex)" @dragstart="dragStart($event, { origin: 'passenger' })" @dragend="dragEnd" />

					<InventorySortSlot :active="draggingActor" @drop="dropToPassengers($event, passengerIndex)" />
				</template>
			</TransitionGroup>
		</section>
	</section>
</template>

<style lang="scss">
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
