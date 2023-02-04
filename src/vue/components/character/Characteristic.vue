<script lang="ts" setup>
import Localized from '@/vue/components/Localized.vue';

withDefaults(
	defineProps<{
		/**
		 * Localization key for the characteristic label.
		 */
		label: string;

		/**
		 * Can the characteristic be upgraded?
		 */
		canUpgrade?: boolean;

		/**
		 * Can the field be directly edited?
		 */
		canEdit?: boolean;

		/**
		 * If the field can be directly edited, what is the field name for the input?
		 */
		name?: string;

		/**
		 * Value to display for the Characteristic.
		 */
		value: number;
	}>(),
	{
		canUpgrade: false,
		canEdit: false,
	},
);

const emit = defineEmits<{
	(e: 'upgrade'): void;
}>();
</script>

<template>
	<div class="characteristic-field">
		<div class="box">
			<div class="box-inner"></div>
		</div>

		<label>
			<Localized :label="label" />
			<a v-if="canUpgrade" @click="emit('upgrade')"><i class="fas fa-arrow-circle-up"></i></a>
		</label>

		<input v-if="canEdit" type="number" :name="name" class="value" :value="value" min="0" />
		<div v-else class="value">{{ value }}</div>
	</div>
</template>

<style lang="scss" scoped>
@use '@/scss/mixins/reset.scss';
@use '@/scss/vars/colors.scss';

.characteristic-field {
	$row-size: 1.5rem;

	display: grid;
	grid-template-columns: $row-size * 2;
	grid-template-rows: repeat(2, $row-size) auto;
	justify-content: center;
	align-items: center;
	position: relative;

	& > * {
		grid-column: 1 / span 1;
	}

	.value {
		grid-row: 1 / span 2;
		border: 2px solid colors.$blue;
		border-radius: 50%;
		width: $row-size * 2;
		height: $row-size * 2;
		background: white;
		font-family: 'Bebas Neue', sans-serif;
		font-size: 2em;
		text-align: center;
		// Help vertically center the Bebas Neue font.
		padding-top: 0.15em;
		z-index: 1;

		&:focus {
			border: 2px solid colors.$gold;
		}
	}

	.box {
		position: relative;
		$clip-size: 0.5rem;
		grid-row: 1 / span 3;
		height: 100%;
		background: colors.$blue;
		margin-left: -1em;
		width: calc(100% + 2em);

		$clip-path: polygon(0% 100%, 0% ($clip-size + $row-size), $clip-size $row-size, calc(100% - $clip-size) $row-size, 100% ($clip-size + $row-size), 100% 100%);
		clip-path: $clip-path;

		.box-inner {
			position: absolute;
			top: 1px;
			left: 1px;
			width: calc(100% - 2px);
			height: calc(100% - 2px);

			background: white;

			clip-path: $clip-path;

			&::after {
				display: block;
				content: ' ';
				position: absolute;
				top: 1px;
				left: 1px;
				width: calc(100% - 2px);
				height: 100%;
				background: radial-gradient(white 50%, colors.$blue 50%);
				background-size: ($row-size * 3) calc(($row-size * 3));
				background-repeat: no-repeat;
				background-position: 50% -14px;
				background-color: colors.$blue;
				clip-path: $clip-path;
			}
		}
	}

	label {
		width: 100%;
		grid-row: 3 / span 1;
		color: white;
		font-family: 'Bebas Neue', sans-serif;
		text-transform: uppercase;
		text-align: center;
		z-index: 1;
		margin-top: 2px;
		margin-bottom: 2px;

		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: center;
		gap: 0.25em;
	}
}
</style>
