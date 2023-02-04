<script lang="ts" setup>
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		/**
		 * Localization key string.
		 */
		label: string;

		/**
		 * String formatting args.
		 */
		formatArgs?: { [key: string]: any };

		/**
		 * Whether to handle HTML formatting in the localized value.
		 */
		enriched?: boolean;
	}>(),
	{
		enriched: false,
	},
);

const localizedValue = computed(() => (props.formatArgs === undefined ? game.i18n.localize(props.label) : game.i18n.format(props.label, props.formatArgs)));
</script>

<template>
	<span v-if="enriched" v-html="localizedValue"></span>
	<template v-else>{{ localizedValue }}</template>
</template>
