<script lang="ts" setup>
import VehicleDataModel from '@/actor/data/VehicleDataModel';
import { inject, computed, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import Localized from '@/vue/components/Localized.vue';
import Editor from '@/vue/components/Editor.vue';

const context = inject<ActorSheetContext<VehicleDataModel>>(RootContext)!;
const system = computed(() => toRaw(context.data.actor).systemData);
</script>

<template>
	<section class="tab-details">
		<div class="description-section">
			<section class="description">
				<div class="header"><Localized label="Genesys.Tabs.Description" /></div>
				<Editor name="system.description" :content="system.description" button />
			</section>

			<section class="illustration">
				<div class="header"><Localized label="Genesys.Labels.Illustration" /></div>
				<img :src="system.illustration" data-edit="system.illustration" />
			</section>
		</div>

		<section class="info-section">
			<div class="header"><Localized label="Genesys.Labels.Information" /></div>

			<div class="details">
				<label><Localized label="Genesys.Labels.Complement" /></label>
				<input type="text" name="system.complement" :value="system.complement" />
				<div class="underline" />

				<label><Localized label="Genesys.Labels.Consumables" /></label>
				<input type="text" name="system.consumables" :value="system.consumables" />
				<div class="underline" />

				<div class="double-details">
					<label><Localized label="Genesys.Labels.Price" /></label>
					<input type="number" name="system.price" :value="system.price" />

					<label><Localized label="Genesys.Labels.Rarity" /></label>
					<input type="number" name="system.rarity" :value="system.rarity" />
				</div>

				<div class="split-underline"><span /><span /></div>

				<div class="double-details">
					<label><Localized label="Genesys.Labels.PassengerCapacity" /></label>
					<input type="number" name="system.passengers.threshold" :value="system.passengers.threshold" />

					<label><Localized label="Genesys.Labels.EncumbranceCapacity" /></label>
					<input type="number" name="system.encumbrance.threshold" :value="system.encumbrance.threshold" />
				</div>

				<div class="split-underline"><span /><span /></div>

				<label><Localized label="Genesys.Labels.Source" /></label>
				<input type="text" name="system.source" :value="system.source" />
			</div>
		</section>
	</section>
</template>

<style lang="scss" scoped>
@use '@scss/mixins/reset.scss';
@use '@scss/vars/colors.scss';

.tab-details {
	display: grid;
	grid-template-rows: auto auto;
	gap: 0.5em;
	padding: 0.5em;

	section {
		background: transparentize(colors.$light-blue, 0.8);
		border-radius: 1em;
		padding: 0.75em;

		& > .header {
			text-align: right;
			font-size: 1.1em;
			font-family: 'Bebas Neue', sans-serif;
			width: 100%;
		}
	}

	img {
		border: none;
		object-fit: cover;
		width: 100%;
		height: 100%;
		min-height: 100px;

		&[src=''] {
			background: green;
		}
	}

	.description-section {
		display: grid;
		grid-template-columns: 1fr min(33%, 250px);
		grid-row: 1 / span 1;
		gap: 0.5em;

		.description {
			grid-column: 1 / span 1;
			display: flex;
			flex-direction: column;
			min-height: 15rem;
			max-height: 20rem;

			.editor {
				background: white;
				border: 1px solid black;
			}
		}

		.illustration {
			grid-column: 2 / span 1;
			display: grid;
			grid-template-rows: auto 1fr;
		}
	}

	.info-section {
		grid-row: 2 / span 1;

		.details {
			display: grid;
			grid-template-columns: auto 1fr auto 1fr;
			grid-template-rows: repeat(4, auto 1px) auto 1fr;
			border: 1px solid black;
			background: white;
			align-items: center;
			column-gap: 0.5em;

			label {
				grid-column: 1 / span 1;
				margin-left: 0.25em;
				font-family: 'Roboto Condensed', sans-serif;
				text-transform: uppercase;
				font-weight: 600;
				font-size: 0.8em;
			}

			@include reset.input;
			input {
				grid-column: 2 / span 3;
				padding-left: 0.25em;
				font-family: 'Roboto', sans-serif;
			}

			.underline,
			.split-underline {
				grid-column: 1 / span all;
				width: 92%;
				height: 100%;
				background: black;
			}

			.split-underline {
				display: grid;
				grid-template-columns: auto auto;
				background: transparent;
				gap: 0 7%;

				& > span {
					grid-column: auto / span 1;
					background: black;
				}
			}

			.double-details {
				display: contents;

				& > label,
				& > input {
					grid-column: auto / span 1;
				}
			}
		}
	}
}
</style>
