<script lang="ts" setup>
import { computed, inject, ref, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import { NAMESPACE as SETTINGS_NAMESPACE } from '@/settings';
import { KEY_MONEY_NAME } from '@/settings/campaign';
import Localized from '@/vue/components/Localized.vue';
import EquipmentDataModel, { EquipmentState } from '@/item/data/EquipmentDataModel';
import GenesysItem from '@/item/GenesysItem';
import InventoryItem from '@/vue/components/inventory/InventoryItem.vue';
import InventorySortSlot from '@/vue/components/inventory/InventorySortSlot.vue';
import GenesysEffect from '@/effects/GenesysEffect';
import GenesysActor from '@/actor/GenesysActor';

const EQUIPMENT_TYPES = ['weapon', 'armor', 'consumable', 'gear', 'container'];

const rootContext = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;
const inventory = computed(() => toRaw(rootContext.data.actor).items.filter((i) => EQUIPMENT_TYPES.includes(i.type)) as GenesysItem<EquipmentDataModel>[]);
const system = computed(() => toRaw(rootContext.data.actor).systemData);

const equippedItems = computed(() => inventory.value.filter((i) => i.systemData.state === 'equipped').sort(sortItems));
const carriedItems = computed(() => inventory.value.filter((i) => i.systemData.state === 'carried' && i.systemData.container === '').sort(sortItems));
const droppedItems = computed(() => inventory.value.filter((i) => i.systemData.state === 'dropped' && i.systemData.container === '').sort(sortItems));

const draggingItem = ref(false);

const CURRENCY_LABEL = game.settings.get(SETTINGS_NAMESPACE, KEY_MONEY_NAME);

function sortItems(left: GenesysItem, right: GenesysItem) {
	return left.sort - right.sort;
}

async function sortDroppedItem(event: DragEvent, sortCategory: EquipmentState, sortIndex: number) {
	console.log('SORTING');
	const dragSource = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');
	console.log(dragSource);

	if (!dragSource.id) {
		return;
	}

	const actor = toRaw(rootContext.data.actor);

	const item = actor.items.get(dragSource.id);
	if (!item || (sortCategory === EquipmentState.Equipped && !['weapon', 'armor'].includes(item.type))) {
		return;
	}
	console.log(item);

	let sortedInventory = equippedItems;
	switch (sortCategory) {
		case EquipmentState.Carried:
			sortedInventory = carriedItems;
			break;

		case EquipmentState.Dropped:
			sortedInventory = droppedItems;
			break;
	}

	let newSort = item.sort;
	if (sortIndex === -1) {
		// Sort the item at the beginning of the list.
		if (sortedInventory.value.length > 0) {
			newSort = sortedInventory.value[0].sort - 1;
		}
	} else {
		newSort = sortedInventory.value[sortIndex].sort + 1;

		if (sortedInventory.value.length > sortIndex + 1) {
			newSort = Math.floor((newSort + sortedInventory.value[sortIndex + 1].sort) / 2);
		}
	}

	console.log('UPDATING');

	await item.update({
		'system.container': '',
		'system.state': sortCategory,
		sort: newSort,
	});

	handleEffectsSuppresion(sortCategory, [item as GenesysItem]);
}

async function handleEffectsSuppresion(desiredState: EquipmentState, items: GenesysItem[]) {
	const actor = toRaw(rootContext.data.actor);

	for (const item of items) {
		// More work is required before we also handle consumables.
		if (item.type == 'consumable') {
			continue;
		}

		const preferredState = ['weapon', 'armor'].includes(item.type) ? EquipmentState.Equipped : EquipmentState.Carried;
		const shouldDisable = desiredState !== preferredState;

		await Promise.all(
			actor.effects
				.filter((effect) => (effect as GenesysEffect).originItem?.id === item.id && effect.disabled !== shouldDisable)
				.map(
					async (effect) =>
						await effect.update({
							disabled: shouldDisable,
						}),
				),
		);
	}
}

async function drop(event: DragEvent) {
	const actor = toRaw(rootContext.data.actor);

	const dragData = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');
	if (!dragData.source || dragData.source === actor.id || !actor.isOwner) {
		return;
	}

	const sourceActor = game.actors.get(dragData.source) as GenesysActor | undefined;
	if (!sourceActor || !sourceActor.isOwner) {
		return;
	}

	if (!CharacterDataModel.RELEVANT_TYPES.DROP_ITEM.includes(dragData.itemType) || !CharacterDataModel.RELEVANT_TYPES.INVENTORY.includes(dragData.itemType)) {
		return;
	}

	let containedItems: GenesysItem<EquipmentDataModel>[] = [];
	if (dragData.itemType === 'container') {
		containedItems = sourceActor.items.filter((item) => (item as GenesysItem<EquipmentDataModel>).systemData.container === dragData.id) as GenesysItem<EquipmentDataModel>[];
		if (!containedItems.every((item) => CharacterDataModel.RELEVANT_TYPES.DROP_ITEM.includes(item.type) && CharacterDataModel.RELEVANT_TYPES.INVENTORY.includes(item.type))) {
			return;
		}
	}

	const droppedItem = sourceActor.items.get(dragData.id) as GenesysItem | undefined;
	if (!droppedItem) {
		return;
	}

	const clonedItem = droppedItem.toObject();
	const clonedItemSystem = clonedItem.system as EquipmentDataModel;
	clonedItemSystem.state = EquipmentState.Carried;
	clonedItemSystem.container = '';

	const allCreatedItems = await actor.createEmbeddedDocuments('Item', [clonedItem]);
	const itemInSelf = allCreatedItems[0];

	if (containedItems.length > 0) {
		allCreatedItems.push(
			...(await actor.createEmbeddedDocuments(
				'Item',
				containedItems.map((item) => {
					const itemAsObject = item.toObject();
					const itemAsObjectSystem = itemAsObject.system as EquipmentDataModel;
					itemAsObjectSystem.state = EquipmentState.Carried;
					itemAsObjectSystem.container = itemInSelf.id;
					return itemAsObject;
				}),
			)),
		);

		containedItems.forEach((item) => item.delete());
	}

	await droppedItem.delete();

	handleEffectsSuppresion(EquipmentState.Carried, allCreatedItems as GenesysItem<EquipmentDataModel>[]);
}
</script>

<template>
	<section class="tab-inventory" @drop="drop">
		<div class="section-header">
			<span><Localized label="Genesys.Labels.Equipped" /></span>
		</div>

		<InventorySortSlot :active="draggingItem" @drop="sortDroppedItem($event, EquipmentState.Equipped, -1)" />

		<TransitionGroup name="inv">
			<template v-for="(item, index) in equippedItems" :key="item.id">
				<InventoryItem :item="item" draggable="true" @dragstart="draggingItem = true" @dragend="draggingItem = false" :dragging="draggingItem" @equipment-state-change="handleEffectsSuppresion" />

				<InventorySortSlot :active="draggingItem" @drop="sortDroppedItem($event, EquipmentState.Equipped, index)" />
			</template>
		</TransitionGroup>

		<div class="section-header">
			<span><Localized label="Genesys.Labels.Carried" /></span>
		</div>

		<InventorySortSlot :active="draggingItem" @drop="sortDroppedItem($event, EquipmentState.Carried, -1)" />

		<TransitionGroup name="inv">
			<template v-for="(item, index) in carriedItems" :key="item.id">
				<InventoryItem :item="item" draggable="true" @dragstart="draggingItem = true" @dragend="draggingItem = false" :dragging="draggingItem" @equipment-state-change="handleEffectsSuppresion" />

				<InventorySortSlot :active="draggingItem" @drop="sortDroppedItem($event, EquipmentState.Carried, index)" />
			</template>
		</TransitionGroup>

		<div class="section-header">
			<span><Localized label="Genesys.Labels.Dropped" /></span>
		</div>

		<InventorySortSlot :active="draggingItem" @drop="sortDroppedItem($event, EquipmentState.Dropped, -1)" />

		<TransitionGroup name="inv">
			<template v-for="(item, index) in droppedItems" :key="item.id">
				<InventoryItem :item="item" draggable="true" @dragstart="draggingItem = true" @dragend="draggingItem = false" :dragging="draggingItem" @equipment-state-change="handleEffectsSuppresion" />

				<InventorySortSlot :active="draggingItem" @drop="sortDroppedItem($event, EquipmentState.Dropped, index)" />
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
