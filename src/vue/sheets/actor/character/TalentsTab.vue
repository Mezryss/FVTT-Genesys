<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import Localized from '@/vue/components/Localized.vue';
import TalentDataModel from '@/item/data/TalentDataModel';
import GenesysItem from '@/item/GenesysItem';
import Talent from '@/vue/components/character/Talent.vue';
import AbilityDataModel from '@/item/data/AbilityDataModel';
import { EntryType } from '@/actor/data/character/ExperienceJournal';

const context = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;

const system = computed(() => context.data.actor.systemData);

const activeAbilities = computed(() => toRaw(context.data.actor).items.filter((i) => i.type === 'ability' && (i.system as AbilityDataModel).activation.type === 'active') as GenesysItem<AbilityDataModel>[]);
const activeAbilityTypes = computed(() => Array.from(new Set(activeAbilities.value.map((t) => t.systemData.activation.detail.toLowerCase()))));
const passiveAbilities = computed(() => toRaw(context.data.actor).items.filter((i) => i.type === 'ability' && (i.system as AbilityDataModel).activation.type === 'passive') as GenesysItem<AbilityDataModel>[]);

const allTalents = computed(() => toRaw(context.data.actor).items.filter((i) => i.type === 'talent') as GenesysItem<TalentDataModel>[]);
const activeTalents = computed(() => allTalents.value.filter((i) => i.systemData.activation.type === 'active'));
const activeTalentTypes = computed(() => Array.from(new Set(activeTalents.value.filter((t) => t.systemData.activation.detail.trim() !== '').map((t) => t.systemData.activation.detail.toLowerCase()))));
const passiveTalents = computed(() => allTalents.value.filter((i) => i.systemData.activation.type === 'passive'));

function atTier(tier: number) {
	const baseTier = allTalents.value.filter((t) => t.systemData.tier === tier).length;
	const ranked = allTalents.value.filter(
		(t) =>
			// Lower Tier
			t.systemData.tier < tier &&
			// Rank purchased at this tier
			t.systemData.tier + (t.systemData.rank - 1) >= tier,
	);

	const rankedTier5 = (tier === 5 && ranked.reduce((total, t) => total + Math.max(0, t.systemData.tier + t.systemData.rank - 6), 0)) || 0;

	return baseTier + ranked.length + rankedTier5;
}

const tier1Talents = computed(() => atTier(1));
const tier2Talents = computed(() => atTier(2));
const tier3Talents = computed(() => atTier(3));
const tier4Talents = computed(() => atTier(4));
const tier5Talents = computed(() => atTier(5));
const canUpgradeTalent = computed(() => [
	system.value.availableXP > 10 && atTier(1) > atTier(2) + 1,
	system.value.availableXP > 15 && atTier(2) > atTier(3) + 1,
	system.value.availableXP > 20 && atTier(3) > atTier(4) + 1,
	system.value.availableXP > 25 && atTier(4) > atTier(5) + 1,
]);

async function upgradeTalent(talent: GenesysItem<TalentDataModel>) {
	if (talent.systemData.ranked === 'no') {
		ui.notifications.info(game.i18n.format('Genesys.Notifications.TalentNotRanked', { talentName: talent.name }));
		return false;
	}

	const newEffectiveTier = Math.min(5, talent.systemData.tier + talent.systemData.rank);
	const cost = talent.systemData.advanceCost;

	await toRaw(talent).update({
		'system.rank': talent.systemData.rank + 1,
	});

	await toRaw(context.data.actor).update({
		'system.experienceJournal.entries': [
			...system.value.experienceJournal.entries,
			{
				amount: -cost,
				type: EntryType.TalentRank,
				data: {
					name: talent.name,
					id: talent.id,
					tier: newEffectiveTier,
					rank: talent.systemData.rank,
				},
			},
		],
	});
}

async function openItem(item: GenesysItem) {
	await toRaw(item).sheet?.render(true);
}
</script>

<template>
	<section class="tab-talents">
		<div class="block">
			<div class="header"><Localized label="Genesys.Labels.SpecialAbilities" /></div>
			<div class="talents-container">
				<!-- Active Abilities -->
				<div v-if="activeAbilities.length > 0" class="category-header"><Localized label="Genesys.Labels.Active" /></div>
				<Talent
					v-for="ability in activeAbilities.filter((t) => t.systemData.activation.detail === '')"
					:key="ability.id"
					:name="ability.name"
					:img="ability.img"
					:description="ability.systemData.description"
					:source="ability.systemData.source"
					@open="openItem(ability)"
				/>

				<!-- Active Abilities w/Description -->
				<template v-for="activeType in activeAbilityTypes" :key="activeType">
					<div class="sub-category-header">{{ activeType }}</div>
					<Talent
						v-for="ability in activeAbilities.filter((t) => t.systemData.activation.detail.toLowerCase() === activeType)"
						:key="ability.id"
						:name="ability.name"
						:img="ability.img"
						:description="ability.systemData.description"
						:source="ability.systemData.source"
						@open="openItem(ability)"
					/>
				</template>

				<!-- Passive Abilities -->
				<div v-if="passiveAbilities.length > 0" class="category-header"><Localized label="Genesys.Labels.Passive" /></div>
				<Talent v-for="ability in passiveAbilities" :key="ability.id" :name="ability.name" :img="ability.img" :description="ability.systemData.description" :source="ability.systemData.source" @open="openItem(ability)" />
			</div>

			<div class="header"><Localized label="Genesys.Labels.Talents" /></div>
			<div class="talents-container">
				<!-- Active Talents -->
				<div v-if="activeTalents.length > 0" class="category-header"><Localized label="Genesys.Labels.Active" /></div>
				<Talent
					v-for="talent in activeTalents.filter((t) => t.systemData.activation.detail === '')"
					:key="talent.id"
					:name="talent.name"
					:img="talent.img"
					:description="talent.systemData.description"
					:source="talent.systemData.source"
					:can-upgrade="canUpgradeTalent[talent.systemData.effectiveTier - 1]"
					:ranked="talent.systemData.ranked === 'yes'"
					:rank="talent.systemData.rank"
					:tier="talent.systemData.tier"
					:effective-tier="talent.systemData.effectiveTier"
					@upgrade="upgradeTalent(talent)"
					@open="openItem(talent)"
				/>

				<!-- Active Talents w/Description -->
				<template v-for="activeType in activeTalentTypes" :key="activeType">
					<div class="sub-category-header">{{ activeType }}</div>
					<Talent
						v-for="talent in activeTalents.filter((t) => t.systemData.activation.detail.toLowerCase() === activeType)"
						:key="talent.id"
						:name="talent.name"
						:img="talent.img"
						:description="talent.systemData.description"
						:source="talent.systemData.source"
						:can-upgrade="canUpgradeTalent[talent.systemData.effectiveTier - 1]"
						:ranked="talent.systemData.ranked === 'yes'"
						:rank="talent.systemData.rank"
						:tier="talent.systemData.tier"
						:effective-tier="talent.systemData.effectiveTier"
						@upgrade="upgradeTalent(talent)"
						@open="openItem(talent)"
					/>
				</template>

				<!-- Passive Talents -->
				<div v-if="passiveTalents.length > 0" class="category-header"><Localized label="Genesys.Labels.Passive" /></div>
				<Talent
					v-for="talent in passiveTalents"
					:key="talent.id"
					:name="talent.name"
					:img="talent.img"
					:description="talent.systemData.description"
					:source="talent.systemData.source"
					:can-upgrade="canUpgradeTalent[talent.systemData.effectiveTier - 1]"
					:ranked="talent.systemData.ranked === 'yes'"
					:rank="talent.systemData.rank"
					:tier="talent.systemData.tier"
					:effective-tier="talent.systemData.effectiveTier"
					@upgrade="upgradeTalent(talent)"
					@open="openItem(talent)"
				/>
			</div>
		</div>

		<div class="pyramid">
			<div><Localized label="Genesys.Labels.TierCount" :format-args="{ tier: 1 }" />: {{ tier1Talents }}/∞</div>
			<div><Localized label="Genesys.Labels.TierCount" :format-args="{ tier: 2 }" />: {{ tier2Talents }}/{{ Math.max(0, tier1Talents - 1) }}</div>
			<div><Localized label="Genesys.Labels.TierCount" :format-args="{ tier: 3 }" />: {{ tier3Talents }}/{{ Math.max(0, tier2Talents - 1) }}</div>
			<div><Localized label="Genesys.Labels.TierCount" :format-args="{ tier: 4 }" />: {{ tier4Talents }}/{{ Math.max(0, tier3Talents - 1) }}</div>
			<div><Localized label="Genesys.Labels.TierCount" :format-args="{ tier: 5 }" />: {{ tier5Talents }}/{{ Math.max(0, tier4Talents - 1) }}</div>
		</div>
	</section>
</template>

<style lang="scss" scoped>
@use '@scss/vars/colors.scss';

.tab-talents {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	padding: 0.5em;

	.block {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		background: transparentize(colors.$light-blue, 0.8);
		border-top-left-radius: 1em;
		border-top-right-radius: 1em;
		padding: 0.5em;
		gap: 0.25em;

		.header {
			font-family: 'Bebas Neue', sans-serif;
			font-size: 1.25em;
			margin-top: 0.5em;
			margin-bottom: -0.4em;

			&:first-of-type {
				margin-top: 0;
			}
		}
	}

	.talents-container {
		border: 1px solid colors.$blue;
		border-top: none;

		.category-header,
		.sub-category-header {
			font-family: 'Bebas Neue', sans-serif;
			color: white;
			padding-left: 0.25em;
			padding-top: 1px;
		}

		.category-header {
			background: colors.$blue;
			font-size: 1.1em;
		}

		.sub-category-header {
			border-top: 1px solid colors.$blue;
			background: transparentize(colors.$blue, 0.5);
			font-size: 1em;
		}

		&:empty {
			border: 1px dashed black;
			opacity: 0.25;
			height: 1em;
		}
	}

	.pyramid {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.5em;
		align-items: center;
		justify-content: right;
		border-bottom-left-radius: 1em;
		border-bottom-right-radius: 1em;
		background: transparentize(colors.$light-blue, 0.8);
		font-family: 'Bebas Neue', sans-serif;
		padding-right: 1em;
		padding-bottom: 0.25em;
	}
}
</style>
