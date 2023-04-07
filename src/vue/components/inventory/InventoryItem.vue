<script lang="ts" setup>
import { computed, inject, ref, toRaw } from 'vue';

import GenesysItem from '@/item/GenesysItem';
import ArmorDataModel from '@/item/data/ArmorDataModel';
// import ContainerDataModel from '@/item/data/ContainerDataModel';
import EquipmentDataModel, { EquipmentState } from '@/item/data/EquipmentDataModel';
import WeaponDataModel from '@/item/data/WeaponDataModel';
import Localized from '@/vue/components/Localized.vue';
import Tooltip from '@/vue/components/Tooltip.vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import ContextMenu from '@/vue/components/ContextMenu.vue';
import MenuItem from '@/vue/components/MenuItem.vue';

const props = withDefaults(
	defineProps<{
		item: GenesysItem<EquipmentDataModel>;
		dragging: boolean;
	}>(),
	{
		dragging: false,
	},
);

const emit = defineEmits<{
	(e: 'dragstart', event: DragEvent): void;
	(e: 'dragend', event: DragEvent): void;
}>();

const dragCounter = ref(0);
const isBeingDragged = ref(false);

const rootContext = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;

const isBasicItem = computed(() => ['consumable', 'gear'].includes(props.item.type));
const system = computed(() => props.item.systemData);

const armorData = computed(() => system.value as ArmorDataModel);
//const containerData = computed(() => system.value as ContainerDataModel);
const weaponData = computed(() => system.value as WeaponDataModel);

const dimForDrag = computed(() => props.dragging && props.item.type !== 'container');

const weaponDamage = computed(() => {
	if (weaponData.value.damageCharacteristic === '-') {
		return weaponData.value.baseDamage;
	}

	return rootContext.data.actor.systemData.characteristics[weaponData.value.damageCharacteristic] + weaponData.value.baseDamage;
});

async function openItem() {
	await toRaw(props.item).sheet?.render(true);
}

async function deleteItem() {
	const itemId = props.item.id;

	if (props.item.type === 'container') {
		// Delete all items in the container.
		await Promise.all(
			toRaw(rootContext.data.actor)
				.items.filter((i) => (i as GenesysItem<EquipmentDataModel>).systemData.container === itemId)
				.map((i) => i.delete()),
		);
	}

	await toRaw(props.item).delete();
}

async function setItemState(state: EquipmentState) {
	await props.item.update({
		'system.state': state,
	});
}

function skillForWeapon(): [name: string, id: string] {
	const validSkillNames = weaponData.value.skills.map((s) => s.toLowerCase());

	// Does the Adversary have one of these skills?
	const possessedSkill = toRaw(rootContext.data.actor).items.find((i) => i.type === 'skill' && validSkillNames.includes(i.name.toLowerCase()));

	if (possessedSkill) {
		return [possessedSkill.name, possessedSkill.id];
	} else {
		return [weaponData.value.skills[0], '-'];
	}
}

function dragStart(event: DragEvent) {
	isBeingDragged.value = true;

	event.dataTransfer?.setData(
		'text/plain',
		JSON.stringify({
			id: props.item.id,
			itemType: props.item.type,
		}),
	);

	emit('dragstart', event);
}

function dragEnd(event: DragEvent) {
	isBeingDragged.value = false;

	emit('dragend', event);
}

function dragEnter(event: DragEvent) {
	if (props.item.type !== 'container') {
		return;
	}

	const dragSource = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');

	// Only containers should be highlighted on hover, and containers cannot be dragged into other containers.
	// Additionally, if itemType isn't specified in the drag data, don't allow dropping directly into a container.
	if (dragSource.itemType === undefined || dragSource.itemType === 'container') {
		return;
	}

	dragCounter.value += 1;
}

function dragLeave() {
	dragCounter.value = Math.max(0, dragCounter.value - 1);
}

async function drop(event: DragEvent) {
	dragCounter.value = 0;

	if (props.item.type !== 'container') {
		return;
	}

	const dragSource = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');

	if (!dragSource.id) {
		return;
	}

	const item = toRaw(rootContext.data.actor).items.get(dragSource.id);
	if (!item || item.type === 'container') {
		return;
	}

	await item.update({
		'system.container': props.item.id,
	});
}
</script>

<template>
	<div
		:class="{
			'inventory-item': true,
			[system.state]: true,
			hover: dragCounter > 0,
			'drag-dim': dimForDrag && !isBeingDragged,
			'drag-source': isBeingDragged,
		}"
		@dragenter="dragEnter"
		@dragleave="dragLeave"
		@dragstart="dragStart"
		@dragend="dragEnd"
		@drop="drop"
	>
		<img :src="item.img" :alt="item.name" />

		<!-- Basic, single-row item -->
		<span v-if="isBasicItem" class="name" @dragenter="dragEnter" @dragleave="dragLeave">
			<a @click="openItem">{{ item.name }}</a>
		</span>
		<!-- Complex item with additional details row -->
		<div v-else class="details" @dragenter="dragEnter" @dragleave="dragLeave">
			<span class="name">
				<a @click="openItem">{{ item.name }}</a>
			</span>

			<div>
				<!-- Weapon Details -->
				<template v-if="item.type === 'weapon'">
					<!-- Skill -->
					<div>{{ skillForWeapon()[0] }}</div>

					<!-- Damage -->
					<div>
						Damage

						<span v-if="weaponData.damageCharacteristic === '-'">{{ weaponData.baseDamage }}</span>
						<span v-else-if="weaponData.baseDamage >= 0"> <Localized :label="`Genesys.CharacteristicAbbr.${weaponData.damageCharacteristic.capitalize()}`" />+{{ weaponData.baseDamage }} ({{ weaponDamage }})</span>
						<span v-else><Localized :label="`Genesys.CharacteristicAbbr.${weaponData.damageCharacteristic.capitalize()}`" />{{ weaponData.baseDamage }} ({{ weaponDamage }})</span>
					</div>

					<!-- Critical -->
					<div>Critical {{ weaponData.critical }}</div>

					<!-- Range -->
					<div>Range [<Localized :label="`Genesys.Range.${weaponData.range.capitalize()}`" />]</div>

					<!-- Qualities -->
					<div v-if="weaponData.qualities.length > 0" class="item-qualities">
						<Tooltip v-for="quality in weaponData.qualities" :key="quality.name" :content="quality.description"> {{ quality.name }}{{ quality.isRated && ` ${quality.rating}` }} </Tooltip>
					</div>
				</template>

				<!-- Armor Details -->
				<template v-else-if="item.type === 'armor'">
					<!-- Soak -->
					<div v-if="armorData.soak > 0">Soak +{{ armorData.soak }}</div>
					<div v-else-if="armorData.soak < 0">Soak {{ armorData.soak }}</div>

					<!-- Defense -->
					<div v-if="armorData.defense > 0">Defense +{{ armorData.defense }}</div>
					<div v-else-if="armorData.defense < 0">Defense {{ armorData.defense }}</div>

					<!-- Qualities -->
					<div v-if="armorData.qualities.length > 0" class="item-qualities">
						<Tooltip v-for="quality in weaponData.qualities" :key="quality.name" :content="quality.description"> {{ quality.name }}{{ quality.isRated && ` ${quality.rating}` }} </Tooltip>
					</div>
				</template>

				<!-- Container Details -->
				<template v-else-if="item.type === 'container'">
					<em>...</em>
				</template>
			</div>
		</div>

		<div class="weight">{{ system.encumbrance }} <i class="fas fa-weight-hanging"></i></div>

		<ContextMenu class="actions" orientation="left" use-primary-click :disable-menu="!rootContext.data.editable">
			<template v-slot:menu-items>
				<MenuItem v-if="item.type === 'weapon' && item.systemData.state !== EquipmentState.Equipped" @click="setItemState(EquipmentState.Equipped)">
					<template v-slot:icon><i class="fas fa-sword"></i></template>
					Equip
				</MenuItem>

				<MenuItem v-if="item.type === 'armor' && item.systemData.state !== EquipmentState.Equipped" @click="setItemState(EquipmentState.Equipped)">
					<template v-slot:icon><i class="fas fa-shield"></i></template>
					Equip
				</MenuItem>

				<MenuItem v-if="['weapon', 'armor'].includes(item.type) && item.systemData.state === EquipmentState.Equipped" @click="setItemState(EquipmentState.Carried)">
					<template v-slot:icon><i class="fas fa-backpack"></i></template>
					Unequip
				</MenuItem>

				<MenuItem v-if="[EquipmentState.Carried, EquipmentState.Equipped].includes(item.systemData.state)" @click="setItemState(EquipmentState.Dropped)">
					<template v-slot:icon><i class="fas fa-shelves"></i></template>
					Drop
				</MenuItem>

				<MenuItem v-if="item.systemData.state === EquipmentState.Dropped" @click="setItemState(EquipmentState.Carried)">
					<template v-slot:icon><i class="fas fa-backpack"></i></template>
					Pick Up
				</MenuItem>

				<hr />

				<MenuItem>
					<template v-slot:icon><i class="fas fa-comment"></i></template>
					To Chat
				</MenuItem>

				<MenuItem @click="openItem">
					<template v-slot:icon><i class="fas fa-edit"></i></template>
					Edit
				</MenuItem>

				<MenuItem @click="deleteItem">
					<template v-slot:icon><i class="fas fa-trash"></i></template>
					Delete
				</MenuItem>
			</template>

			<a>
				<i class="fas fa-ellipsis-vertical"></i>
			</a>
		</ContextMenu>
	</div>
</template>

<style lang="scss" scoped>
@use '@/scss/vars/colors.scss';

.inventory-item {
	display: grid;
	grid-template-columns: [icon] 2rem [name] auto [spacer] 1fr [weight] auto [actions] auto;
	align-items: center;
	column-gap: 0.5em;

	background: transparentize(colors.$light-blue, 0.85);
	border: 1px solid transparentize(colors.$light-blue, 0.7);
	border-radius: 0.25em;
	padding: 2px;

	user-select: none;
	transition: all 0.25s ease-in-out;

	margin-bottom: 0.25em;

	&.hover {
		background: transparentize(colors.$light-blue, 0.4) !important;
		border: 1px solid transparentize(colors.$light-blue, 0.2) !important;
	}

	&.drag-source {
		background: transparentize(colors.$light-blue, 0.6) !important;
		border: 1px solid transparentize(colors.$light-blue, 0.4) !important;
	}

	&.dropped {
		background: transparentize(#333, 0.9);
		border: 1px solid transparentize(#333, 0.85);

		img,
		.name,
		.weight {
			opacity: 65%;
		}

		&:hover {
			background: transparentize(#333, 0.75);
			border: 1px solid transparentize(#333, 0.5);
		}
	}

	&.drag-dim {
		position: relative;

		background: transparentize(#333, 0.85);
		border: 1px solid transparentize(#333, 0.7);

		opacity: 65%;
	}

	&:hover {
		background: transparentize(colors.$light-blue, 0.75);
		border: 1px solid transparentize(colors.$light-blue, 0.5);
	}

	img {
		grid-column: icon / span 1;
	}

	& > .name {
		grid-column: name / span 1;
	}

	.name {
		font-family: 'Roboto Serif', serif;
		font-size: 1.15em;
	}

	.details {
		display: grid;
		grid-template-rows: auto auto;
		grid-column: name / span 2;
		font-family: 'Roboto Serif', serif;

		& > div {
			grid-row: 2 / span 1;
			margin-left: 0.5em;
			display: flex;
			flex-wrap: wrap;
			font-size: 0.9em;
			color: colors.$dark-blue;
			gap: 0.25em;

			& > div {
				&:after {
					display: inline;
					content: ';';
				}

				&:last-child:after {
					display: none;
				}
			}
		}
	}

	.item-qualities {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25em;

		& > div {
			cursor: help;
			white-space: nowrap;

			&:after {
				display: inline;
				content: ',';
			}

			&:last-child:after {
				display: none;
			}
		}
	}

	.quantity {
		grid-column: quantity / span 1;
	}

	.weight {
		display: flex;
		align-items: center;
		column-gap: 0.25em;
		grid-column: weight / span 1;
		font-family: 'Bebas Neue', sans-serif;
		font-size: 1.25em;
		text-align: center;
		color: colors.$dark-blue;

		i {
			position: relative;
			top: -1px;
			font-size: 0.75em;
		}
	}

	.actions {
		grid-column: actions / span 1;
		width: 1.5em;
		text-align: center;
	}
}
</style>
