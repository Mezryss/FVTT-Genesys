<script lang="ts" setup>
import Localized from '@/vue/components/Localized.vue';

defineProps<{
	value: number;
	label: string;
}>();
</script>

<template>
	<div class="xp-container">
		<div class="value">{{ value }}</div>
		<div class="label">
			<span><Localized :label="label" /></span>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '@scss/vars/colors.scss';

.xp-container {
	position: relative;
	top: -1rem;
	width: 7rem;
	height: 5rem;
	background: colors.$gold;
	border-radius: 3rem;
	clip-path: polygon(0% 0.5rem, 100% 0.5rem, 100% calc(100% - 0.5rem), 0% calc(100% - 0.5rem));

	.label,
	&::before {
		position: absolute;
		display: block;
		border-radius: 3rem;
		clip-path: polygon(0% 0.5rem, 100% 0.5rem, 100% calc(100% - 0.5rem), 0% calc(100% - 0.5rem));
	}

	&::before {
		z-index: 0;
		content: '';
		background: white;
		top: 1px;
		left: 1px;
		height: calc(100% - 2px);
		width: calc(100% - 2px);
	}

	&:first-of-type {
		grid-column: 1 / span 1;
	}

	&:last-of-type {
		grid-column: 3 / span 1;
	}

	.value,
	label {
		position: relative;
		z-index: 1;
	}

	.value {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-size: 2em;
		margin-top: -0.35em;
		height: 100%;
	}

	.label {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		grid-template-rows: 1fr auto;
		text-align: center;
		background: colors.$red;
		top: 2px;
		left: 2px;
		height: calc(100% - 4px);
		width: calc(100% - 4px);
		clip-path: polygon(0% calc(100% - 2em), 100% calc(100% - 2em), 100% 100%, 0% 100%);
		color: white;
		font-family: 'Bebas Neue', sans-serif;
		text-transform: uppercase;

		span {
			grid-column: 2 / span 1;
			grid-row: 2 / span 1;
			margin-bottom: 0.5em;
		}
	}
}
</style>
