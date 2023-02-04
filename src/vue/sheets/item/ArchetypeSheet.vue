<script lang="ts" setup>
import { computed, inject } from 'vue';

import { ItemSheetContext, RootContext } from '@/vue/SheetContext';
import BasicItemSheet from '@/vue/sheets/item/BasicItemSheet.vue';
import Localized from '@/vue/components/Localized.vue';
import ArchetypeDataModel from '@/item/data/ArchetypeDataModel';
import GenesysItem from '@/item/GenesysItem';
import AbilityDataModel from '@/item/data/AbilityDataModel';
import Editor from '@/vue/components/Editor.vue';
import Enriched from '@/vue/components/Enriched.vue';
import Characteristic from '@/vue/components/character/Characteristic.vue';

const context = inject<ItemSheetContext<ArchetypeDataModel>>(RootContext)!;

const system = computed(() => context.data.item.systemData);

const abilitiesHeaderWords = game.i18n.localize('Genesys.Archetype.Abilities').split(' ');

const specialAbilities = computed(() => system.value.grantedItems.filter((i) => i.type === 'ability') as GenesysItem<AbilityDataModel>[]);

async function deleteGrantedItem(index: number) {
	const updatedItems = [...system.value.grantedItems];
	updatedItems.splice(index, 1);

	await context.data.item.update({
		'system.grantedItems': updatedItems,
	});
}
</script>

<template>
	<BasicItemSheet show-effects-tab>
		<template v-slot:description>
			<section class="overview">
				<section class="description">
					<Editor name="system.description" :content="system.description" button />
				</section>

				<section class="stats">
					<div class="header">
						<div v-for="word in abilitiesHeaderWords" :key="word">{{ word }}</div>
					</div>

					<div class="characteristics-container">
						<div class="characteristics-row">
							<Characteristic label="Genesys.Characteristics.Brawn" :value="system.characteristics.brawn" />
							<Characteristic label="Genesys.Characteristics.Agility" :value="system.characteristics.agility" />
							<Characteristic label="Genesys.Characteristics.Intellect" :value="system.characteristics.intellect" />
							<Characteristic label="Genesys.Characteristics.Cunning" :value="system.characteristics.cunning" />
							<Characteristic label="Genesys.Characteristics.Willpower" :value="system.characteristics.willpower" />
							<Characteristic label="Genesys.Characteristics.Presence" :value="system.characteristics.presence" />
						</div>
					</div>

					<ul>
						<li>
							<strong><Localized label="Genesys.Archetype.StartingWounds" />:</strong> {{ system.woundThreshold }} + <Localized label="Genesys.Characteristics.Brawn" />
						</li>
						<li>
							<strong><Localized label="Genesys.Archetype.StartingStrain" />:</strong> {{ system.strainThreshold }} + <Localized label="Genesys.Characteristics.Willpower" />
						</li>
						<li>
							<strong><Localized label="Genesys.Archetype.StartingXP" />:</strong> {{ system.startingXP }}
						</li>
						<li v-for="ability in specialAbilities" :key="ability.name">
							<div class="granted-ability">
								<img :src="ability.img" :alt="ability.name" />
								<strong>{{ ability.name }}</strong>
								<Enriched :value="ability.system.description" />
							</div>
						</li>
					</ul>
				</section>
			</section>
		</template>

		<template v-slot:data>
			<section class="data-grid">
				<div class="row">
					<label><Localized label="Genesys.Characteristics.Brawn" /></label>
					<input type="number" name="system.characteristics.brawn" :value="system.characteristics.brawn" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Characteristics.Agility" /></label>
					<input type="number" name="system.characteristics.agility" :value="system.characteristics.agility" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Characteristics.Intellect" /></label>
					<input type="number" name="system.characteristics.intellect" :value="system.characteristics.intellect" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Characteristics.Cunning" /></label>
					<input type="number" name="system.characteristics.cunning" :value="system.characteristics.cunning" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Characteristics.Willpower" /></label>
					<input type="number" name="system.characteristics.willpower" :value="system.characteristics.willpower" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Characteristics.Presence" /></label>
					<input type="number" name="system.characteristics.presence" :value="system.characteristics.presence" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Archetype.StartingWounds" /></label>
					<input type="number" name="system.woundThreshold" :value="system.woundThreshold" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Archetype.StartingStrain" /></label>
					<input type="number" name="system.strainThreshold" :value="system.strainThreshold" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Archetype.StartingXP" /></label>
					<input type="number" name="system.startingXP" :value="system.startingXP" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Source" /></label>
					<input type="text" name="system.source" :value="system.source" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Archetype.GrantedItems" /></label>
					<div v-for="(item, index) in system.grantedItems" :key="item.name" class="data">
						<img :src="item.img" :alt="item.name" />
						<span class="name">{{ item.name }}</span>
						<div v-if="context.data.editable">
							<a @click="deleteGrantedItem(index)"><i class="fas fa-trash"></i></a>
						</div>
					</div>
				</div>
			</section>
		</template>
	</BasicItemSheet>
</template>

<style lang="scss" scoped>
@use '@scss/vars/colors.scss';

.data {
	display: grid;
	grid-template-columns: auto auto 1fr auto;
	align-items: center;
	gap: 0.25em;
	padding: 0.25em;

	&:nth-of-type(2n) {
		background: transparentize(colors.$blue, 0.8);
	}

	img {
		grid-column: 1 / span 1;
		border: none;
		height: 1.5em;
	}

	& > .name {
		grid-column: 2 / span 1;
		font-family: 'Roboto Serif', serif;
	}

	& > div {
		grid-column: 4 / span 1;
	}
}

section.overview {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	font-family: 'Roboto Slab', serif;

	.description {
		min-height: 150px;
	}

	.header {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.25em;
		font-family: 'Bebas Neue', sans-serif;
		font-size: 1.75em;
		color: colors.$blue;

		& > div:first-letter {
			font-size: 1.25em;
		}
	}

	li {
		display: flex;
		align-items: center;
		position: relative;
		gap: 0.25em;

		&::before {
			display: block;
			content: '';
			position: absolute;
			$size: 4px;
			top: calc(1em - $size);
			left: -1em;
			height: $size;
			width: $size;
			background: colors.$gold;
		}
	}

	.granted-ability {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: auto auto;
		column-gap: 0.25em;

		img {
			border: none;
			height: 1.5em;
			grid-column: 1 / span 1;
			grid-row: 1 / span 1;
		}

		strong {
			grid-column: 2 / span 1;
			grid-row: 1 / span 1;
		}

		div {
			grid-column: 1 / span all;
			grid-row: 2 / span 1;
		}
	}
}

// Container for the character's primary characteristics (brawn, agility, etc).
.characteristics-container {
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	margin-left: 2em;
	margin-right: 2em;

	.characteristics-row {
		position: relative;
		display: flex;
		flex-wrap: nowrap;
		justify-content: center;
		gap: 3em;
		align-items: center;
		padding-bottom: 0.25rem;
		grid-column: 2 / span 1;

		&::after {
			display: block;
			content: '';
			position: absolute;
			top: 0;
			left: -1.5rem;
			width: calc(100% + 3rem);
			height: 100%;
			background: colors.$gold;
			border-radius: 4rem;

			clip-path: polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%);
		}

		.characteristic-field {
			z-index: 1;
		}
	}
}
</style>
