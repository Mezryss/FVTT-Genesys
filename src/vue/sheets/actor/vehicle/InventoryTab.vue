<script lang="ts" setup>
import { inject, computed, toRaw, ref } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';

import GenesysActor from '@/actor/GenesysActor';
import GenesysItem from '@/item/GenesysItem';
import VehicleDataModel from '@/actor/data/VehicleDataModel';
import EquipmentDataModel, { EquipmentState } from '@/item/data/EquipmentDataModel';
import GenesysEffect from '@/effects/GenesysEffect';

import Localized from '@/vue/components/Localized.vue';
import InventorySortSlot from '@/vue/components/inventory/InventorySortSlot.vue';
import InventoryItem from '@/vue/components/inventory/InventoryItem.vue';

const CURRENCY_LABEL = CONFIG.genesys.currencyName;

const context = inject<ActorSheetContext<VehicleDataModel>>(RootContext)!;
const system = computed(() => toRaw(context.data.actor).systemData);

const draggingItem = ref(false);

const inventory = computed(() => toRaw(context.data.actor).items.filter((item) => VehicleDataModel.RELEVANT_TYPES.INVENTORY.includes(item.type)) as GenesysItem<EquipmentDataModel>[]);
const equippedItems = computed(() => inventory.value.filter((item) => item.systemData.state === EquipmentState.Equipped).sort(sortItems));
const carriedItems = computed(() => inventory.value.filter((item) => item.systemData.state === EquipmentState.Carried && item.systemData.container === '').sort(sortItems));

function sortItems(left: GenesysItem, right: GenesysItem) {
	return left.sort - right.sort;
}

async function sortDroppedItem(event: DragEvent, sortCategory: EquipmentState, sortIndex: number) {
	const dragSource = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');
	if (!dragSource.id) {
		return;
	}

	const actor = toRaw(context.data.actor);
	const item = actor.items.get(dragSource.id) as GenesysItem<EquipmentDataModel>;

	if (!item || (sortCategory === EquipmentState.Equipped && !VehicleDataModel.RELEVANT_TYPES.EQUIPABLE.includes(item.type))) {
		return;
	}

	let sortedInventory;
	switch (sortCategory) {
		case EquipmentState.Equipped:
			sortedInventory = equippedItems;
			break;

		case EquipmentState.Carried:
			sortedInventory = carriedItems;
			break;

		default:
			return;
	}

	const sortUpdates = SortingHelpers.performIntegerSort(item, {
		target: sortedInventory.value[sortIndex < 0 ? 0 : sortIndex],
		siblings: sortedInventory.value.filter((sortedItem) => sortedItem.id !== item.id),
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

	const updateObject: Record<string, string> = {
		'system.container': '',
	};

	if (item.system.state !== sortCategory) {
		updateObject['system.state'] = sortCategory;
		handleEffectsSuppresion(sortCategory, [item as GenesysItem]);
	}

	await item.update(updateObject);
}

async function handleEffectsSuppresion(_desiredState: EquipmentState, items: GenesysItem[]) {
	const actor = toRaw(context.data.actor);

	const allUpdates = [];

	// TODO: Currently we are disabling every active effect but we should only disable active effects from items unrelated to vehicles.
	//       Additionally, effects related only to encumbrance should remain enabled.
	for (const item of items) {
		allUpdates.push(
			...actor.effects
				.filter((effect) => (effect as GenesysEffect).originItem?.id === item.id && !effect.disabled)
				.map(
					async (effect) =>
						await effect.update({
							disabled: true,
						}),
				),
		);
	}

	await Promise.all(allUpdates);
}

// TODO: The following two functions are almost exactly the same as the ones on the character sheet so find a way to consolidate them.
async function mimicEffectsDetails(sourceActor: GenesysActor, sourceItemId: string, targetActor: GenesysActor, targetItemId: string) {
	const sourceActorEffects = sourceActor.effects.filter((effect) => (effect as GenesysEffect).originItem?.id === sourceItemId);
	const targetActorEffects = targetActor.effects.filter((effect) => (effect as GenesysEffect).originItem?.id === targetItemId);

	if (sourceActorEffects.length !== targetActorEffects.length) {
		ui.notifications.warn(game.i18n.localize('Genesys.Notifications.EffectsWereNotUpdatedAfterTransfer'));
		return;
	}

	for (let k = 0; k < sourceActorEffects.length; k++) {
		const sourceEffect = sourceActorEffects[k];
		await targetActorEffects[k].update({
			// TODO: Migrate away of using `label`.
			label: sourceEffect.label,
			icon: sourceEffect.icon,
			changes: sourceEffect.changes,
		});
	}
}

// TODO: Comment the contents of this function.
async function dropInventoryBetweenActors(event: DragEvent) {
	const actor = toRaw(context.data.actor);

	const dragData = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');
	if (!dragData.source || dragData.source === actor.id || !actor.isOwner) {
		return;
	}

	const sourceActor = game.actors.get(dragData.source) as GenesysActor | undefined;
	if (!sourceActor || !sourceActor.isOwner) {
		return;
	}

	if (!VehicleDataModel.RELEVANT_TYPES.DROP_ITEM.includes(dragData.itemType) || !VehicleDataModel.RELEVANT_TYPES.INVENTORY.includes(dragData.itemType)) {
		return;
	}

	let containedItems: GenesysItem<EquipmentDataModel>[] = [];
	if (dragData.itemType === 'container') {
		containedItems = sourceActor.items.filter((item) => (item as GenesysItem<EquipmentDataModel>).systemData.container === dragData.id) as GenesysItem<EquipmentDataModel>[];
		if (!containedItems.every((item) => VehicleDataModel.RELEVANT_TYPES.DROP_ITEM.includes(item.type) && VehicleDataModel.RELEVANT_TYPES.INVENTORY.includes(item.type))) {
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

	await mimicEffectsDetails(sourceActor, droppedItem.id, actor, itemInSelf.id);

	for (const containedItem of containedItems) {
		const itemAsObject = containedItem.toObject();
		const itemAsObjectSystem = itemAsObject.system as EquipmentDataModel;
		itemAsObjectSystem.state = EquipmentState.Carried;
		itemAsObjectSystem.container = itemInSelf.id;

		const [currentClonedItem] = await actor.createEmbeddedDocuments('Item', [itemAsObject]);

		await mimicEffectsDetails(sourceActor, containedItem.id, actor, currentClonedItem.id);

		await containedItem.delete();
		allCreatedItems.push(currentClonedItem);
	}

	await droppedItem.delete();

	handleEffectsSuppresion(EquipmentState.Carried, allCreatedItems as GenesysItem<EquipmentDataModel>[]);
}
</script>

<template>
	<section class="tab-inventory" @drop="dropInventoryBetweenActors">
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

		<div class="section-header">
			<span><Localized label="Genesys.Labels.Equipped" /></span>
		</div>

		<InventorySortSlot :active="draggingItem" @drop="sortDroppedItem($event, EquipmentState.Equipped, -1)" />

		<TransitionGroup name="inv">
			<template v-for="(item, index) in equippedItems" :key="item.id">
				<InventoryItem :item="item" draggable="true" :allow-dropping="false" @dragstart="draggingItem = true" @dragend="draggingItem = false" :dragging="draggingItem" @equipment-state-change="handleEffectsSuppresion" />

				<InventorySortSlot :active="draggingItem" @drop="sortDroppedItem($event, EquipmentState.Equipped, index)" />
			</template>
		</TransitionGroup>

		<div class="section-header">
			<span><Localized label="Genesys.Labels.Carried" /></span>
		</div>

		<InventorySortSlot :active="draggingItem" @drop="sortDroppedItem($event, EquipmentState.Carried, -1)" />

		<TransitionGroup name="inv">
			<template v-for="(item, index) in carriedItems" :key="item.id">
				<InventoryItem :item="item" draggable="true" :allow-dropping="false" @dragstart="draggingItem = true" @dragend="draggingItem = false" :dragging="draggingItem" @equipment-state-change="handleEffectsSuppresion" />

				<InventorySortSlot :active="draggingItem" @drop="sortDroppedItem($event, EquipmentState.Carried, index)" />
			</template>
		</TransitionGroup>
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
