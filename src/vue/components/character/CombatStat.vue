<script lang="ts" setup>
import Localized from '@/vue/components/Localized.vue';

withDefaults(
	defineProps<{
		hasSecondary?: boolean;

		label: string;

		primaryLabel?: string;
		value: number;
		name?: string;
		editPrimary?: boolean;

		secondaryName?: string;
		secondaryLabel?: string;
		secondaryValue?: number;
		secondaryReadOnly?: boolean;

		readOnly?: boolean;
	}>(),
	{
		hasSecondary: false,
		editPrimary: false,
		secondaryReadOnly: false,
		readOnly: false,
	},
);

function validateInput(event: Event) {
	const newValue = parseInt((event.currentTarget as HTMLInputElement).value);

	if (isNaN(newValue) || newValue < 0) {
		(event.currentTarget as HTMLInputElement).value = '0';
	}
}
</script>

<template>
	<div class="combat-stat">
		<div class="rounded-bg-outer">
			<div :class="`rounded-bg ${hasSecondary ? 'secondary' : ''}`">
				<label v-if="primaryLabel"><Localized :label="primaryLabel" /></label>
				<label v-if="secondaryLabel"><Localized :label="secondaryLabel" /></label>
			</div>
		</div>

		<div class="value-container">
			<input v-if="editPrimary && !readOnly" type="number" :name="name" :value="value" class="value" min="0" />
			<div v-else class="value">{{ value }}</div>
			<template v-if="hasSecondary">
				<div class="separator"></div>
				<div v-if="readOnly || secondaryReadOnly" class="value">{{ secondaryValue }}</div>
				<input v-else @change="validateInput" :name="secondaryName" type="number" class="value" :value="secondaryValue" min="0" />
			</template>
		</div>

		<div class="stat-label-outer">
			<span><Localized :label="label" /></span>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '@scss/mixins/reset.scss';
@use '@scss/vars/colors.scss';

.combat-stat {
	display: grid;
	grid-template-rows: auto repeat(3, 1em);
	grid-template-columns: 100%;
	max-width: 165px;
	width: 100%;

	$box-margin: 8px;

	& > * {
		grid-column: 1 / span 1;
	}

	.stat-label-outer {
		$clip-path: polygon(0% 0%, 100% 0%, 100% calc(100% - 0.6rem), calc(100% - 0.6rem) 100%, 0.6rem 100%, 0% calc(100% - 0.6rem));

		grid-row: 1 / span 1;
		background: colors.$gold;
		margin-top: 2px;
		margin-left: ($box-margin + 2px);
		width: calc(100% - ($box-margin + 2px) * 2);
		color: white;
		font-family: 'Bebas Neue', sans-serif;
		text-transform: uppercase;
		text-align: center;
		position: relative;
		clip-path: $clip-path;
		white-space: nowrap;

		span {
			display: block;
			position: relative;
			top: 1px;
			left: 1px;
			width: calc(100% - 2px);
			height: calc(100% - 2px);
			background: colors.$red;
			clip-path: $clip-path;
		}
	}

	.value-container {
		$clip-path: polygon(0% 0%, 100% 0%, 100% calc(100% - 1rem), calc(100% - 1rem) 100%, 1rem 100%, 0% calc(100% - 1rem));

		grid-row: 1 / span 3;
		display: grid;
		gap: 0;
		grid-template-columns: 1fr auto 1fr;
		background: colors.$gold;
		margin-left: $box-margin;
		margin-right: $box-margin;
		clip-path: $clip-path;

		@include reset.input;

		.separator {
			margin-top: 1px;
			width: 1px;
			background: linear-gradient(to bottom, white 3px, colors.$red 3px);
		}

		.value {
			position: relative;
			top: 1px;
			left: 1px;
			width: calc(100% - 1px);
			height: calc(100% - 2px);
			padding-top: 1.25rem;
			background: white;
			font-family: 'Bebas Neue', sans-serif;
			font-size: 1.75em;
			text-align: center;

			&:first-child {
				grid-column: 1 / span 1;
				clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 1rem 100%, 0% calc(100% - 1rem));
				padding-left: 1em;
			}

			&:last-child {
				left: 0;
				grid-column: 3 / span 1;
				clip-path: polygon(0% 0%, 100% 0%, 100% calc(100% - 1rem), calc(100% - 1rem) 100%, 0% 100%);
				padding-right: 1em;
			}

			&:only-child {
				padding-left: 0;
				padding-right: 0;
				grid-column: 1 / span 3;
				clip-path: $clip-path;
				width: calc(100% - 1px);
			}
		}
	}

	.rounded-bg-outer {
		grid-row: 2 / span 3;
		background: colors.$gold;
		border-radius: 1.5em;

		.rounded-bg {
			position: relative;
			top: 1px;
			left: 1px;
			width: calc(100% - 2px);
			height: calc(100% - 2px);
			display: grid;
			grid-template-columns: 50% 50%;
			grid-template-rows: 1fr auto;
			background: colors.$red;
			border-radius: 1.5em;

			label {
				display: block;
				width: 100%;
				position: relative;
				z-index: 1;
				color: white;
				font-family: 'Bebas Neue', sans-serif;
				text-transform: uppercase;
				font-size: 0.8em;
				grid-row: 2 / span 1;

				&:first-of-type {
					text-align: right;
					padding-right: calc(0.75em - 1px);
				}

				&:last-of-type {
					text-align: left;
					padding-left: 0.75em;
				}
			}

			&.secondary::after {
				display: block;
				content: ' ';
				position: absolute;
				top: 0;
				left: calc(50% + 1px);
				width: calc(50% - 1px);
				height: 100%;
				border-top-right-radius: 1.5em;
				border-bottom-right-radius: 1.5em;
				background: colors.$blue;
				grid-column: 1 / span 2;
				grid-row: 1 / span 2;
			}
		}
	}
}
</style>
