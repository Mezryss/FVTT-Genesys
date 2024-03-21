<script lang="ts" setup>
import { computed, inject, ref, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';

import GenesysItem from '@/item/GenesysItem';
import ArmorDataModel from '@/item/data/ArmorDataModel';
import EquipmentDataModel, { EquipmentDamageState, EquipmentState } from '@/item/data/EquipmentDataModel';
import BaseWeaponDataModel from '@/item/data/BaseWeaponDataModel';
import WeaponDataModel from '@/item/data/WeaponDataModel';
import VehicleWeaponDataModel from '@/item/data/VehicleWeaponDataModel';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import VehicleDataModel from '@/actor/data/VehicleDataModel';
import { constructDragTransferTypeFromData, DragTransferData, extractDataFromDragTransferTypes } from '@/data/DragTransferData';
import { transferInventoryBetweenActors } from '@/operations/TransferBetweenActors';

import Localized from '@/vue/components/Localized.vue';
import Tooltip from '@/vue/components/Tooltip.vue';
import ContextMenu from '@/vue/components/ContextMenu.vue';
import MenuItem from '@/vue/components/MenuItem.vue';
import DicePrompt, { RollType } from '@/app/DicePrompt';

const props = withDefaults(
	defineProps<{
		item: GenesysItem<EquipmentDataModel>;
		dragging?: boolean;
		mini?: boolean;
		allowEquippedState?: boolean;
		allowDroppedState?: boolean;
		canTypeBeDropped?: (type: string) => boolean;
		canTypeBeInsideContainer?: (type: string) => boolean;
		canTypeBeTransfered?: (type: string) => boolean;
	}>(),
	{
		dragging: false,
		mini: false,
		allowEquippedState: true,
		allowDroppedState: true,
		canTypeBeDropped: () => false,
		canTypeBeInsideContainer: () => false,
		canTypeBeTransfered: () => false,
	},
);

const emit = defineEmits<{
	(e: 'dragstart', event: DragEvent): void;
	(e: 'dragend', event: DragEvent): void;
	(e: 'equipmentStateChange', items: GenesysItem[], desiredState: EquipmentState): void;
}>();

const damageStateToIcon = new Map([
	[EquipmentDamageState.Undamaged, 'fa-face-smile-beam'],
	[EquipmentDamageState.Minor, 'fa-face-meh'],
	[EquipmentDamageState.Moderate, 'fa-face-frown'],
	[EquipmentDamageState.Major, 'fa-face-dizzy'],
]);
const damageStateProgression = Array.from(damageStateToIcon.keys());

const dragCounter = ref(0);
const isBeingDragged = ref(false);

const context = inject<ActorSheetContext<CharacterDataModel | VehicleDataModel>>(RootContext)!;

const isBasicItem = computed(() => ['consumable', 'gear'].includes(props.item.type));
const system = computed(() => props.item.systemData);

const armorData = computed(() => system.value as ArmorDataModel);
const weaponData = computed(() => ({ baseWeapon: system.value as BaseWeaponDataModel, charWeapon: system.value as WeaponDataModel, vehWeapon: system.value as VehicleWeaponDataModel }));

const dimForDrag = computed(() => props.dragging && props.item.type !== 'container');

const displayContainerContents = ref(false);
const containedItems = computed(() => toRaw(context.data.actor).items.filter((i) => (i as GenesysItem<EquipmentDataModel>).systemData.container === props.item.id) as GenesysItem<EquipmentDataModel>[]);

const weaponDamage = computed(() => {
	const characterActor = context.data.actor.systemData as CharacterDataModel;
	if (weaponData.value.charWeapon.damageCharacteristic && weaponData.value.charWeapon.damageCharacteristic !== '-' && characterActor.characteristics) {
		return characterActor.characteristics[weaponData.value.charWeapon.damageCharacteristic] + weaponData.value.baseWeapon.baseDamage;
	}

	return weaponData.value.baseWeapon.baseDamage;
});

async function rollAttack() {
	const [skillName] = skillForWeapon();
	await DicePrompt.promptForRoll(toRaw(context.data.actor), skillName, {
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
			toRaw(context.data.actor)
				.items.filter((i) => (i as GenesysItem<EquipmentDataModel>).systemData.container === itemId)
				.map((i) => i.delete()),
		);
	}

	await toRaw(props.item).delete();
}

async function sendItemToChat() {
	const enrichedDescription = await TextEditor.enrichHTML(system.value.description, { async: true });

	let qualities = undefined;

	if (['armor', 'weapon', 'vehicleWeapon'].includes(props.item.type)) {
		const itemQualities = (system.value as WeaponDataModel | ArmorDataModel).qualities;

		await Promise.all(
			itemQualities.map(async (quality) => {
				quality.description = await TextEditor.enrichHTML(quality.description, { async: true });
			}),
		);

		qualities = itemQualities;
	}

	let weapon = undefined;
	if (props.item.type === 'weapon') {
		weapon = {
			skill: weaponData.value.charWeapon.skills[0] ?? '-',
			damage:
				(weaponData.value.charWeapon.baseDamage ?? 0).toString() +
				(weaponData.value.charWeapon.damageCharacteristic !== '-' ? ' + ' + game.i18n.localize(`Genesys.CharacteristicAbbr.${weaponData.value.charWeapon.damageCharacteristic.capitalize()}`) : ''),
		};
	} else if (props.item.type === 'vehicleWeapon') {
		weapon = {
			skill: weaponData.value.vehWeapon.skills[0] ?? '-',
			damage: (weaponData.value.vehWeapon.baseDamage ?? 0).toString(),
			firingArc: getFiringArcLabels(weaponData.value.vehWeapon).join(', '),
		};
	}

	const chatTemplate = await renderTemplate('systems/genesys/templates/chat/item.hbs', {
		img: props.item.img,
		name: props.item.name,
		type: props.item.type,
		system: system.value,
		description: enrichedDescription,
		weapon,
		qualities,
	});
	await ChatMessage.create({
		user: game.user.id,
		speaker: {
			actor: game.user.character?.id,
		},
		content: chatTemplate,
		type: CONST.CHAT_MESSAGE_TYPES.IC,
	});
}

async function setItemState(state: EquipmentState) {
	// The 'emit' must happen before the state is updated, otherwise the component will be unmounted and the callback set by the
	// parent won't fire.
	emit('equipmentStateChange', [...containedItems.value, props.item], state);

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
	const validSkillNames = weaponData.value.baseWeapon.skills.map((s) => s.toLowerCase());

	// Does the Adversary have one of these skills?
	const possessedSkill = toRaw(context.data.actor).items.find((i) => i.type === 'skill' && validSkillNames.includes(i.name.toLowerCase()));

	if (possessedSkill) {
		return [possessedSkill.name, possessedSkill.id];
	} else {
		return [weaponData.value.baseWeapon.skills[0], '-'];
	}
}

function getFiringArcLabels(weapon: VehicleWeaponDataModel) {
	const possibleDirections = Object.entries(weapon.firingArc);
	const firingArc = possibleDirections.filter(([_arc, canFire]) => canFire);

	if (possibleDirections.length == firingArc.length) {
		return [game.i18n.localize('Genesys.FiringArc.All')];
	} else if (firingArc.length === 0) {
		return [game.i18n.localize('Genesys.FiringArc.None')];
	} else {
		return firingArc.map(([arc, _canFire]) => game.i18n.localize(`Genesys.FiringArc.${arc.capitalize()}`));
	}
}

function isEquipableItem(item: GenesysItem<EquipmentDataModel>) {
	return (context.data.actor.systemData.constructor as typeof VehicleDataModel | typeof CharacterDataModel).isRelevantTypeForContext('EQUIPABLE', item.type);
}

function canEquipItem(item: GenesysItem<EquipmentDataModel>) {
	return isEquipableItem(item) && item.systemData.state !== EquipmentState.Equipped;
}

function canUnequipItem(item: GenesysItem<EquipmentDataModel>) {
	return isEquipableItem(item) && item.systemData.state === EquipmentState.Equipped;
}

function canDropItem(item: GenesysItem<EquipmentDataModel>) {
	return context.data.actor.type === 'character' && [EquipmentState.Carried, EquipmentState.Equipped].includes(item.systemData.state);
}

function canPickupItem(item: GenesysItem<EquipmentDataModel>) {
	return context.data.actor.type === 'character' && item.systemData.state === EquipmentState.Dropped;
}

function dragStart(event: DragEvent) {
	isBeingDragged.value = true;
	const transferData: DragTransferData = {
		uuid: props.item.uuid,
		type: props.item.documentName,
		genesysType: props.item.type,
	};
	const genesysTransferType = constructDragTransferTypeFromData(props.item.type, props.item.uuid);

	event.dataTransfer?.setData('text/plain', JSON.stringify(transferData));
	event.dataTransfer?.setData(genesysTransferType, '');

	emit('dragstart', event);
}

function dragEnd(event: DragEvent) {
	isBeingDragged.value = false;

	emit('dragend', event);
}

function dragEnter(event: DragEvent) {
	// Only containers should be highlighted on hover.
	if (props.item.type !== 'container') {
		return;
	}

	const dragDataFromType = extractDataFromDragTransferTypes(event.dataTransfer?.types);
	if (!dragDataFromType || (dragDataFromType.genesysType && !props.canTypeBeInsideContainer(dragDataFromType.genesysType))) {
		return;
	}

	dragCounter.value += 1;
}

function dragLeave() {
	dragCounter.value = Math.max(0, dragCounter.value - 1);
}

async function changeItemQuantity(event: MouseEvent, item: GenesysItem, value: number) {
	const containerDiv = (event.currentTarget as HTMLAnchorElement | null)?.parentElement?.parentElement;
	const containerScroll = containerDiv?.scrollTop;

	if (value <= 0) {
		await toRaw(item).delete();
	} else {
		await toRaw(item).update({
			'system.quantity': value,
		});
	}

	if (containerDiv && containerScroll !== undefined) {
		containerDiv.scrollTop = containerScroll;
	}
}

async function changeDamageState(item: GenesysItem, currentState: EquipmentDamageState, direction: number) {
	const currentDamageStateIndex = damageStateProgression.indexOf(currentState);
	const newDamageStateIndex = currentDamageStateIndex + direction;

	if (currentDamageStateIndex === -1 || newDamageStateIndex < 0 || newDamageStateIndex >= damageStateToIcon.size) {
		return;
	} else {
		await toRaw(item).update({
			'system.damage': damageStateProgression[newDamageStateIndex],
		});
	}
}

async function dropInventoryIntoContainer(event: DragEvent) {
	dragCounter.value = 0;

	// Make sure we have the UUID from the dropped entity, and if possible check if they can be processed on this component.
	const dragData = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}') as DragTransferData;
	if (!dragData.uuid || (dragData.genesysType && !props.canTypeBeDropped(dragData.genesysType))) {
		return;
	}

	// Make sure that the item in question exists and can be processed on this component.
	let droppedItem = await fromUuid<GenesysItem<EquipmentDataModel>>(dragData.uuid);
	if (!droppedItem || !props.canTypeBeDropped(droppedItem.type)) {
		return;
	}
	// We are handling the dropped item here so no need to let other components process it.
	event.stopPropagation();

	// The user must own the actor, the current item must be a container, and the dropped item can be inside the container.
	const actor = toRaw(context.data.actor);
	if (!actor.isOwner || props.item.type !== 'container' || !props.canTypeBeInsideContainer(droppedItem.type)) {
		return;
	}

	// If the item was dropped from another actor then we try transfering it and save a reference to it.
	const sourceActor = droppedItem.actor;
	const isDropFromAnotherActor = sourceActor && sourceActor.uuid !== actor.uuid;
	if (isDropFromAnotherActor) {
		const clonedItem = await transferInventoryBetweenActors(dragData, actor, props.canTypeBeTransfered);
		droppedItem = clonedItem?.[0] ?? null;

		if (!droppedItem) {
			return;
		}
	} else if (!sourceActor) {
		[droppedItem] = (await actor.createEmbeddedDocuments('Item', [droppedItem.toObject()])) as GenesysItem<EquipmentDataModel>[];
	}

	// Mark the items as being inside the dropped container.
	const updateMap = new Map<string, any>();
	updateMap.set('system.container', props.item.id);

	// Update the item equipment state to match the state of the container.
	const mustUpdateEquipmentState = props.item.systemData.state !== droppedItem.systemData.state;
	if (mustUpdateEquipmentState) {
		updateMap.set('system.state', props.item.systemData.state);
	}

	// Notify the parent that the drropped item has changed equipment state either because it's new or because it was moved to a container
	// with a different equipment state.
	if (mustUpdateEquipmentState || isDropFromAnotherActor) {
		emit('equipmentStateChange', [droppedItem], props.item.systemData.state);
	}

	await droppedItem.update(Object.fromEntries(updateMap));
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
		@drop="dropInventoryIntoContainer"
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
				<template v-if="item.type === 'weapon' || item.type === 'vehicleWeapon'">
					<!-- Skill -->
					<div>{{ weaponData.baseWeapon.skills[0] ?? '-' }}</div>

					<!-- Firing Arc -->
					<div v-if="weaponData.vehWeapon.firingArc" class="firing-arc">
						<Localized label="Genesys.Labels.FiringArc" /> <span v-for="arc in getFiringArcLabels(weaponData.vehWeapon)" :key="arc">{{ arc }}</span>
					</div>

					<!-- Damage -->
					<div>
						<Localized label="Genesys.Labels.Damage" /> <span v-if="!weaponData.charWeapon.damageCharacteristic || weaponData.charWeapon.damageCharacteristic === '-'">{{ weaponData.baseWeapon.baseDamage }}</span>
						<span v-else-if="weaponData.baseWeapon.baseDamage >= 0">
							<Localized :label="`Genesys.CharacteristicAbbr.${weaponData.charWeapon.damageCharacteristic.capitalize()}`" />+{{ weaponData.baseWeapon.baseDamage }} ({{ weaponDamage }})</span
						>
						<span v-else><Localized :label="`Genesys.CharacteristicAbbr.${weaponData.charWeapon.damageCharacteristic.capitalize()}`" />{{ weaponData.baseWeapon.baseDamage }} ({{ weaponDamage }})</span>
					</div>

					<!-- Critical -->
					<div><Localized label="Genesys.Labels.Critical" /> {{ weaponData.baseWeapon.critical }}</div>

					<!-- Range -->
					<div><Localized label="Genesys.Labels.Range" /> [<Localized :label="`Genesys.Range.${weaponData.baseWeapon.range.capitalize()}`" />]</div>

					<!-- Qualities -->
					<div v-if="weaponData.baseWeapon.qualities.length > 0" class="item-qualities">
						<Tooltip v-for="quality in weaponData.baseWeapon.qualities" :key="quality.name" :content="quality.description === '' ? 'Genesys.Tooltips.NoDescription' : quality.description" :localized="quality.description === ''">
							{{ quality.name }}{{ quality.isRated ? ` ${quality.rating}` : '' }}
						</Tooltip>
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
						<Tooltip v-for="quality in armorData.qualities" :key="quality.name" :content="quality.description === '' ? 'Genesys.Tooltips.NoDescription' : quality.description" :localized="quality.description === ''">
							{{ quality.name }}{{ quality.isRated ? ` ${quality.rating}` : '' }}
						</Tooltip>
					</div>
				</template>

				<!-- Container Details -->
				<template v-else-if="item.type === 'container'">
					<a v-if="displayContainerContents" @click="displayContainerContents = false"><i class="fas fa-box-open"></i> Close Container</a>
					<a v-else @click="displayContainerContents = true"><i class="fas fa-box"></i> {{ containedItems.length }} Items</a>
				</template>
			</div>
		</div>

		<a
			v-if="item.type !== 'container'"
			class="quantity"
			@click="changeItemQuantity($event, item, item.systemData.quantity + 1)"
			@contextmenu="changeItemQuantity($event, item, item.systemData.quantity - 1)"
			data-tooltip="Genesys.Labels.Quantity"
		>
			{{ item.systemData.quantity }}
			<i class="fas fa-backpack"></i>
		</a>

		<div class="weight" data-tooltip="Genesys.Labels.Encumbrance">{{ system.encumbrance < 0 ? '+' : null }}{{ Math.abs(system.encumbrance) }} <i class="fas fa-weight-hanging"></i></div>

		<a
			class="damage"
			@click="changeDamageState(item, item.systemData.damage, +1)"
			@contextmenu="changeDamageState(item, item.systemData.damage, -1)"
			:data-tooltip="'Genesys.Equipment.DamageState.' + item.systemData.damage.capitalize()"
		>
			<i :class="{ fas: true, [damageStateToIcon.get(item.systemData.damage)!]: true }"></i>
		</a>

		<ContextMenu class="actions" orientation="left" use-primary-click :disable-menu="!context.data.editable || mini">
			<template v-slot:menu-items>
				<MenuItem v-if="allowEquippedState && ['weapon', 'vehicleWeapon'].includes(item.type) && canEquipItem(item)" @click="setItemState(EquipmentState.Equipped)">
					<template v-slot:icon><i class="fas fa-sword"></i></template>
					Equip
				</MenuItem>

				<MenuItem v-if="allowEquippedState && item.type === 'armor' && canEquipItem(item)" @click="setItemState(EquipmentState.Equipped)">
					<template v-slot:icon><i class="fas fa-shield"></i></template>
					Equip
				</MenuItem>

				<MenuItem v-if="allowEquippedState && canUnequipItem(item)" @click="setItemState(EquipmentState.Carried)">
					<template v-slot:icon><i class="fas fa-backpack"></i></template>
					Unequip
				</MenuItem>

				<MenuItem v-if="allowDroppedState && canDropItem(item)" @click="setItemState(EquipmentState.Dropped)">
					<template v-slot:icon><i class="fas fa-shelves"></i></template>
					Drop
				</MenuItem>

				<MenuItem v-if="allowDroppedState && canPickupItem(item)" @click="setItemState(EquipmentState.Carried)">
					<template v-slot:icon><i class="fas fa-backpack"></i></template>
					Pick Up
				</MenuItem>

				<hr v-if="(allowEquippedState && isEquipableItem(item)) || allowDroppedState" />

				<MenuItem @click="sendItemToChat">
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
					:key="item.id"
					mini
					draggable="true"
					:allow-equipped-state="allowEquippedState"
					:allow-dropped-state="allowDroppedState"
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
	grid-template-columns: [icon] 2rem [name] auto [spacer] 1fr [quantity] 2.5em [weight] 2.5em [damage] 2em [actions] auto;
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
		grid-template-columns: [icon] 1.5em [name] auto [spacer] 1fr [quantity] 2.5em [weight] 2.5em [damage] 2em [actions] auto;
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
		overflow-y: auto;
		padding-right: 0.5em;

		&:empty {
			display: none;
		}
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

		.firing-arc {
			text-align: center;

			& > span {
				display: inline-flex;
				flex-direction: row;
				flex-wrap: nowrap;
				gap: 0.5em;

				&::after {
					content: ',';
					margin-right: 0.25em;
					margin-left: -0.4em;
				}

				&:last-of-type::after {
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

	.weight,
	.quantity,
	.damage {
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

	.weight {
		grid-column: weight / span 1;
	}

	.quantity {
		grid-column: quantity / span 1;
	}

	.damage {
		grid-column: damage / span 1;
		font-size: 1.5em;
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
