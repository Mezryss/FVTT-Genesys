<script lang="ts" setup>
import { ref, watchEffect } from 'vue';

import Localized from '@/vue/components/Localized.vue';
import ContextMenu from '@/vue/components/ContextMenu.vue';
import MenuItem from '@/vue/components/MenuItem.vue';
import ActorTile from '@/vue/components/ActorTile.vue';
import GenesysActor from '@/actor/GenesysActor';

type MemberUUID = ActorUUID | TokenDocumentUUID;

const props = withDefaults(
	defineProps<{
		id: string;
		name: string;
		skills: string[];
		members: string[];
		dragging?: boolean;
	}>(),
	{
		dragging: false,
	},
);

const emit = defineEmits<{
	(e: 'delete'): void;
	(e: 'updateName', newName: string): void;
	(e: 'removeSkill', skillName: string): void;
	(e: 'removeMember', memberUuid: string): void;
	(e: 'actorDragStart', event: DragEvent): void;
	(e: 'actorDragEnd'): void;
	(e: 'entityDrop', event: DragEvent, memberUnder?: MemberUUID): void;
}>();

const dragCounter = ref(0);
const actorsInRole = ref<GenesysActor[]>([]);

// Make sure to display only actors that exist.
watchEffect(async () => {
	const foundActors: GenesysActor[] = [];
	for (const member of props.members) {
		const actor = await fromUuid<GenesysActor>(member);
		if (actor) {
			foundActors.push(actor);
		}
	}
	actorsInRole.value = foundActors;
});

const deleteLabel = game.i18n.localize('Genesys.Labels.Delete');

function dragEnter() {
	dragCounter.value += 1;
}

function dragLeave() {
	dragCounter.value -= 1;
}

function drop(event: DragEvent, memberUnder?: MemberUUID) {
	dragCounter.value = 0;

	emit('entityDrop', event, memberUnder);
}
</script>

<template>
	<div
		:class="{
			'role-section': true,
			'drop-target': props.dragging,
			'drop-hover': props.dragging && dragCounter > 0,
		}"
		:data-role-id="props.id"
		@dragenter="dragEnter"
		@dragleave="dragLeave"
		@drop="drop($event)"
	>
		<div class="role-data">
			<div class="role-name">
				<label><Localized label="Genesys.Labels.Name" /></label>
				<input type="text" :value="name" @change="emit('updateName', ($event.target as HTMLInputElement).value)" />
				<a @click="emit('delete')"><i class="fas fa-trash"></i></a>
			</div>
			<div class="underline" />

			<div class="role-skills">
				<label><Localized label="Genesys.Labels.Skills" /></label>
				<div>
					<ContextMenu v-for="skill in skills" :key="skill" class="role-skill">
						<template v-slot:menu-items>
							<MenuItem @click="emit('removeSkill', skill)">
								<template v-slot:icon><i class="fas fa-trash"></i></template>
								{{ deleteLabel }}
							</MenuItem>
						</template>

						<span>{{ skill }}</span>
					</ContextMenu>
				</div>
			</div>
			<div class="underline" />

			<div class="role-members">
				<TransitionGroup name="mems">
					<div v-for="member in actorsInRole" :key="member.uuid" class="role-member" @drop="drop($event, member.uuid)">
						<ActorTile :actor="member as GenesysActor" draggable="true" @dragstart="emit('actorDragStart', $event)" @dragend="emit('actorDragEnd')" :dragging="dragging" @remove-member="emit('removeMember', member.uuid)" />
					</div>
				</TransitionGroup>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '@scss/mixins/reset.scss';
@use '@scss/vars/colors.scss';

.role-section {
	grid-column: auto / span 1;
	background: transparentize(colors.$light-blue, 0.85);
	border-radius: 1em;
	padding: 0.75em;

	.role-data {
		display: grid;
		grid-template-columns: auto 1fr auto;
		grid-template-rows: repeat(2, auto 1px) 1fr;
		border: 1px solid black;
		background: white;
		align-items: center;
		column-gap: 0.5em;
		height: 100%;

		.role-name,
		.role-skills {
			display: contents;

			label {
				margin-left: 0.25em;
				font-family: 'Roboto Condensed', sans-serif;
				text-transform: uppercase;
				font-weight: 600;
				font-size: 0.8em;
			}
		}

		.role-name {
			@include reset.input;
			input {
				padding-left: 0.25em;
				font-family: 'Roboto', sans-serif;
			}
		}

		.role-skills {
			& > div {
				display: flex;
				padding-left: 0.25em;
				font-family: 'Roboto', sans-serif;
				min-height: 2em;
				align-items: center;
				flex-wrap: wrap;

				.role-skill {
					& > span {
						display: inline-flex;
						flex-direction: row;
						flex-wrap: nowrap;
						align-items: center;
						gap: 0.5em;
					}

					& > span::after {
						content: ',';
						margin-right: 0.25em;
						margin-left: -0.4em;
					}

					&:last-of-type > span::after {
						display: none;
					}
				}
			}
		}

		.underline {
			grid-column: 1 / span all;
			width: 92%;
			height: 100%;
			background: black;
		}

		.role-members {
			grid-column: 1 / span all;
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			min-height: 7rem;
			align-items: center;
			justify-content: center;

			.mems-move,
			.mems-enter-active,
			.mems-leave-active {
				transition: all 0.5s ease;
			}

			.mems-enter-from,
			.mems-leave-to {
				height: 0;
				opacity: 0;
				transform: translateY(50px);
			}

			.role-member {
				margin: 0.5rem;
				width: 80px;
				z-index: 5;
			}
		}
	}
}

.drop-target {
	background: transparentize(colors.$light-blue, 0.75);

	&.drop-hover {
		background: colors.$light-blue;
	}
}
</style>
