<script lang="ts" setup>
import { ref } from 'vue';

defineProps<{
	/**
	 * Whether the sort slot should be collapsed.
	 */
	active: boolean;
}>();

const emit = defineEmits<{
	/**
	 * Callback when an item is dropped on this sort slot.
	 */
	(e: 'drop', event: DragEvent): void;
}>();

const dragCounter = ref(0);

function dragEnter() {
	dragCounter.value += 1;
}

function dragLeave() {
	dragCounter.value = Math.max(0, dragCounter.value - 1);
}

function drop(event: DragEvent) {
	dragCounter.value = 0;

	emit('drop', event);
}
</script>

<template>
	<div :class="{ sortTarget: true, active, hover: dragCounter > 0 }" @dragenter="dragEnter" @dragleave="dragLeave" @drop="drop">
		<div class="inner"></div>
	</div>
</template>

<style lang="scss" scoped>
@use 'sass:math';
@use '@/scss/vars/colors.scss';

$height: 0.75em;

.sortTarget {
	display: flex;
	align-items: center;
	align-content: center;
	height: 0;
	width: 100%;
	margin-bottom: 0;

	transition: all 0.25s;
	opacity: 20%;

	&.active {
		height: $height;
		margin-bottom: 0.25em;
	}

	&.hover {
		opacity: 100%;
		color: colors.$gold;
	}

	.inner {
		display: block;
		background: colors.$light-blue;
		border-radius: math.div($height, 2);
		width: 80%;
		height: 100%;
		margin: auto;
	}
}
</style>
