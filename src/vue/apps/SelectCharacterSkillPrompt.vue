<script lang="ts" setup>
import { inject, ref, toRaw } from 'vue';

import CharacterDataModel from '@/actor/data/CharacterDataModel';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';
import { SelectCharacterSkillPromptContext } from '@/app/SelectCharacterSkillPrompt';
import { RootContext } from '@/vue/SheetContext';

import Localized from '@/vue/components/Localized.vue';
import SkillRanks from '@/vue/components/character/SkillRanks.vue';

// The linter believes this is being unused (when in fact it isn't) so we prefix it so it's ignored.
type _NonVehicleDataModel = CharacterDataModel | AdversaryDataModel;

const context = inject<SelectCharacterSkillPromptContext>(RootContext)!;

const selectedOptionIndex = ref(-1);

function selectOption(characterSkill: number) {
	selectedOptionIndex.value = characterSkill;
}

function submitSelection(event: Event) {
	event.preventDefault();

	context.resolvePromise(toRaw(context.characterSkillOptions[selectedOptionIndex.value]));
}
</script>

<template>
	<div class="genesys select-character-skill-prompt">
		<div
			v-for="(characterSkillOption, index) in context.characterSkillOptions"
			:key="characterSkillOption.actor.id + characterSkillOption.skill.id"
			:class="{
				'char-skill-option': true,
				'selected-option': selectedOptionIndex === index,
			}"
			@click="selectOption(index)"
		>
			<img class="char-image" :src="characterSkillOption.actor.img" :alt="characterSkillOption.actor.name" draggable="false" />
			<div class="char-name">{{ characterSkillOption.actor.name }}</div>

			<div class="skill-name">{{ characterSkillOption.skill.name }}</div>
			<div class="skill-rank">{{ characterSkillOption.skill.systemData.rank }}</div>
			<SkillRanks
				:skill-value="characterSkillOption.skill.systemData.rank"
				:characteristic-value="(characterSkillOption.actor.systemData as _NonVehicleDataModel).characteristics[characterSkillOption.skill.systemData.characteristic]"
			/>
		</div>

		<button class="submit-button" @click="submitSelection" :disabled="selectedOptionIndex < 0"><Localized label="Genesys.Labels.Select" /></button>
	</div>
</template>

<style lang="scss">
@use '@scss/mixins/backgrounds.scss';

.app-select-character-skill-prompt {
	min-width: 28rem;
	min-height: 15rem;

	.window-content {
		@include backgrounds.crossboxes();
	}
}
</style>

<style lang="scss" scoped>
@use '@scss/vars/colors.scss';

.select-character-skill-prompt {
	.char-skill-option {
		display: grid;
		grid-template-columns: 2rem 1fr auto auto auto;
		gap: 0.3em;
		align-items: center;
		margin-bottom: 0.3rem;
		padding: 0.3em;
		background: transparentize(colors.$light-blue, 0.8);
		border-radius: 0.5em;

		&.selected-option {
			background: transparentize(colors.$light-blue, 0.5);
			transform: scale(1.01);
			transition: all 0.3s ease-out;
		}

		.char-name {
			font-family: 'Roboto Serif', serif;
			font-size: 1.15em;
		}

		.skill-name {
			font-family: 'Roboto', sans-serif;
		}

		.skill-rank {
			font-family: 'Roboto', sans-serif;
			background: transparentize(white, 0.5);
			border: 1px dashed black;
			border-radius: 0.75rem;
			text-align: center;
			margin: 0.1em;
			width: 1.5em;
			height: 1.5em;
			font-size: 1rem;
			line-height: 1.5em;
		}
	}

	.submit-button {
		float: right;
		margin-top: 1rem;
		width: 50%;
	}
}
</style>
