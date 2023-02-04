<script lang="ts" setup>
import GenesysEffect from '@/effects/GenesysEffect';
import { inject, toRaw } from 'vue';
import { BaseSheetContext, RootContext } from '@/vue/SheetContext';
import Localized from '@/vue/components/Localized.vue';

defineProps<{
	effects: GenesysEffect[];
}>();

const emit = defineEmits<{
	(e: 'addEffect', category: string): void;
}>();

const rootContext = inject<BaseSheetContext>(RootContext)!;

type EffectSection = {
	label: string;
	filter: (effect: GenesysEffect) => boolean;
};

const sections: EffectSection[] = [
	{ label: 'Temporary', filter: (e) => e.isTemporary && !e.isSuppressed },
	{ label: 'Passive', filter: (e) => !e.isTemporary && !e.isSuppressed },
	{ label: 'Suppressed', filter: (e) => e.isSuppressed },
];

async function openEffect(effect: GenesysEffect) {
	await toRaw(effect).sheet.render(true);
}

async function suppressEffect(effect: GenesysEffect) {
	await toRaw(effect).update({
		disabled: !effect.disabled,
	});
}

async function deleteEffect(effect: GenesysEffect) {
	await toRaw(effect).delete();
}
</script>

<template>
	<section class="effects-view">
		<template v-for="{ label: section, filter } in sections" :key="section">
			<div class="effects-header">
				<div class="name"><Localized :label="`Genesys.ActiveEffects.${section}`" /></div>
				<div class="source"><Localized label="Genesys.ActiveEffects.Source" /></div>
				<div class="duration"><Localized label="Genesys.ActiveEffects.Duration" /></div>
				<div class="buttons">
					<a @click="emit('addEffect', section.toLowerCase())"><i class="fas fa-plus"></i> <Localized label="Genesys.Labels.Add" /></a>
				</div>
			</div>

			<section class="effects-category">
				<div v-for="effect in effects.filter(filter)" :key="effect.id" class="effect">
					<img :src="effect.icon" :alt="effect.name" />
					<div class="name">{{ effect.label }}</div>
					<div class="source">{{ effect.sourceName }}</div>
					<div class="duration">{{ effect.duration.label }}</div>
					<div v-if="rootContext.data.editable" class="buttons">
						<a @click="suppressEffect(effect)" :style="effect.isSuppressed ? 'opacity: 25%' : undefined"><i class="fas fa-power-off"></i></a>
						<a @click="openEffect(effect)"><i class="fas fa-edit"></i></a>
						<a v-if="!effect.origin" @click="deleteEffect(effect)"><i class="fas fa-trash"></i></a>
					</div>
				</div>
			</section>
		</template>
	</section>
</template>

<style lang="scss">
@use '@scss/vars/colors.scss';

.effects-view {
	width: 100%;
	height: 100%;

	.buttons {
		display: flex;
		align-items: center;
		gap: 0.25em;
	}

	.effect,
	.effects-header {
		align-items: center;
		display: grid;
		grid-template-columns: /* Icon */ 1.5rem /* Name */ 1fr /* Source */ 120px /* Duration */ 120px /* Actions */ 60px;
		grid-template-rows: 1.75rem;
		column-gap: 0.5em;

		.buttons {
			text-align: right;
		}
	}

	.effects-category {
		img {
			background: darken(colors.$gold, 0.8);
			border: 1px solid colors.$gold;
			border-radius: 0.25em;
		}

		.separator {
			height: 1px;
			border-top: 1px dashed black;
			grid-column: 1 / span all;
			grid-row: 1 / span 1;
			margin-top: 0.25em;
			margin-bottom: 0.25em;
		}

		.effect {
			border-bottom: 1px dashed black;
			padding-left: 0.5em;

			&:last-of-type {
				border-bottom: none;
			}
		}
	}

	.effects-header {
		font-family: 'Bebas Neue', sans-serif;
		text-transform: uppercase;
		margin-top: 1em;

		&:first-of-type {
			margin-top: 0;
		}

		.name {
			grid-column: 1 / span 2;
		}
	}
}
</style>
