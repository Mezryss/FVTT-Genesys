<script lang="ts" setup>
import { computed, inject, ref, toRaw } from 'vue';

import GenesysItem from '@/item/GenesysItem';
import ArmorDataModel from '@/item/data/ArmorDataModel';
import EquipmentDataModel, { EquipmentState } from '@/item/data/EquipmentDataModel';
import WeaponDataModel from '@/item/data/WeaponDataModel';
import Localized from '@/vue/components/Localized.vue';
import Tooltip from '@/vue/components/Tooltip.vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import ContextMenu from '@/vue/components/ContextMenu.vue';
import MenuItem from '@/vue/components/MenuItem.vue';
import DicePrompt, { RollType } from '@/app/DicePrompt';

const props = withDefaults(
	defineProps<{
		item: GenesysItem<EquipmentDataModel>;
		dragging?: boolean;
		mini?: boolean;
	}>(),
	{
		dragging: false,
		mini: false,
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
const weaponData = computed(() => system.value as WeaponDataModel);

const dimForDrag = computed(() => props.dragging && props.item.type !== 'container');

const displayContainerContents = ref(false);
const containedItems = computed(() => toRaw(rootContext.data.actor).items.filter((i) => (i as GenesysItem<EquipmentDataModel>).systemData.container === props.item.id) as GenesysItem<EquipmentDataModel>[]);

const weaponDamage = computed(() => {
	if (weaponData.value.damageCharacteristic === '-') {
		return weaponData.value.baseDamage;
	}

	return rootContext.data.actor.systemData.characteristics[weaponData.value.damageCharacteristic] + weaponData.value.baseDamage;
});

async function rollAttack() {
	const [_, skillId] = skillForWeapon();
	await DicePrompt.promptForRoll(toRaw(rootContext.data.actor), skillId, {
		rollType: RollType.Attack,
		rollData: {
			weapon: props.item,
		},
	});
}

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
	await Promise.all(
		containedItems.value.map((i) =>
			i.update({
				'system.state': state,
			}),
		),
	);

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

async function changeItemQuantity(item: GenesysItem, value: number) {
	if (value <= 0) {
		await toRaw(item).delete();
	} else {
		await toRaw(item).update({
			'system.quantity': value,
		});
	}
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
		'system.state': props.item.systemData.state,
	});
}
</script>

<template>
	<div
		:class="{
			'inventory-item': true,
			mini: props.mini,
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
		<span v-if="mini || isBasicItem" class="name" @dragenter="dragEnter" @dragleave="dragLeave">
			<a @click="openItem">{{ item.name }}</a>
		</span>
		<!-- Complex item with additional details row -->
		<div v-else class="details" @dragenter="dragEnter" @dragleave="dragLeave">
			<span class="name">
				<a @click="openItem">{{ item.name }}</a>
				<button class="attack" v-if="item.type === 'weapon' && system.state === EquipmentState.Equipped" @click="rollAttack">Attack</button>
			</span>

			<div :data-item-type="item.type">
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
					<a v-if="displayContainerContents" @click="displayContainerContents = false"><i class="fas fa-box-open"></i> Close Container</a>
					<a v-else @click="displayContainerContents = true"><i class="fas fa-box"></i> {{ containedItems.length }} Items</a>
				</template>
			</div>
		</div>

		<a class="quantity" @click="changeItemQuantity(item, item.systemData.quantity + 1)" @contextmenu="changeItemQuantity(item, item.systemData.quantity - 1)" v-if="item.type !== 'container'">
			{{ item.systemData.quantity }}
			<i class="fas fa-backpack"></i>
		</a>

		<div class="weight">{{ system.encumbrance < 0 ? '+' : null }}{{ Math.abs(system.encumbrance) }} <i class="fas fa-weight-hanging"></i></div>

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

		<Transition name="container-contents">
			<div v-if="displayContainerContents" class="contents">
				<InventoryItem
					v-for="item in containedItems"
					:item="item"
					mini
					draggable="true"
					@dragstart="
						$event.stopPropagation();
						emit('dragstart', $event);
					"
					@dragend="
						$event.stopPropagation();
						emit('dragend', $event);
					"
				/>
			</div>
		</Transition>
	</div>
</template>

<style lang="scss" scoped>
@use '@/scss/vars/colors.scss';

.inventory-item {
	display: grid;
	grid-template-columns: [icon] 2rem [name] auto [spacer] 1fr [quantity] 2.5em [weight] 2.5em [actions] auto;
	grid-template-rows: auto auto;
	align-items: center;
	column-gap: 0.5em;

	background: transparentize(colors.$light-blue, 0.85);
	border: 1px solid transparentize(colors.$light-blue, 0.7);
	border-radius: 0.25em;
	padding: 2px;

	user-select: none;
	transition: all 0.25s ease-in-out;

	margin-bottom: 0.25em;

	&:not(.mini) {
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

			& > :not(.actions) {
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
	}

	&.mini {
		grid-template-columns: [icon] 1.5em [name] auto [spacer] 1fr [quantity] 2.5em [weight] 2.5em [actions] auto;
		height: 2em;
		overflow: hidden;
		font-size: 0.8em;
		margin-left: 1.5em;

		background: transparentize(colors.$blue, 0.8);
		border: 1px solid transparentize(colors.$blue, 0.5);

		&:hover {
			background: transparentize(colors.$blue, 0.6);
			border: 1px solid transparentize(colors.$blue, 0.5);
		}

		.quantity,
		.weight {
			color: colors.$blue;
		}
	}

	&:hover {
		background: transparentize(colors.$light-blue, 0.75);
		border: 1px solid transparentize(colors.$light-blue, 0.5);
	}

	img {
		grid-column: icon / span 1;
		border-radius: 0.25em;
	}

	& > .name {
		grid-column: name / span 1;
	}

	.contents {
		grid-column: icon / span all;
		grid-row: 2 / span all;
		transform-origin: top center;
		max-height: 100px;
		overflow-y: scroll;
		padding-right: 0.5em;
	}

	.name {
		font-family: 'Roboto Serif', serif;
		font-size: 1.15em;
		display: flex;
		align-items: center;
		gap: 0.25em;

		button.attack {
			height: 1.5em;
			padding: 0;
			margin: 0;
			width: auto !important;
			line-height: 1em;
			padding: 2px;

			background: colors.$gold;
			color: white;
		}
	}

	.details {
		display: grid;
		grid-template-rows: auto auto;
		grid-column: name / span 2;
		font-family: 'Roboto Serif', serif;

		& > div {
			grid-row: 2 / span 1;
			display: flex;
			flex-wrap: wrap;
			font-size: 0.9em;
			color: colors.$dark-blue;
			gap: 0.25em;

			&:not([data-item-type='container']) {
				margin-left: 0.5em;
			}

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

	.weight {
		grid-column: weight / span 1;
	}

	.quantity {
		grid-column: quantity / span 1;
	}

	.weight,
	.quantity {
		grid-row: 1 / span 1;
		display: flex;
		align-items: center;
		column-gap: 0.25em;
		font-family: 'Bebas Neue', sans-serif;
		font-size: 1.25em;
		text-align: center;
		color: colors.$dark-blue;
		width: 100%;
		justify-content: flex-end;

		i {
			position: relative;
			top: -1px;
			font-size: 0.75em;
		}
	}

	.actions {
		grid-column: actions / span 1;
		width: 1.25em;
		text-align: center;
	}
}

.container-contents-enter-active {
	animation: expand 0.5s;
}

.container-contents-leave-active {
	animation: expand 0.5s reverse;
}

@keyframes expand {
	0% {
		transform: scaleY(0);
		max-height: 0;
	}
	100% {
		transform: scaleY(1);
		max-height: 100px;
	}
}
</style>
