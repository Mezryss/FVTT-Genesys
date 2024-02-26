<script lang="ts" setup>
import { computed, inject, ref } from 'vue';

import { CareerSkillPromptContext } from '@/app/CareerSkillPrompt';
import { RootContext } from '@/vue/SheetContext';
import Localized from '@/vue/components/Localized.vue';
import SkillDataModel from '@/item/data/SkillDataModel';
import GenesysItem from '@/item/GenesysItem';

const context = inject<CareerSkillPromptContext>(RootContext)!;

const selectedSkillIDs = ref<string[]>([]);
const remaining = computed(() => CONFIG.genesys.settings.freeCareerSkillRanks - selectedSkillIDs.value.length);

function selectSkill(event: Event, skill: GenesysItem<SkillDataModel>) {
	event.preventDefault();

	const existingIndex = selectedSkillIDs.value.findIndex((id) => id === skill.id);
	if (existingIndex >= 0) {
		selectedSkillIDs.value.splice(existingIndex, 1);
	} else if (remaining.value > 0) {
		selectedSkillIDs.value.push(skill.id);
	}
}

function confirm(event: Event) {
	event.preventDefault();

	context.resolvePromise(selectedSkillIDs.value);
}
</script>

<template>
	<div class="genesys career-skill-prompt">
		<div class="career-skills-hint"><Localized label="Genesys.CareerSkillPrompt.Hint" /></div>

		<div class="selections">
			<button v-for="skill in context.skills" :key="skill.id" :class="`select-skill ${selectedSkillIDs.includes(skill.id) ? 'selected' : ''}`" @click="(ev) => selectSkill(ev, skill)">
				<i v-if="selectedSkillIDs.includes(skill.id)" class="fas fa-check-circle" />
				<img :src="skill.img" :alt="skill.name" />
				<span>{{ skill.name }} (<Localized :label="`Genesys.CharacteristicAbbr.${skill.systemData.characteristic.capitalize()}`" />)</span>
			</button>
		</div>

		<div class="remaining"><Localized label="Genesys.CareerSkillPrompt.RemainingChoices" />: {{ remaining }}</div>

		<footer>
			<button @click="confirm" :disabled="remaining > 0"><Localized label="Genesys.CareerSkillPrompt.Confirm" /></button>
		</footer>
	</div>
</template>

<style lang="scss">
@use '@scss/mixins/backgrounds.scss';
@use '@scss/vars/colors.scss';
@use '@scss/vars/sheet.scss';

.app-career-skill-prompt {
	min-width: 150px;
	min-height: 200px;

	.window-content {
		@include backgrounds.crossboxes();
	}
}

.career-skill-prompt {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	gap: 0.5em;
	font-family: 'Roboto Serif', serif;

	button {
		font-family: 'Roboto Serif', serif;
	}

	.career-skills-hint {
		font-size: 0.9em;
		color: #333;
	}

	.selections {
		.select-skill {
			display: grid;
			grid-template-columns: /* Selected Checkbox */ 1rem /* Icon */ 1.5rem /* Name */ 1fr;
			gap: 0.5em;
			padding: 0.25em 0.25em 0.25em 0.5em;
			align-items: center;
			justify-items: left;
			background: colors.$blue;
			border: 1px solid colors.$light-blue;
			color: white;
			border-radius: 0.5em;

			&.selected {
				background: colors.$light-blue;
				border: 1px solid colors.$blue;
				color: colors.$dark-blue;
			}

			i {
				grid-column: 1 / span 1;
			}
			img {
				grid-column: 2 / span 1;
				border: none;
				border-radius: 0.25em;
			}
			span {
				grid-column: 3 / span 1;
			}
		}
	}
}
</style>
