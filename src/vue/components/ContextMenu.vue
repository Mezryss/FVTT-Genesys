<script lang="ts" setup>
import { ref } from 'vue';

const props = withDefaults(
	defineProps<{
		disableMenu?: boolean;
		usePrimaryClick?: boolean;
		orientation?: 'left' | 'right';
		position?: 'above' | 'below';
	}>(),
	{
		disableMenu: false,
		usePrimaryClick: false,
		orientation: 'right',
		position: 'below',
	},
);

const showMenu = ref(false);

function showContextMenu(event: Event) {
	if (props.disableMenu) {
		return;
	}

	event.stopImmediatePropagation();
	event.preventDefault();

	showMenu.value = true;

	document.addEventListener('click', closeContextMenu, { capture: true });
	document.addEventListener('contextmenu', closeContextMenu, { capture: true });
}

function closeContextMenu(event: Event) {
	event.preventDefault();
	showMenu.value = false;

	document.removeEventListener('click', closeContextMenu, { capture: true });
	document.removeEventListener('contextmenu', closeContextMenu, { capture: true });
}
</script>

<template>
	<div class="menu-container" @contextmenu="!usePrimaryClick && showContextMenu($event)" @click="usePrimaryClick && showContextMenu($event)">
		<div
			v-if="showMenu"
			:class="{
				'context-menu': true,
				[props.orientation]: true,
				[props.position]: true,
			}"
		>
			<slot name="menu-items"> IMPROPERLY-CONFIGURED MENU: NO MENU ITEMS DEFINED </slot>
		</div>
		<slot></slot>
	</div>
</template>

<style lang="scss">
@use '@scss/mixins/backgrounds.scss';
@use '@scss/vars/colors.scss';

.menu-container {
	position: relative;
}

.context-menu {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	gap: 0.25em;
	position: absolute;
	min-width: 100px;
	@include backgrounds.crossboxes;
	border: 1px solid colors.$gold;
	border-radius: 0.5em;
	padding: 0.25em;
	z-index: 1;

	&.above {
		bottom: 100%;
	}

	&.below {
		top: 100%;
	}

	&.right {
		left: 0;
	}

	&.left {
		right: 0;
	}

	hr {
		width: calc(100% + 0.5em);
		margin: 0;
		margin-left: -0.25em;
		border-bottom: none;
		border-color: transparentize(colors.$gold, 0.4);
	}
}
</style>
