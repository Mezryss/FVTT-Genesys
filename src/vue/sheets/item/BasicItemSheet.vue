<script lang="ts" setup>
import { computed, inject, onBeforeMount, onBeforeUpdate, ref, toRaw } from 'vue';

import { vLocalize } from '@/vue/directives';
import { ItemSheetContext, RootContext } from '@/vue/SheetContext';
import Localized from '@/vue/components/Localized.vue';
import Editor from '@/vue/components/Editor.vue';
import EffectsView from '@/vue/views/EffectsView.vue';

defineProps<{
	/**
	 * Whether the item has a decoration field to display.
	 */
	hasDecoration?: boolean;

	/**
	 * Whether to show or hide the ActiveEffects tab
	 */
	showEffectsTab?: boolean;
}>();

const context = inject<ItemSheetContext>(RootContext)!;
const system = computed(() => context.data.item.systemData);

// We have to:
//   1. Use an 'any' typing to skirt around TypeScript's complaints.
//   2. Keep a local ref that gets updated in onBeforeUpdate in order to work around some struggles with Foundry.
const effects = ref<any>([]);

async function addEffect(category: string) {
	await toRaw(context.sheet.item).createEmbeddedDocuments('ActiveEffect', [
		{
			label: context.data.item.name,
			icon: 'icons/svg/aura.svg',
			disabled: category === 'suppressed',
			duration: category === 'temporary' ? { rounds: 1 } : undefined,
		},
	]);
}

function updateEffects() {
	effects.value = [...toRaw(context.data.item).effects];
}

onBeforeMount(updateEffects);
onBeforeUpdate(updateEffects);
</script>

<template>
	<div class="item-sheet-basic">
		<header :class="hasDecoration ? 'with-decoration' : ''">
			<img :src="context.data.item.img" data-edit="img" :title="context.data.item.name" :alt="context.data.item.name" />
			<input type="text" name="name" :value="context.data.item.name" v-localize:placeholder="'Genesys.Labels.Name'" />
			<!-- Decoration -->
			<slot v-if="hasDecoration" name="decoration"></slot>
		</header>

		<nav class="sheet-tabs" data-group="primary">
			<div class="spacer"></div>

			<slot name="tabs">
				<a class="item" data-tab="description">
					<Localized label="Genesys.Tabs.Description" />
				</a>

				<a class="item" data-tab="data">
					<Localized label="Genesys.Tabs.Data" />
				</a>

				<a v-if="showEffectsTab" class="item" data-tab="effects">
					<Localized label="Genesys.Tabs.Effects" />
				</a>
			</slot>

			<div class="spacer"></div>
		</nav>

		<section class="sheet-body">
			<div class="tab" data-group="primary" data-tab="description">
				<slot name="description">
					<Editor name="system.description" :content="system.description" button />
				</slot>
			</div>

			<div class="tab" data-group="primary" data-tab="data">
				<slot name="data"> DATA </slot>
			</div>

			<div v-if="showEffectsTab" class="tab" data-group="primary" data-tab="effects">
				<EffectsView :effects="[...effects]" @add-effect="addEffect" />
			</div>
		</section>
	</div>
</template>

<style lang="scss">
@use '@scss/mixins/reset.scss';
@use '@scss/vars/colors.scss';
@use '@scss/vars/sheet.scss';

.item-sheet-basic {
	width: calc(100% + #{sheet.$padding * 2});
	height: calc(100% + #{sheet.$padding * 2});

	display: grid;
	grid-template-rows: /* Header & Tabs */ repeat(2, auto) /* Tab Content */ 1fr;

	margin: -1 * sheet.$padding;

	.editor-content {
		font-family: 'Roboto Serif', serif;
		text-align: justify;
	}

	header {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem;
		align-items: center;

		padding: sheet.$padding;

		// Header Decoration
		&.with-decoration {
			grid-template-columns: auto 1fr auto;
		}

		// Item Image
		img {
			border: 1px solid colors.$gold;
			background: transparentize(colors.$gold, 0.5);
			border-radius: 1em;
			height: 2.5rem;
		}

		// Name Input
		@include reset.input;
		input {
			width: 100%;
			font-family: 'Bebas Neue', sans-serif;
			font-size: 2rem;
			color: colors.$blue;

			&,
			&:focus {
				border-bottom: 1px solid colors.$dark-blue;
			}

			&:focus {
				font-family: 'Modesto Condensed', sans-serif;
			}
		}
	}

	nav.sheet-tabs {
		margin-left: 0;
		width: 100%;
	}

	.tab {
		padding-left: sheet.$padding;
		padding-right: sheet.$padding;
	}

	section.data-grid {
		display: flex;
		flex-direction: column;

		.row {
			display: grid;
			grid-template-columns: minmax(min-content, 30%) 1fr;
			align-items: center;
			border-bottom: 1px dashed black;
			padding: 0.25em;
			row-gap: 0.1em;

			input:not([type='checkbox']),
			select {
				width: 100%;
			}

			input[type='checkbox'] {
				justify-self: right;
			}

			& > * {
				grid-column: 2 / span 1;
			}

			& > label {
				grid-column: 1 / span 1;
			}
		}
	}
}
</style>
