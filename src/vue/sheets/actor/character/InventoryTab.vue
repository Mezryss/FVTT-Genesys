<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import { NAMESPACE as SETTINGS_NAMESPACE } from '@/settings';
import { KEY_MONEY_NAME } from '@/settings/campaign';
import Localized from '@/vue/components/Localized.vue';
import { vLocalize } from '@/vue/directives';
import EquipmentDataModel from '@/item/data/EquipmentDataModel';
import GenesysItem from '@/item/GenesysItem';
import Enriched from '@/vue/components/Enriched.vue';

const rootContext = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;
const inventory = computed(() => toRaw(rootContext.data.actor).items.filter((i) => EQUIPMENT_TYPES.includes(i.type)) as GenesysItem<EquipmentDataModel>[]);
const system = computed(() => toRaw(rootContext.data.actor).systemData);

const CURRENCY_LABEL = game.settings.get(SETTINGS_NAMESPACE, KEY_MONEY_NAME);

const EQUIPMENT_TYPES = ['weapon', 'armor', 'consumable', 'gear', 'container'];

async function editItem(item: GenesysItem) {
	await item.sheet?.render(true);
}

async function deleteItem(item: GenesysItem) {
	await item.delete();
}

async function cycleCarryState(item: GenesysItem<EquipmentDataModel>) {
	let newState: typeof item.systemData.state = 'carried';

	switch (item.systemData.state) {
		case 'carried':
			if (item.type === 'weapon' || item.type === 'armor') {
				newState = 'equipped';
			} else {
				newState = 'dropped';
			}
			break;

		case 'dropped':
			newState = 'carried';
			break;

		case 'equipped':
			newState = 'dropped';
			break;
	}

	await item.update({
		'system.state': newState,
	});
}
</script>

<template>
	<section class="tab-inventory item-list">
		<div v-for="equipmentType in EQUIPMENT_TYPES" :key="equipmentType" class="block">
			<div class="section-header" :data-section-type="equipmentType">
				<div></div>
				<div class="name"><Localized :label="`Genesys.Inventory.Sections.${equipmentType.capitalize()}`" /></div>
				<div><Localized label="Genesys.Labels.Quantity" /></div>
				<div class="encumbrance"><i class="fas fa-weight-hanging"></i></div>
				<div class="actions"></div>
			</div>

			<div v-for="item in inventory.filter((i) => i.type === equipmentType)" :key="item.id" class="item inventory-item" :data-item-id="item.id" :data-item-type="item.type">
				<div></div>
				<img :src="item.img" :alt="item.name" />
				<div class="name">
					<a>{{ item.name }}</a>
				</div>
				<div class="quantity">
					<a v-if="rootContext.data.editable"><i class="fas fa-minus"></i></a>
					<span>{{ item.systemData.quantity }}</span>
					<a v-if="rootContext.data.editable"><i class="fas fa-plus"></i></a>
				</div>
				<div>
					<template v-if="item.systemData.encumbrance < 0">+{{ Math.abs(item.systemData.encumbrance) }}</template>
					<template v-else>{{ Math.abs(item.systemData.encumbrance) }}</template>
				</div>
				<div v-if="rootContext.data.editable" class="actions">
					<!-- Container: Open/Closed -->
					<span v-if="item.type === 'container'" :class="`container-state ${item.system.open ? 'open' : 'closed'}`">
						<a v-if="item.system.open"><i class="fas fa-box"></i></a>
						<a v-if="!item.system.open"><i class="fas fa-box-open"></i></a>
					</span>

					<!-- Carried/Equipped/Dropped state only shows when outside a container. -->
					<span v-if="item.systemData.container === ''">
						<a @click="cycleCarryState(item)">
							<i v-if="item.type === 'weapon' && item.systemData.state === 'equipped'" class="fas fa-sword"></i>
							<i v-else-if="item.type === 'armor' && item.systemData.state === 'equipped'" class="fas fa-shield"></i>
							<i v-else-if="item.systemData.state === 'carried'" class="fas fa-sack"></i>
							<i v-else class="fas fa-shelves-empty"></i>
						</a>
					</span>

					<!-- Edit & Delete -->
					<a @click="editItem(item)"><i class="fas fa-edit"></i></a>
					<a @click="deleteItem(item)"><i class="fas fa-trash"></i></a>
				</div>
				<div class="description"><Enriched :value="item.systemData.description" /></div>
				<div v-if="item.type === 'container'" :class="`container-contents ${item.system.open ? 'open' : ''}`">
					<div>CONTAINER ITEMS!</div>
				</div>
			</div>
		</div>

		<div class="encumbrance-currency-row">
			<div class="currency-row">
				<label><i class="fas fa-coins"></i> {{ CURRENCY_LABEL }}:</label>
				<input type="text" name="system.currency" :value="system.currency" />
			</div>

			<div :class="`encumbrance-row ${system.isEncumbered ? 'encumbered' : ''}`">
				<span v-if="system.isEncumbered"><Localized label="Genesys.Labels.Encumbered" /></span>
				<span><i class="fas fa-weight-hanging" v-localize:title="'Genesys.Labels.Encumbrance'"></i></span>
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
	gap: 0.5em;
	padding: 0.5em;

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

	.block {
		background: transparentize(colors.$light-blue, 0.8);
		border-radius: 0.5em;
		padding-bottom: 0.5em;

		img {
			border: none;
			padding: 2px;
			border-radius: 0.25rem;
		}

		.container-state {
			&.closed > [data-toggle-container='close'] {
				display: none;
			}

			&.open > [data-toggle-container='open'] {
				display: none;
			}
		}

		.section-header,
		.inventory-item {
			display: grid;
			grid-template-columns: /* Padding */ 0.5em /* Icon */ 2em /* Name */ 1fr /* Quantity */ 60px /* Encumbrance */ 40px /* Actions */ 80px;
			align-items: center;
			justify-items: center;
			column-gap: 0.25em;

			.name {
				justify-self: left;
			}
		}

		.section-header {
			font-family: 'Bebas Neue', sans-serif;
			border-bottom: 1px solid black;
			padding-top: 0.25em;

			.name {
				font-size: 1.25em;
				grid-column: 2 / span 2;
			}
		}

		.quantity {
			display: flex;
			flex-direction: row;
			flex-wrap: nowrap;
			align-items: center;

			a {
				font-size: 0.75em;
				position: relative;
				top: 0.15em;
			}

			span {
				margin-left: 0.25em;
				margin-right: 0.25em;
			}
		}

		.actions {
			justify-self: right;
			padding-right: 0.5em;
			display: flex;
			gap: 0.25em;
		}

		.inventory-item {
			border-bottom: 1px dashed black;
			font-family: 'Roboto Serif', serif;
			grid-template-rows: auto auto;

			.container-contents,
			.description {
				grid-column: 1 / span all;
				justify-self: left;
				border-left: 4px solid colors.$light-blue;
				margin-left: 1em;
				padding-left: 0.5em;
			}

			.description {
				grid-row: 2 / span 1;
				max-height: 0;
				transition: max-height 0.5s ease-in-out;
				overflow: hidden;
				padding-right: 0.5em;

				&.active {
					max-height: 200px;
				}
			}

			.container-contents {
				grid-row: 3 / span 1;
				width: calc(100% - 1em);
				display: none;

				&.open {
					display: block;
				}
			}

			&:last-of-type {
				border-bottom: none;
			}
		}
	}
}
</style>
