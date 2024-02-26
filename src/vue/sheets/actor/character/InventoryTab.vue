<script lang="ts" setup>
import { computed, inject, ref, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';

import CharacterDataModel from '@/actor/data/CharacterDataModel';
import EquipmentDataModel, { EquipmentState } from '@/item/data/EquipmentDataModel';
import GenesysItem from '@/item/GenesysItem';
import { DragTransferData, extractDataFromDragTransferTypes } from '@/data/DragTransferData';
import { transferInventoryBetweenActors } from '@/operations/TransferBetweenActors';

import Localized from '@/vue/components/Localized.vue';
import InventoryItem from '@/vue/components/inventory/InventoryItem.vue';
import SortSlot from '@/vue/components/inventory/SortSlot.vue';

const CURRENCY_LABEL = CONFIG.genesys.settings.currencyName;

const context = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;
const system = computed(() => toRaw(context.data.actor).systemData);

const isDraggable = ref(toRaw(context.data.actor).isOwner);
const dragCounters = ref({
	[EquipmentState.Equipped]: 0,
	[EquipmentState.Carried]: 0,
	[EquipmentState.Dropped]: 0,
});

const inventory = computed(() => toRaw(context.data.actor).items.filter((i) => CharacterDataModel.isRelevantTypeForContext('INVENTORY', i.type)) as GenesysItem<EquipmentDataModel>[]);
const equippedItems = computed(() => inventory.value.filter((i) => i.systemData.state === EquipmentState.Equipped).sort(sortItems));
const carriedItems = computed(() => inventory.value.filter((i) => i.systemData.state === EquipmentState.Carried && i.systemData.container === '').sort(sortItems));
const droppedItems = computed(() => inventory.value.filter((i) => i.systemData.state === EquipmentState.Dropped && i.systemData.container === '').sort(sortItems));

function sortItems(left: GenesysItem, right: GenesysItem) {
	return left.sort - right.sort;
}

function canTypeBeDropped(type: string) {
	return CharacterDataModel.isRelevantTypeForContext('INVENTORY', type);
}

function canTypeBeInsideContainer(type: string) {
	return type !== 'container' && CharacterDataModel.isRelevantTypeForContext('INVENTORY', type);
}

async function handleEffectsStatus(items: GenesysItem[], desiredState: EquipmentState) {
	await system.value.handleEffectsStatus(items, { equipmentState: desiredState });
}

// Maintain consistent with the function with the same name on Vehicle -> InventoryTab.vue
async function dropInventoryToSortSlot(event: DragEvent, sortCategory: EquipmentState, sortIndex: number) {
	// Check that we have the UUID of whatever was dropped and that it's permitted to be dropped on this actor.
	const dragData = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}') as DragTransferData;
	if (!dragData.uuid || (dragData.genesysType && !CharacterDataModel.isRelevantTypeForContext('INVENTORY', dragData.genesysType))) {
		return;
	}

	// Make sure that the item in question exists and can be processed on this component.
	let droppedItem = await fromUuid<GenesysItem<EquipmentDataModel>>(dragData.uuid);
	if (!droppedItem || !CharacterDataModel.isRelevantTypeForContext('INVENTORY', droppedItem.type)) {
		return;
	}
	// We are handling the dropped item here so no need to let other components process it.
	event.stopPropagation();

	// The user must own the actor, and if it's being dropped to the `Equipped` equipment state it must be of the correct type.
	const actor = toRaw(context.data.actor);
	if (!actor.isOwner || (sortCategory === EquipmentState.Equipped && !CharacterDataModel.isRelevantTypeForContext('EQUIPABLE', droppedItem.type))) {
		return;
	}

	// If the item was dropped from another actor then we try transfering it and save a reference to it.
	const sourceActor = droppedItem.actor;
	const isDropFromAnotherActor = sourceActor && sourceActor.uuid !== actor.uuid;
	if (isDropFromAnotherActor) {
		const clonedItem = await transferInventoryBetweenActors(dragData, actor, canTypeBeDropped);
		droppedItem = clonedItem?.[0] ?? null;

		if (!droppedItem) {
			return;
		}
	} else if (!sourceActor) {
		[droppedItem] = (await actor.createEmbeddedDocuments('Item', [droppedItem.toObject()])) as GenesysItem<EquipmentDataModel>[];
	}

	// Select the proper inventory category to sort the dropped item among them.
	let sortedInventory;
	switch (sortCategory) {
		case EquipmentState.Equipped:
			sortedInventory = equippedItems;
			break;

		case EquipmentState.Carried:
			sortedInventory = carriedItems;
			break;

		case EquipmentState.Dropped:
			sortedInventory = droppedItems;
			break;

		default:
			return;
	}

	// Calculate the new sort values and update them.
	const sortUpdates = SortingHelpers.performIntegerSort(droppedItem, {
		target: sortedInventory.value[sortIndex < 0 ? 0 : sortIndex],
		siblings: sortedInventory.value.filter((sortedItem) => sortedItem.id !== droppedItem!.id),
		sortBefore: sortIndex < 0,
	});

	await actor.updateEmbeddedDocuments(
		'Item',
		sortUpdates.map((change) => {
			return foundry.utils.mergeObject(change.update, {
				_id: change.target.id,
			});
		}),
	);

	// If the item was moved from the contents of a container make sure we remove it from it.
	const updateMap = new Map<string, any>();
	updateMap.set('system.container', '');

	// Update the inventory category for which the dropped item now belongs.
	const mustUpdateEquipmentState = sortCategory !== droppedItem.systemData.state;
	if (mustUpdateEquipmentState) {
		updateMap.set('system.state', sortCategory);
	}

	await droppedItem.update(Object.fromEntries(updateMap));

	// Potentially update the effects tied to the dropped item if it changed inventory category of if it was transfered from
	// another actor.
	if (mustUpdateEquipmentState || isDropFromAnotherActor) {
		await actor.systemData.handleEffectsStatus([droppedItem], { equipmentState: sortCategory });
	}
}

async function resetDragCounters(_event: DragEvent) {
	dragCounters.value[EquipmentState.Equipped] = 0;
	dragCounters.value[EquipmentState.Carried] = 0;
	dragCounters.value[EquipmentState.Dropped] = 0;
}

function modifyDragCounters(event: DragEvent, direction: number) {
	const dragDataFromType = extractDataFromDragTransferTypes(event.dataTransfer?.types);
	if (!dragDataFromType) {
		return;
	}

	if (CharacterDataModel.isRelevantTypeForContext('EQUIPABLE', dragDataFromType.genesysType)) {
		dragCounters.value[EquipmentState.Equipped] += direction;
	}
	if (CharacterDataModel.isRelevantTypeForContext('INVENTORY', dragDataFromType.genesysType)) {
		dragCounters.value[EquipmentState.Carried] += direction;
		dragCounters.value[EquipmentState.Dropped] += direction;
	}
}

function dragEnter(event: DragEvent) {
	modifyDragCounters(event, 1);
}

function dragLeave(event: DragEvent) {
	modifyDragCounters(event, -1);
}
</script>

<template>
	<section class="tab-inventory" @drop.capture="resetDragCounters" @dragenter="dragEnter" @dragleave="dragLeave">
		<div class="section-header">
			<span><Localized label="Genesys.Labels.Equipped" /></span>
		</div>

		<SortSlot :active="dragCounters[EquipmentState.Equipped] > 0" @drop="dropInventoryToSortSlot($event, EquipmentState.Equipped, -1)" />

		<TransitionGroup name="inv">
			<template v-for="(item, index) in equippedItems" :key="item.id">
				<InventoryItem
					:item="item"
					:draggable="isDraggable"
					:dragging="dragCounters[EquipmentState.Carried] > 0"
					@equipment-state-change="handleEffectsStatus"
					:can-type-be-dropped="canTypeBeDropped"
					:can-type-be-inside-container="canTypeBeInsideContainer"
					:can-type-be-transfered="canTypeBeDropped"
				/>

				<SortSlot :active="dragCounters[EquipmentState.Equipped] > 0" @drop="dropInventoryToSortSlot($event, EquipmentState.Equipped, index)" />
			</template>
		</TransitionGroup>

		<div class="section-header">
			<span><Localized label="Genesys.Labels.Carried" /></span>
		</div>

		<SortSlot :active="dragCounters[EquipmentState.Carried] > 0" @drop="dropInventoryToSortSlot($event, EquipmentState.Carried, -1)" />

		<TransitionGroup name="inv">
			<template v-for="(item, index) in carriedItems" :key="item.id">
				<InventoryItem
					:item="item"
					:draggable="isDraggable"
					:dragging="dragCounters[EquipmentState.Carried] > 0"
					@equipment-state-change="handleEffectsStatus"
					:can-type-be-dropped="canTypeBeDropped"
					:can-type-be-inside-container="canTypeBeInsideContainer"
					:can-type-be-transfered="canTypeBeDropped"
				/>

				<SortSlot :active="dragCounters[EquipmentState.Carried] > 0" @drop="dropInventoryToSortSlot($event, EquipmentState.Carried, index)" />
			</template>
		</TransitionGroup>

		<div class="section-header">
			<span><Localized label="Genesys.Labels.Dropped" /></span>
		</div>

		<SortSlot :active="dragCounters[EquipmentState.Dropped] > 0" @drop="dropInventoryToSortSlot($event, EquipmentState.Dropped, -1)" />

		<TransitionGroup name="inv">
			<template v-for="(item, index) in droppedItems" :key="item.id">
				<InventoryItem
					:item="item"
					:draggable="isDraggable"
					:dragging="dragCounters[EquipmentState.Carried] > 0"
					@equipment-state-change="handleEffectsStatus"
					:can-type-be-dropped="canTypeBeDropped"
					:can-type-be-inside-container="canTypeBeInsideContainer"
					:can-type-be-transfered="canTypeBeDropped"
				/>

				<SortSlot :active="dragCounters[EquipmentState.Dropped] > 0" @drop="dropInventoryToSortSlot($event, EquipmentState.Dropped, index)" />
			</template>
		</TransitionGroup>

		<div class="encumbrance-currency-row">
			<div class="currency-row">
				<label><i class="fas fa-coins"></i> {{ CURRENCY_LABEL }}:</label>
				<input type="text" name="system.currency" :value="system.currency" />
			</div>

			<div :class="`encumbrance-row ${system.isEncumbered ? 'encumbered' : ''}`">
				<span v-if="system.isEncumbered"><Localized label="Genesys.Labels.Encumbered" /></span>
				<span><i class="fas fa-weight-hanging"></i></span>
				<span>{{ system.currentEncumbrance.value }}/{{ system.currentEncumbrance.threshold }}</span>
			</div>
		</div>
	</section>
</template>

<style lang="scss" scoped>
@use '@scss/mixins/reset.scss';
@use '@scss/vars/colors.scss';

.tab-inventory {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	padding: 0.5em;

	.inv-move,
	.inv-enter-active,
	.inv-leave-active {
		transition: all 0.5s ease;
	}

	.inv-enter-from,
	.inv-leave-to {
		height: 0;
		opacity: 0;
		transform: translateY(50px);
	}

	.encumbrance-currency-row {
		display: grid;
		align-items: center;
		grid-template-columns: 1fr auto auto;

		.currency-row,
		.encumbrance-row {
			background: colors.$dark-blue;
			padding-left: 0.5em;
			height: 100%;
			color: white;
		}

		.currency-row {
			grid-column: 2 / span 1;
			border-top-left-radius: 0.5rem;
			border-bottom-left-radius: 0.5rem;
		}

		.encumbrance-row {
			grid-column: 3 / span 1;
			padding-right: 0.5em;
			border-top-right-radius: 0.5rem;
			border-bottom-right-radius: 0.5rem;
		}
	}

	.currency-row {
		display: flex;
		align-items: center;
		gap: 0.5em;

		font-family: 'Bebas Neue', sans-serif;
		font-size: 1.1em;

		@include reset.input();
		input {
			background: transparentize(white, 0.8);
			padding: 3px;
			text-align: right;
			width: 100px;
			font-size: 1.1em;
			color: white;
		}
	}

	.encumbrance-row {
		width: 100%;
		display: flex;
		flex-wrap: nowrap;
		gap: 0.25em;
		font-family: 'Bebas Neue', sans-serif;
		align-items: center;

		span {
			margin-left: 0.5em;
		}

		&.encumbered {
			color: #f63d3d;
		}
	}

	.section-header {
		display: flex;
		font-size: 1.25em;
		font-family: 'Bebas Neue', sans-serif;
	}
}
</style>
