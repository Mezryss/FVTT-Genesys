<script lang="ts" setup>
import { ref } from 'vue';

const props = withDefaults(
	defineProps<{
		disableMenu?: boolean;
	}>(),
	{
		disableMenu: false,
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
	<div class="menu-container" @contextmenu="showContextMenu">
		<div v-if="showMenu" class="context-menu">
			<slot name="menu-items"> IMPROPERLY-CONFIGURED MENU: NO MENU ITEMS DEFINED </slot>
		</div>
		<slot @contextmenu="showMenu = !showMenu"></slot>
	</div>
</template>

<style lang="scss" scoped>
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
	top: 100%;
	left: 0;
	min-width: 100px;
	@include backgrounds.crossboxes;
	border: 1px solid colors.$gold;
	border-radius: 0.5em;
	z-index: 100;
	padding: 0.25em;
}
</style>
