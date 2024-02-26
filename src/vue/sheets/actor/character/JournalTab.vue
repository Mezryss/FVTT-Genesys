<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';

import CharacterDataModel from '@/actor/data/CharacterDataModel';
import { EntryType as JournalEntryType, removeJournalEntry } from '@/actor/data/character/ExperienceJournal';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import Localized from '@/vue/components/Localized.vue';
import Editor from '@/vue/components/Editor.vue';
import AwardXPPrompt from '@/app/AwardXPPrompt';
import XPContainer from '@/vue/components/character/XPContainer.vue';

const context = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;

const system = computed(() => context.data.actor.systemData);

async function addXPJournalEntry() {
	const award = await AwardXPPrompt.promptForXPAward();
	if (!award) {
		return;
	}

	await toRaw(context.data.actor).update({
		'system.experienceJournal.entries': [
			...system.value.experienceJournal.entries,
			{
				amount: award.amount,
				type: JournalEntryType.Award,
				data: { reason: award.reason },
			},
		],
	});
}
</script>

<template>
	<section class="tab-journal">
		<section class="motivations">
			<div class="header"><Localized label="Genesys.Labels.Motivations" /></div>

			<div class="container">
				<!-- Strength -->
				<div class="motivation">
					<div class="header">
						<span><Localized label="Genesys.Labels.Strength" /></span>
						<input type="text" name="system.motivations.strength.name" :value="system.motivations.strength.name" />
					</div>

					<div class="body">
						<Editor name="system.motivations.strength.description" :content="system.motivations.strength.description" button />
					</div>
				</div>

				<!-- Flaw -->
				<div class="motivation">
					<div class="header">
						<span><Localized label="Genesys.Labels.Flaw" /></span>
						<input type="text" name="system.motivations.flaw.name" :value="system.motivations.flaw.name" />
					</div>

					<div class="body">
						<Editor name="system.motivations.flaw.description" :content="system.motivations.flaw.description" button />
					</div>
				</div>

				<!-- Desire -->
				<div class="motivation">
					<div class="header">
						<span><Localized label="Genesys.Labels.Desire" /></span>
						<input type="text" name="system.motivations.desire.name" :value="system.motivations.desire.name" />
					</div>

					<div class="body">
						<Editor name="system.motivations.desire.description" :content="system.motivations.desire.description" button />
					</div>
				</div>

				<!-- Fear -->
				<div class="motivation">
					<div class="header">
						<span><Localized label="Genesys.Labels.Fear" /></span>
						<input type="text" name="system.motivations.fear.name" :value="system.motivations.fear.name" />
					</div>

					<div class="body">
						<Editor name="system.motivations.fear.description" :content="system.motivations.fear.description" button />
					</div>
				</div>
			</div>
		</section>

		<section class="description">
			<div class="block">
				<div class="header"><Localized label="Genesys.Labels.CharacterIllustration" /></div>
				<img :src="system.illustration" data-edit="system.illustration" />
			</div>

			<div class="block">
				<div class="header"><Localized label="Genesys.Labels.CharacterDescription" /></div>

				<div class="desc-box">
					<label><Localized label="Genesys.Labels.Pronouns" /></label>
					<input type="text" name="system.details.gender" :value="system.details.gender" />

					<div class="underline" />

					<label><Localized label="Genesys.Labels.Age" /></label>
					<input type="text" name="system.details.age" :value="system.details.age" />

					<div class="underline" />

					<label><Localized label="Genesys.Labels.Height" /></label>
					<input type="text" name="system.details.height" :value="system.details.height" />

					<div class="underline" />

					<label><Localized label="Genesys.Labels.Build" /></label>
					<input type="text" name="system.details.build" :value="system.details.build" />

					<div class="underline" />

					<label><Localized label="Genesys.Labels.Hair" /></label>
					<input type="text" name="system.details.hair" :value="system.details.hair" />

					<div class="underline" />

					<label><Localized label="Genesys.Labels.Eyes" /></label>
					<input type="text" name="system.details.eyes" :value="system.details.eyes" />

					<div class="underline" />

					<div class="notable-features">
						<label><Localized label="Genesys.Labels.NotableFeatures" /></label>
						<textarea name="system.details.notableFeatures" :value="system.details.notableFeatures" />
					</div>
				</div>
			</div>
		</section>

		<section class="player-notes">
			<div class="header"><Localized label="Genesys.Labels.Notes" /></div>

			<Editor name="system.notes" :content="system.notes" button />
		</section>

		<section class="xp-journal">
			<div class="header"><Localized label="Genesys.Labels.XPJournal" /></div>

			<div class="entries-header">
				<div><Localized label="Genesys.RewardsPrompt.Reason" /></div>
				<div />
				<div><Localized label="Genesys.RewardsPrompt.Amount" /></div>
				<div>
					<a @click="addXPJournalEntry"><i class="fas fa-plus"></i></a>
				</div>
			</div>

			<div class="entries">
				<div v-for="(entry, index) in system.experienceJournal.entries" :key="index" class="entry">
					<div><Localized :label="`Genesys.XPJournal.${entry.type}`" :format-args="entry.data" enriched /></div>
					<div class="value">{{ entry.amount }}</div>
					<a v-if="entry.type !== JournalEntryType.Starting" @click="removeJournalEntry(toRaw(context.data.actor), index)"><i class="fas fa-trash"></i></a>
				</div>
			</div>
		</section>

		<section class="experience">
			<XPContainer label="Genesys.Labels.TotalXP" :value="system.totalXP" />
			<XPContainer label="Genesys.Labels.AvailableXP" :value="system.availableXP" />
		</section>
	</section>
</template>

<style lang="scss" scoped>
@use '@scss/mixins/reset.scss';
@use '@scss/vars/colors.scss';

.tab-journal {
	display: grid;
	grid-template-columns: 1fr min(33%, 250px);
	grid-template-rows: /* Motivations */ auto /* Notes */ auto /* XP Journal */ 1fr /* Experience Fields */ auto;
	gap: 0.5em;
	padding: 0.5em;

	section {
		background: transparentize(colors.$light-blue, 0.8);
		border-radius: 1em;
		padding: 0.75em;

		&.experience {
			background: none;
			grid-column: 1 / span all;
			display: grid;
			grid-template-columns: auto 1fr auto;
			width: 100%;
		}

		& > .header {
			text-align: right;
			font-size: 1.1em;
		}
	}

	.header {
		font-family: 'Bebas Neue', sans-serif;
		width: 100%;
	}

	.block {
		display: grid;
		grid-template-rows: auto 1fr;
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

	.description .header {
		text-align: right;
		font-size: 1.1em;
	}

	.motivations {
		container: motivations / inline-size;
		grid-column: 1 / span 1;
		grid-row: 1 / span 1;
		height: 100%;

		.container {
			display: flex;
			flex-direction: column;
			gap: 0.5em;
			width: 100%;
			height: 100%;

			@container motivations (min-width: 900px) {
				display: grid;
				grid-template-columns: 1fr 1fr;
			}
		}

		.motivation {
			display: flex;
			flex-direction: column;
			flex-wrap: nowrap;
			border: 1px solid black;
			background: white;

			@include reset.input;
			input {
				font-family: 'Roboto', sans-serif;
			}

			.header {
				display: flex;
				flex-direction: row;
				flex-wrap: nowrap;
				align-items: center;
				gap: 0.5em;
				padding: 0.25em;
				padding-left: 0.5em;
				border-bottom: 1px solid black;
				clip-path: polygon(0% 0%, 100% 0%, 100% calc(100% - 1px), 80% calc(100% - 1px), 80% 100%, 0% 100%);

				span {
					font-size: 1.1em;
				}
			}

			.body {
				display: flex;
				height: 100%;
				min-height: 120px;
			}
		}
	}

	.description {
		grid-column: 2 / span 1;
		grid-row: 1 / span 2;
		display: grid;
		grid-template-rows: auto 1fr;
		gap: 0.5em;

		.desc-box {
			display: grid;
			grid-template-columns: auto 1fr;
			grid-template-rows: repeat(6, auto 1px) 1fr;
			border: 1px solid black;
			background: white;
			align-items: center;
			column-gap: 0.5em;

			label {
				margin-left: 0.25em;
				font-family: 'Roboto Condensed', sans-serif;
				text-transform: uppercase;
				font-weight: 600;
				font-size: 0.8em;
			}

			@include reset.input;
			input {
				padding-left: 0.25em;
				font-family: 'Roboto', sans-serif;
			}

			.underline {
				grid-column: 1 / span all;
				width: 80%;
				height: 100%;
				background: black;
			}

			.notable-features {
				display: flex;
				grid-column: 1 / span all;
				width: 100%;
				min-height: 100%;
				height: 100%;
				flex-direction: column;

				textarea {
					height: 100%;
					width: 100%;
					resize: vertical;
					border: none;
					background: none;
					font-family: 'Roboto', sans-serif;
				}
			}
		}
	}

	.player-notes {
		grid-column: 1 / span 1;
		grid-row: 2 / span 1;
		display: flex;
		flex-direction: column;
		min-height: 175px;

		.editor {
			background: white;
			border: 1px solid black;
		}
	}

	.editor-content {
		padding: 0.5em;
	}

	.xp-journal {
		grid-column: 1 / span 2;
		grid-row: 3 / span 1;
	}
}

.xp-journal {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;

	.entries {
		display: flex;
		flex-direction: column-reverse;
		flex-wrap: nowrap;
		overflow-y: scroll;
		min-height: 1em;
		max-height: 250px;
		border: 1px solid black;
		background: white;
	}

	.entries-header,
	.entry {
		display: grid;
		grid-template-columns: /* Name */ auto /* Spacer */ 1fr /* Amount */ auto /* Delete */ 1.5rem;
		justify-items: center;
	}

	.entries-header {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 0.8em;

		& > div:first-of-type {
			padding-left: 0.5em;
		}
	}

	.entry {
		padding: 0.25em;

		a {
			grid-column: 4 / span 1;
		}

		.value {
			grid-column: 3 / span 1;
		}

		&:nth-of-type(2n) {
			background: transparentize(colors.$light-blue, 0.8);
		}
	}
}
</style>
