<script lang="ts" setup>
const props = withDefaults(
	defineProps<{
		/**
		 * Either a Localization key (if localized === true), or the string to use as the tooltip.
		 *
		 * Either way, this will be Enriched.
		 */
		content: string;
		localized?: boolean;
		direction?: TooltipDirection;
		cssClass?: string;
	}>(),
	{
		localized: false,
		direction: 'DOWN',
	},
);

async function showTooltip(event: Event) {
	const sourceText = props.localized ? game.i18n.localize(props.content) : props.content;
	const enriched = await TextEditor.enrichHTML(sourceText, { async: true });

	game.tooltip.activate(event.currentTarget as HTMLElement, { text: enriched, direction: props.direction, cssClass: props.cssClass });
}

async function hideTooltip() {
	game.tooltip.deactivate();
}
</script>

<template>
	<div @mouseover="showTooltip" @mouseleave="hideTooltip">
		<slot></slot>
	</div>
</template>

<style scoped>
div {
	display: inline;
}
</style>
