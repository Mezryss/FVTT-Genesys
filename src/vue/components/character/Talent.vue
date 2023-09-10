<script lang="ts" setup>
import { inject, ref } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import Localized from '@/vue/components/Localized.vue';
import Enriched from '@/vue/components/Enriched.vue';

const props = withDefaults(
	defineProps<{
		img: string;
		name: string;
		description: string;
		source: string;
		activation: {
			type: 'passive' | 'active';
			detail: string;
		};
		ranked?: boolean;
		rank?: number;
		effectiveTier?: number;
		canDelete?: boolean;
		canUpgrade?: boolean;
	}>(),
	{
		canDelete: false,
		canUpgrade: false,
		ranked: false,
		rank: 0,
	},
);

const emit = defineEmits<{
	(e: 'open'): void;
	(e: 'upgrade'): void;
	(e: 'delete'): void;
}>();

const rootContext = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;

const expanded = ref(false);
const talentRef = ref<HTMLElement | null>(null);

async function sendToChat() {
	const enrichedDescription = await TextEditor.enrichHTML(props.description, { async: true });

	const templateData = {
		img: props.img,
		name: props.name,
		description: enrichedDescription,
		activation: {
			type: props.activation.type,
			detail: props.activation.detail,
		},
		effectiveTier: props.effectiveTier,
		ranked: props.ranked,
		rank: props.rank,
	};

	const chatTemplate = await renderTemplate('systems/genesys/templates/chat/ability.hbs', templateData);
	await ChatMessage.create({
		user: game.user.id,
		speaker: {
			actor: game.user.character?.id,
		},
		content: chatTemplate,
		type: CONST.CHAT_MESSAGE_TYPES.IC,
	});
}
</script>

<template>
	<div class="talent">
		<img :src="img" :alt="name" />
		<span class="name" ref="talentRef">
			<a @click="expanded = !expanded">
				{{ name }}
				<template v-if="ranked">
					{{ rank }}
				</template>
			</a>

			<a v-if="ranked && canUpgrade" @click="emit('upgrade')"><i class="fas fa-arrow-circle-up"></i></a>
		</span>
		<div></div>
		<span v-if="canDelete">
			<a @click="emit('delete')"><i class="fas fa-trash"></i></a>
		</span>
		<span v-if="rootContext.data.editable">
			<a @click="emit('open')"><i class="fas fa-edit"></i></a>
		</span>
		<span v-if="rootContext.data.editable">
			<a @click="sendToChat()"><i class="fas fa-comment"></i></a>
		</span>
		<div :class="`desc-container ${expanded ? 'active' : ''}`">
			<div v-if="effectiveTier" class="tier-container">
				<span class="tier"><Localized label="Genesys.Labels.Tier" />: {{ effectiveTier }}</span>
			</div>

			<Enriched class="desc" :value="description"></Enriched>

			<div v-if="source" class="source">{{ source }}</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '@scss/vars/colors.scss';

.talent {
	display: grid;
	grid-template-columns: /* Image */ 2em /* Name */ auto /* Spacer */ 1fr /* Action Buttons */ auto;
	grid-template-rows: repeat(2, auto);
	align-items: center;
	padding: 0.25em;
	column-gap: 0.5em;
	row-gap: 0.1em;

	& > * {
		grid-row: 1 / span 1;
	}

	& + .talent {
		border-top: 1px dashed black;
	}

	img {
		aspect-ratio: 1;
		object-fit: contain;
	}

	.name {
		font-family: 'Roboto Slab', serif;
		font-size: 1.1em;
		display: flex;
		gap: 0.25em;
	}

	.desc-container {
		grid-column: 1 / span all;
		grid-row: 2 / span 1;
		transition: max-height 0.5s ease-out;
		max-height: 0;
		transform-origin: 50% 0;
		overflow: hidden;
		padding-left: 0.5em;

		&.active {
			max-height: 500px;
			transition: max-height 1s ease-in;
		}

		.tier-container {
			margin-top: 0.5em;
			margin-bottom: 0.5em;
		}

		.tier {
			border: 1px dotted colors.$gold;
			background: transparentize(colors.$gold, 0.5);
			border-radius: 0.5em;
			font-family: 'Bebas Neue', sans-serif;
			padding: 2px;
		}

		.source {
			text-align: right;
			font-family: 'Roboto', sans-serif;
			font-style: italic;
			font-size: 0.8em;
		}
	}
}
</style>
