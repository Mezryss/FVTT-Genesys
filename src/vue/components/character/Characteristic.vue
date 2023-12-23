<script lang="ts" setup>
import ContextMenu from '@/vue/components/ContextMenu.vue';
import Localized from '@/vue/components/Localized.vue';
import MenuItem from '@/vue/components/MenuItem.vue';

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
		 * Can the characteristic be used to directly to roll an unskilled check?
		 */
		canRollUnskilled?: boolean;

		/**
		 * Can the characteristic be marked as a super-characteristic?
		 */
		canMarkSuper?: boolean;

		/**
		 * Is this a super-characteristic?
		 */
		isSuper?: boolean;

		/**
		 * If the field can be directly edited, what is the field name for the input?
		 */
		name?: string;

		/**
		 * Value to display for the Characteristic.
		 */
		value: number | string;
	}>(),
	{
		canUpgrade: false,
		canEdit: false,
		canRollUnskilled: false,
		canMarkSuper: false,
		isSuper: false,
	},
);

const emit = defineEmits<{
	(e: 'upgrade'): void;
	(e: 'rollUnskilled'): void;
	(e: 'toggleSuper'): void;
}>();

const allowSuperCharacteristics = CONFIG.genesys.useSuperCharacteristics;
const markSuperCharacteristicLabel = game.i18n.localize('Genesys.Labels.MarkSuperCharacteristic');
const unmarkSuperCharacteristicLabel = game.i18n.localize('Genesys.Labels.UnmarkSuperCharacteristic');
</script>

<template>
	<div class="characteristic-field">
		<div class="box">
			<div class="box-inner"></div>
		</div>

		<ContextMenu :disable-menu="!(allowSuperCharacteristics && canMarkSuper)" class="super-char">
			<template v-slot:menu-items>
				<MenuItem @click="emit('toggleSuper')">
					<template v-slot:icon><i :class="`${isSuper ? 'far' : 'fas'} fa-star`"></i></template>
					{{ isSuper ? unmarkSuperCharacteristicLabel : markSuperCharacteristicLabel }}
				</MenuItem>
			</template>

			<label>
				<a v-if="canUpgrade || canRollUnskilled" @click="canUpgrade ? emit('upgrade') : emit('rollUnskilled')">
					<Localized :label="label" />
					<i v-if="canUpgrade" class="fas fa-arrow-circle-up"></i>
				</a>

				<Localized v-else :label="label" />
			</label>
		</ContextMenu>

		<div class="value">
			<i v-if="allowSuperCharacteristics && isSuper" class="fas fa-star super-star"></i>

			<input v-if="canEdit" type="text" data-dtype="Number" :name="name" :value="value" />
			<div v-else>{{ value }}</div>
		</div>
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

		@include reset.input;
		input {
			z-index: 3;
		}

		&:focus-within {
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

	.super-star {
		position: absolute;
		padding: 0;
		font-size: 1.5em;
		top: 0;
		left: 0;
		color: colors.$gold;
		z-index: -1;
	}

	.super-char {
		display: contents;
		white-space: nowrap;
	}

	label {
		width: 100%;
		grid-row: 3 / span 1;
		grid-column: 1 / span 1;
		color: white;
		font-family: 'Bebas Neue', sans-serif;
		text-transform: uppercase;
		text-align: center;
		z-index: 1;
		margin-top: 2px;
		margin-bottom: 2px;

		a {
			display: flex;
			flex-wrap: nowrap;
			align-items: center;
			justify-content: center;
			gap: 0.25em;
		}
	}
}
</style>
