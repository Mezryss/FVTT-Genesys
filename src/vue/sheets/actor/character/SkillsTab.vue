<script lang="ts" setup>
/**
 * TODO: Just redo this whole mess. The entire reason I wanted to move away from HBS in the first place is that it was getting kinda nasty.
 */

import { computed, inject, toRaw } from 'vue';

import CharacterDataModel from '@/actor/data/CharacterDataModel';
import { EntryType as JournalEntryType } from '@/actor/data/character/ExperienceJournal';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import Characteristic from '@/vue/components/character/Characteristic.vue';
import SkillDataModel from '@/item/data/SkillDataModel';
import Localized from '@/vue/components/Localized.vue';
import GenesysItem from '@/item/GenesysItem';
import SkillRanks from '@/vue/components/character/SkillRanks.vue';
import XPContainer from '@/vue/components/character/XPContainer.vue';
import DicePrompt from '@/app/DicePrompt';
import ContextMenu from '@/vue/components/ContextMenu.vue';
import MenuItem from '@/vue/components/MenuItem.vue';
import MasonryWall from '@yeger/vue-masonry-wall';
import { Characteristic as CharacteristicType } from '@/data/Characteristics';
import { CombatPool } from '@/data/Actors';

const context = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;
const system = computed(() => context.data.actor.systemData);

const SKILL_CATEGORY_SORT_ORDER = {
	general: 0,
	magic: 1,
	combat: 2,
	social: 3,
	knowledge: 4,
};

const skills = computed(() => toRaw(context.data.actor).items.filter((i) => i.type === 'skill') as GenesysItem<SkillDataModel>[]);

const skillCategories = computed(() => Array.from(new Set(skills.value.map((s) => s.systemData.category).sort((left, right) => SKILL_CATEGORY_SORT_ORDER[left] - SKILL_CATEGORY_SORT_ORDER[right]))));

const markCareerLabel = game.i18n.localize('Genesys.Labels.MarkCareerSkill');
const unmarkCareerLabel = game.i18n.localize('Genesys.Labels.UnmarkCareerSkill');
const freeRankUpLabel = game.i18n.localize('Genesys.Labels.FreeRankUp');
const freeRankDownLabel = game.i18n.localize('Genesys.Labels.FreeRankDown');
const editLabel = game.i18n.localize('Genesys.Labels.Edit');
const deleteLabel = game.i18n.localize('Genesys.Labels.Delete');

async function rollSkill(skill: GenesysItem<SkillDataModel>) {
	await DicePrompt.promptForRoll(toRaw(context.data.actor), skill.id);
}

async function rollUnskilled(characteristic: CharacteristicType) {
	await DicePrompt.promptForRoll(toRaw(context.data.actor), '-', { rollUnskilled: characteristic });
}

async function purchaseCharacteristic(characteristic: keyof typeof system.value.characteristics) {
	if (!system.value.canPurchaseCharacteristicAdvance[characteristic]) {
		return;
	}

	const currentValue = system.value.characteristics[characteristic];

	// This is only available during character creation XP spends, so we want to increase WT & ST.
	const woundThreshold = (system.value._source.wounds as CombatPool).max + (characteristic === 'brawn' ? 1 : 0);
	const strainThreshold = (system.value._source.strain as CombatPool).max + (characteristic === 'willpower' ? 1 : 0);

	await toRaw(context.data.actor).update({
		// Increase Characteristic, WT, and ST
		[`system.characteristics.${characteristic}`]: currentValue + 1,
		'system.wounds.max': woundThreshold,
		'system.strain.max': strainThreshold,
		// XP Journal Entry
		'system.experienceJournal.entries': [
			...system.value.experienceJournal.entries,
			{
				amount: -((currentValue + 1) * 10),
				type: JournalEntryType.Characteristic,
				data: {
					characteristic,
					rank: currentValue + 1,
				},
			},
		],
	});
}

async function purchaseSkillRank(skill: GenesysItem<SkillDataModel>) {
	const cost = 5 * (skill.systemData.rank + 1) + (skill.systemData.career ? 0 : 5);
	if (skill.systemData.rank >= 5 || system.value.availableXP < cost) {
		return;
	}

	await toRaw(skill).update({
		'system.rank': skill.systemData.rank + 1,
	});

	await toRaw(context.data.actor).update({
		'system.experienceJournal.entries': [
			...system.value.experienceJournal.entries,
			{
				amount: -cost,
				type: JournalEntryType.Skill,
				data: {
					name: skill.name,
					id: skill.id,
					rank: skill.systemData.rank,
				},
			},
		],
	});
}

async function toggleCareerSkill(skill: GenesysItem<SkillDataModel>) {
	await toRaw(skill).update({
		'system.career': !skill.systemData.career,
	});
}

async function freeSkillRank(skill: GenesysItem<SkillDataModel>, adjustment: number) {
	await toRaw(skill).update({
		'system.rank': Math.max(0, skill.systemData.rank + adjustment),
	});
}

async function editSkill(skill: GenesysItem<SkillDataModel>) {
	await toRaw(skill).sheet?.render(true);
}
async function deleteSkill(skill: GenesysItem<SkillDataModel>) {
	await toRaw(skill).delete();
}
</script>

<template>
	<section class="tab-skills">
		<div class="characteristics-row">
			<Characteristic label="Genesys.Characteristics.Brawn" :value="system.characteristics.brawn"
                :can-upgrade="system.canPurchaseCharacteristicAdvance.brawn" @upgrade="purchaseCharacteristic('brawn')"
                can-roll-unskilled @rollUnskilled="rollUnskilled(CharacteristicType.Brawn)" />

			<Characteristic label="Genesys.Characteristics.Agility" :value="system.characteristics.agility"
                :can-upgrade="system.canPurchaseCharacteristicAdvance.agility" @upgrade="purchaseCharacteristic('agility')"
                can-roll-unskilled @rollUnskilled="rollUnskilled(CharacteristicType.Agility)" />

			<Characteristic label="Genesys.Characteristics.Intellect" :value="system.characteristics.intellect"
                :can-upgrade="system.canPurchaseCharacteristicAdvance.intellect" @upgrade="purchaseCharacteristic('intellect')"
                can-roll-unskilled @rollUnskilled="rollUnskilled(CharacteristicType.Intellect)" />

			<Characteristic label="Genesys.Characteristics.Cunning" :value="system.characteristics.cunning"
                :can-upgrade="system.canPurchaseCharacteristicAdvance.cunning" @upgrade="purchaseCharacteristic('cunning')"
                can-roll-unskilled @rollUnskilled="rollUnskilled(CharacteristicType.Cunning)" />

			<Characteristic label="Genesys.Characteristics.Willpower" :value="system.characteristics.willpower"
                :can-upgrade="system.canPurchaseCharacteristicAdvance.willpower" @upgrade="purchaseCharacteristic('willpower')"
                can-roll-unskilled @rollUnskilled="rollUnskilled(CharacteristicType.Willpower)" />

			<Characteristic label="Genesys.Characteristics.Presence" :value="system.characteristics.presence"
                :can-upgrade="system.canPurchaseCharacteristicAdvance.presence" @upgrade="purchaseCharacteristic('presence')"
                can-roll-unskilled @rollUnskilled="rollUnskilled(CharacteristicType.Presence)" />
		</div>

		<div class="skills-row">
			<MasonryWall :column-width="300" :items="skillCategories" :gap="8">
				<template #default="{ item: skillCategory, index }">
					<div class="skill-category" :style="`position: relative; z-index: ${skillCategories.length - index}`">
						<div class="header">
							<label><Localized :label="`Genesys.Labels.${skillCategory.capitalize()}Skills`" /></label>
							<div class="blank" />

							<label style="position: relative; left: -3px"><Localized label="Genesys.Labels.Rank" /></label>
							<div class="blank" />
						</div>

						<div class="body">
							<ContextMenu
								v-for="skill in skills.filter(s => s.systemData.category === skillCategory).sort((l: GenesysItem, r: GenesysItem) => (l.name < r.name) ? -1 : (l.name > r.name) ? 1 : 0)"
								:key="skill.id"
								class="skill row"
							>
								<template v-slot:menu-items>
									<MenuItem @click="toggleCareerSkill(skill)" v-if="context.data.editable">
										<template v-slot:icon><i :class="`${skill.systemData.career ? 'fat' : 'fas'} fa-stars`"></i></template>
										{{ skill.systemData.career ? unmarkCareerLabel : markCareerLabel }}
									</MenuItem>

									<MenuItem @click="freeSkillRank(skill, 1)" v-if="context.data.editable">
										<template v-slot:icon><i class="fas fa-circle-up"></i></template>
										{{ freeRankUpLabel }}
									</MenuItem>

									<MenuItem @click="freeSkillRank(skill, -1)" v-if="context.data.editable">
										<template v-slot:icon><i class="fas fa-circle-down"></i></template>
										{{ freeRankDownLabel }}
									</MenuItem>

									<MenuItem @click="editSkill(skill)">
										<template v-slot:icon><i class="fas fa-edit"></i></template>
										{{ editLabel }}
									</MenuItem>

									<MenuItem @click="deleteSkill(skill)" v-if="context.data.editable">
										<template v-slot:icon><i class="fas fa-trash"></i></template>
										{{ deleteLabel }}
									</MenuItem>
								</template>

								<img :src="skill.img" :alt="skill.name" />
								<a class="name" @click="rollSkill(skill)">
									<span>{{ skill.name }} (<Localized :label="`Genesys.CharacteristicAbbr.${skill.system.characteristic.capitalize()}`" />)</span>
									<i v-if="skill.system.career" class="fas fa-stars"></i>
								</a>

								<span class="rank-display">
									{{ skill.system.rank }}

									<a
										v-if="
											(skill.systemData.rank < 5 && skill.systemData.career && system.availableXP >= 5 * (skill.systemData.rank + 1)) ||
											(!skill.systemData.career && system.availableXP >= 5 * (skill.systemData.rank + 1) + 5)
										"
										@click="purchaseSkillRank(skill)"
									>
										<i class="fas fa-arrow-circle-up" />
									</a>
								</span>

								<SkillRanks :skill-value="skill.systemData.rank" :characteristic-value="system.characteristics[skill.systemData.characteristic]" />
							</ContextMenu>
						</div>
					</div>
				</template>
			</MasonryWall>
		</div>

		<section class="experience">
			<XPContainer label="Genesys.Labels.TotalXP" :value="system.totalXP" />
			<XPContainer label="Genesys.Labels.AvailableXP" :value="system.availableXP" />
		</section>
	</section>
</template>

<style lang="scss" scoped>
@use '@scss/vars/colors.scss';

.tab-skills {
	display: grid;
	grid-template-rows: /* Characteristics */ auto /* Skills */ auto /* Experience */ auto /* Filler */ 1fr;
	grid-template-columns: 1fr auto 1fr;
	gap: 0.5em;

	.experience {
		grid-column: 1 / span all;
		padding: 0.5em;
	}

	.skills-row {
		grid-column: 1 / span all;
	}
}

.characteristics-row {
	position: relative;
	display: flex;
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

.skills-row {
	position: relative;
	z-index: 1;
	width: 100%;
	padding-left: 0.5em;
	padding-right: 0.5em;

	.skill-category {
		container: skill-category / inline-size;
		width: 100%;
		break-inside: avoid-column;
		white-space: nowrap;
		background: transparentize(colors.$light-blue, 0.8);
		padding: 8px;
	}

	.header,
	.body .row {
		width: 100%;
		display: grid;
		grid-template-columns: /* image */ 1.5rem /* name */ 1fr /* Rank Input */ auto /* Dice Preview */ 80px;
		align-items: center;
		gap: 0.25rem;
	}

	.header {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 1em;
		color: #6d6e71;
	}

	.body {
		border: 1px solid black;

		&:empty {
			border-style: dashed;
			opacity: 0.25;
			height: 1em;
		}
	}

	.row {
		border-bottom: 1px dashed black;

		& > * {
			padding: 0.2em;
		}

		img {
			border: none;
			padding: 0;
			margin-left: 0.1em;
		}

		.name {
			text-overflow: ellipsis;
			overflow: hidden;

			span {
				font-family: 'Roboto Slab', serif;
			}

			i {
				position: relative;
				top: -2px;
				left: 3px;
			}
		}

		&:last-of-type {
			border-bottom: none;
		}

		.rank-display {
			background: transparentize(white, 0.5);
			border: 1px dashed black;
			border-radius: 0.75rem;
			text-align: center;
			margin: 0.1em 0.1em 0.1em 0.2em;
			min-width: 1.5rem;
			height: 1.5rem;
		}
	}
}
</style>
