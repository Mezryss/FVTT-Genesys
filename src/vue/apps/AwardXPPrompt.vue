<script lang="ts" setup>
import { inject, ref } from 'vue';

import { AwardXPContext } from '@/app/AwardXPPrompt';
import { RootContext } from '@/vue/SheetContext';
import Localized from '@/vue/components/Localized.vue';

const context = inject<AwardXPContext>(RootContext)!;

const amount = ref(0);
const reason = ref('');

function awardXP(event: Event) {
	event.preventDefault();

	context.resolvePromise({
		amount: amount.value,
		reason: reason.value,
	});
}
</script>

<template>
	<div class="genesys award-xp-prompt">
		<div class="amount">
			<label><Localized label="Genesys.RewardsPrompt.Amount" /></label>
			<input type="number" min="0" v-model="amount" />
		</div>

		<div class="reason">
			<label><Localized label="Genesys.RewardsPrompt.Reason" /></label>
			<textarea v-model="reason"></textarea>
		</div>

		<button @click="awardXP"><Localized label="Genesys.Labels.Add" /></button>
	</div>
</template>

<style lang="scss">
@use '@scss/mixins/backgrounds.scss';
@use '@scss/mixins/reset.scss';

.app-award-xp-prompt {
	min-width: 150px;
	min-height: 200px;

	.window-content {
		@include backgrounds.crossboxes();
	}
}

.award-xp-prompt {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	gap: 0.5em;

	label {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 1.1em;
	}

	* {
		font-family: 'Roboto Serif', serif;
	}

	div {
		padding: 0.5em;
	}

	@include reset.input;

	input {
		background: transparentize(white, 0.8);
		text-align: right;
		font-size: 1.25em;
	}

	textarea {
		resize: vertical;
		min-height: 100px;
	}

	.amount {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		border-bottom: 1px dashed black;
		gap: 0.5em;
	}

	.reason {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
	}
}
</style>
