<script lang="ts" setup>
import { inject, ref, toRaw } from 'vue';
import { CloneActorPromptContext } from '@/app/CloneActorPrompt';
import { RootContext } from '@/vue/SheetContext';
import Localized from '@/vue/components/Localized.vue';
import GenesysActor from '@/actor/GenesysActor';

type InstantiationMethod = 'Original' | 'Clone';

const context = inject<CloneActorPromptContext>(RootContext)!;
const actorName = ref(context.targetActor.name);
const instantiationMethod = ref<InstantiationMethod>('Original');

async function submitSelection(event: Event) {
	event.preventDefault();
	let targetActor: GenesysActor | undefined = toRaw(context.targetActor);

	if (instantiationMethod.value === 'Clone') {
		const modifiedProperties = {
			name: actorName.value ? actorName.value : targetActor.name,
			flags: {
				...targetActor.flags,
				...(targetActor.type === 'minion' && { genesys: { independentMinion: true } }),
			},
		};
		targetActor = await (Actor.implementation as typeof GenesysActor).create(foundry.utils.mergeObject(targetActor.toObject(), modifiedProperties));

		await targetActor?.update({ 'prototypeToken.actorLink': true });
	}

	context.resolvePromise(targetActor);
}
</script>

<template>
	<div class="genesys clone-actor-prompt">
		<div class="instantiation-method">
			<div class="instantiation-method-choice">
				<input type="radio" id="clone-actor-prompt-method-original" value="Original" v-model="instantiationMethod" />
				<label for="clone-actor-prompt-method-original"><Localized label="Genesys.CloneActorPrompt.OriginalMethod.Label" /></label>
			</div>

			<div class="instantiation-method-choice">
				<input type="radio" id="clone-actor-prompt-method-clone" value="Clone" v-model="instantiationMethod" />
				<label for="clone-actor-prompt-method-clone"><Localized label="Genesys.CloneActorPrompt.CloneMethod.Label" /></label>
			</div>
		</div>
		<div class="instantiation-description">
			<Localized :label="`Genesys.CloneActorPrompt.${instantiationMethod}Method.Description`" />
		</div>
		<div :class="{ 'clone-name': true, hidden: instantiationMethod !== 'Clone' }">
			<label><Localized label="Genesys.CloneActorPrompt.CloneMethod.ActorNameLabel" /></label>
			<input type="text" v-model="actorName" />
		</div>

		<button class="submit-button" @click="submitSelection"><Localized label="Genesys.Labels.Select" /></button>
	</div>
</template>

<style lang="scss">
@use '@scss/mixins/backgrounds.scss';

.app-clone-actor-prompt {
	min-width: 28rem;
	min-height: 15rem;

	.window-content {
		@include backgrounds.crossboxes();
	}
}
</style>

<style lang="scss" scoped>
@use '@scss/vars/colors.scss';

.clone-actor-prompt {
	.instantiation-method {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.3em;
		text-align: center;
		padding: 0.3em;
		font-family: 'Roboto Serif', serif;
		font-size: 1.15em;

		.instantiation-method-choice {
			input {
				vertical-align: top;
			}
			label {
				padding-left: 0.5rem;
			}
		}
	}

	.instantiation-description {
		font-family: 'Roboto', serif;
		font-size: 0.9rem;
		padding: 0.1rem;
		min-height: 4rem;
		text-align: justify;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.clone-name {
		display: grid;
		grid-template-columns: auto 1rem 1fr;
		gap: 0.3em;
		align-items: center;

		&.hidden {
			visibility: hidden;
		}

		input {
			grid-column: 3 / span 1;
		}
	}

	.submit-button {
		float: right;
		margin-top: 1rem;
		width: 50%;
	}
}
</style>
