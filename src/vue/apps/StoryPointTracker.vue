<script lang="ts" setup>
import { computed, inject, nextTick, Ref, ref } from 'vue';
import { vLocalize } from '@/vue/directives';
import { RootContext } from '@/vue/SheetContext';
import StoryPointTracker, { StoryPointTrackerContext } from '@/app/StoryPointTracker';
import Localized from '@/vue/components/Localized.vue';

const isGM = game.user.isGM;
const context = inject<StoryPointTrackerContext>(RootContext)!;

const canSpend = computed(() => ({
	gmPool: game.user.isGM && context.gmPool > 0,
	playerPool: context.playerPool > 0,
}));

const editingGM = ref(false);
const editingPlayer = ref(false);
const gmInput = ref<HTMLInputElement>();
const playerInput = ref<HTMLInputElement>();

async function spendStoryPoint(targetPool: keyof typeof canSpend.value) {
	if (!canSpend.value[targetPool]) {
		return;
	}
	await StoryPointTracker.spendStoryPoint(targetPool);
}

async function manualStoryPoints(which: 'gm' | 'player', event: Event) {
	if (!game.user.isGM) {
		return;
	}

	const newValue = parseInt((event.currentTarget as HTMLInputElement).value);

	if (isNaN(newValue)) {
		(event.currentTarget as HTMLInputElement).value = (which === 'gm' ? context.gmPool : context.playerPool).toString();
	}

	editingGM.value = false;
	editingPlayer.value = false;
	await StoryPointTracker.resetStoryPoints({
		player: which === 'gm' ? context.playerPool : newValue,
		gm: which === 'gm' ? newValue : context.gmPool,
	});
}

async function resetStoryPoints() {
	if (!game.user.isGM) {
		return;
	}

	await StoryPointTracker.resetStoryPoints();
}

async function toggleEdit(which: 'gm' | 'player') {
	if (!game.user.isGM) {
		return;
	}

	let inputRef: Ref<HTMLInputElement | undefined>;

	if (which === 'gm') {
		editingGM.value = true;
		inputRef = gmInput;
	} else {
		editingPlayer.value = true;
		inputRef = playerInput;
	}

	await nextTick();

	inputRef.value?.focus();
	inputRef.value?.select();
}
</script>

<template class="story-point-tracker">
	<div class="tracker">
		<header>
			<Localized label="Genesys.StoryPoints.GM" />
			<a v-if="isGM" @click="resetStoryPoints" v-localize:title="'Genesys.StoryPoints.Reset'"><i class="fas fa-arrows-rotate"></i></a>
		</header>
		<input v-if="editingGM" class="points" :value="context.gmPool" @change="manualStoryPoints('gm', $event)" ref="gmInput" />
		<a v-else-if="canSpend.gmPool" class="points" @click="spendStoryPoint('gmPool')" @contextmenu="toggleEdit('gm')">{{ context.gmPool }}</a>
		<div v-else class="points" @contextmenu="toggleEdit('gm')">{{ context.gmPool }}</div>
	</div>

	<div class="tracker">
		<header><Localized label="Genesys.StoryPoints.Player" /></header>
		<input v-if="editingPlayer" class="points" :value="context.playerPool" @change="manualStoryPoints('player', $event)" ref="playerInput" />
		<a v-else-if="canSpend.playerPool" class="points" @click="spendStoryPoint('playerPool')" @contextmenu="toggleEdit('player')">{{ context.playerPool }}</a>
		<div v-else class="points" @contextmenu="toggleEdit('player')">{{ context.playerPool }}</div>
	</div>
</template>

<style lang="scss">
@use '@scss/mixins/backgrounds.scss';
@use '@scss/vars/colors.scss';

.story-point-tracker {
	position: absolute;
	bottom: 20px;
	right: 320px;
	color: var(--color-dark-1);

	&.move-to-left {
		bottom: 15px;
		left: 250px;
		right: auto;
	}

	display: flex;
	flex-direction: column;
	gap: 1em;

	.tracker {
		@include backgrounds.crossboxes;

		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25em;

		width: 100%;
		border-radius: 0.5em;
		border: 1px solid colors.$gold;
		padding: 0.5em;
	}

	header {
		display: flex;
		gap: 0.25em;
		align-items: center;

		font-family: 'Bebas Neue', sans-serif;
		font-size: 1.25em;
		color: colors.$blue;

		a {
			font-size: 0.75em;
		}
	}

	input.points {
		width: 1.25em;
		text-align: center;
		border: 1px dashed colors.$gold;
		border-radius: 50%;
		aspect-ratio: 1;
	}

	.points {
		font-family: 'Roboto Serif', serif;
		font-size: 2em;
	}
}
</style>
