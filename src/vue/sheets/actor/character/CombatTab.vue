<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import GenesysItem from '@/item/GenesysItem';
import Localized from '@/vue/components/Localized.vue';
import WeaponDataModel from '@/item/data/WeaponDataModel';
import ArmorDataModel from '@/item/data/ArmorDataModel';
import Enriched from '@/vue/components/Enriched.vue';
import InjuryDataModel from '@/item/data/InjuryDataModel';

const rootContext = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;

const weapons = computed(() => toRaw(rootContext.data.actor).items.filter((i) => i.type === 'weapon' && i.system.state === 'equipped') as GenesysItem<WeaponDataModel>[]);
const armors = computed(() => toRaw(rootContext.data.actor).items.filter((i) => i.type === 'armor' && i.system.state === 'equipped') as GenesysItem<ArmorDataModel>[]);
const injuries = computed(() => toRaw(rootContext.data.actor).items.filter((i) => i.type === 'injury') as GenesysItem<InjuryDataModel>[]);

async function editInjury(item: GenesysItem) {
	await item.sheet?.render(true);
}

async function deleteInjury(item: GenesysItem) {
	await item.delete();
}
</script>

<template>
	<section class="tab-combat">
		<div class="block">
			<div class="header"><Localized label="Genesys.Labels.Attacks" /></div>
			<div class="weapons">
				<div class="weapon header">
					<div class="name"><Localized label="Genesys.Labels.Name" /></div>
					<div class="skill"><Localized label="Genesys.Labels.Skill" /></div>
					<div class="damage"><Localized label="Genesys.Labels.Damage" /></div>
					<div class="crit"><Localized label="Genesys.Labels.Crit" /></div>
					<div class="range"><Localized label="Genesys.Labels.Range" /></div>
					<div class="special"><Localized label="Genesys.Labels.Special" /></div>
				</div>

				<div v-for="weapon in weapons" :key="weapon.id" class="weapon">
					<img :src="weapon.img" :alt="weapon.name" />
					<div class="name">
						<a>{{ weapon.name }}</a>
					</div>
					<div class="skill">-Skill-</div>
					<div class="damage">-Damage-</div>
					<div class="crit">{{ weapon.systemData.critical }}</div>
					<div class="range"><Localized :label="`Genesys.Range.${weapon.systemData.range.capitalize()}`" /></div>
					<div class="special">-Special-</div>
					<div class="description"><Enriched :value="weapon.systemData.description" /></div>
				</div>
			</div>
		</div>

		<div class="block">
			<div class="header"><Localized label="Genesys.Labels.Armor" /></div>
			<div class="armors">
				<div class="armor header">
					<div class="name"><Localized label="Genesys.Labels.Name" /></div>
					<div class="soak"><Localized label="Genesys.Labels.Soak" /></div>
					<div class="defense"><Localized label="Genesys.Labels.Defense" /></div>
				</div>

				<div v-for="armor in armors" :key="armor.id" class="armor">
					<img :src="armor.img" :alt="armor.name" />
					<div class="name">
						<a>{{ armor.name }}</a>
					</div>
					<div class="soak">{{ armor.systemData.soak }}</div>
					<div class="defense">{{ armor.systemData.defense }}</div>
					<div class="description"><Enriched :value="armor.systemData.description" /></div>
				</div>
			</div>
		</div>

		<div class="block">
			<div class="header"><Localized label="Genesys.Labels.CriticalInjuries" /></div>
			<div class="critical-injuries">
				<div class="injury header">
					<div><Localized label="Genesys.Labels.Severity" /></div>
					<div><Localized label="Genesys.Labels.Injury" /></div>
				</div>

				<div v-for="injury in injuries" :key="injury.id" class="injury">
					<div class="severity">
						<a>
							<template v-if="injury.systemData.severity === 'easy'">D</template>
							<template v-if="injury.systemData.severity === 'average'">DD</template>
							<template v-if="injury.systemData.severity === 'hard'">DDD</template>
							<template v-if="injury.systemData.severity === 'daunting'">DDDD</template>
						</a>
					</div>
					<div class="name">
						<a>{{ injury.name }}</a>
					</div>
					<div v-if="rootContext.data.editable" class="actions">
						<a @click="editInjury(injury)"><i class="fas fa-edit"></i></a>
						<a @click="deleteInjury(injury)"><i class="fas fa-trash"></i></a>
					</div>
					<div v-else />
					<div class="description"><Enriched :value="injury.systemData.description" /></div>
				</div>
			</div>
		</div>
	</section>
</template>

<style lang="scss">
@use '@scss/vars/colors.scss';

.tab-combat {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	gap: 0.5em;
	padding: 0.5em;

	.armor,
	.weapon {
		display: grid;
		grid-template-rows: auto auto;
		border-bottom: 1px dashed colors.$blue;
		align-items: center;
		justify-items: center;
		column-gap: 0.25em;

		& > .header {
			grid-template-rows: auto;
		}

		.name {
			justify-self: left;
		}

		&:not(.header) > .name {
			font-family: 'Roboto Serif', serif;
		}

		&.header > .name {
			grid-column: 1 / span 2;
		}

		&:last-child {
			border-bottom: none;
		}

		.description {
			grid-column: 1 / span all;
			justify-self: left;
			border-left: 4px solid colors.$light-blue;
			margin-left: 0.5em;
			padding-left: 0.5em;

			grid-row: 2 / span 1;
			max-height: 0;
			transition: max-height 0.5s ease-in-out;
			overflow: hidden;
			padding-right: 0.5em;

			&.active {
				max-height: 200px;
			}
		}
	}

	.armor {
		grid-template-columns: 1.5rem 1fr repeat(2, 60px);
	}

	.weapon {
		grid-template-columns: 1.5rem 1fr repeat(5, 80px);
	}

	.block {
		background: transparentize(colors.$light-blue, 0.8);
		padding: 0.5em;
		border-radius: 0.5em;

		.header {
			font-family: 'Bebas Neue', sans-serif;
		}

		& > .header {
			font-size: 1.25em;
		}

		img {
			border: none;
			padding: 2px;
			border-radius: 0.25rem;
		}

		.critical-injuries {
			display: flex;
			flex-direction: column;
			flex-wrap: nowrap;
			padding: 0.25em;

			.severity {
				font-family: 'Genesys Symbols', sans-serif;
				font-size: 1.25em;
				color: colors.$die-difficulty;
				-webkit-text-stroke: 1px black;
				text-stroke: 1px black;
				letter-spacing: -2px;
				position: relative;
				top: 0.25em;
			}

			.injury {
				display: grid;
				grid-template-columns: /* Severity */ 70px /* Name */ 1fr /* Actions */ auto;
				grid-template-rows: auto auto;
				align-items: center;
				border-bottom: 1px dashed colors.$blue;
				column-gap: 0.5em;

				.name {
					font-family: 'Roboto Serif', serif;
				}

				&:last-child {
					border-bottom: none;
				}

				.description {
					grid-column: 1 / span all;
					justify-self: left;
					border-left: 4px solid colors.$light-blue;
					margin-left: 1em;
					padding-left: 0.5em;

					grid-row: 2 / span 1;
					max-height: 0;
					transition: max-height 0.5s ease-in-out;
					overflow: hidden;
					padding-right: 0.5em;

					&.active {
						max-height: 200px;
					}
				}
			}
		}
	}

	.actions {
		display: flex;
		gap: 0.25em;
	}
}
</style>
