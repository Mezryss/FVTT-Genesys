<script lang="ts" setup>
import { computed, inject } from 'vue';

import { ItemSheetContext, RootContext } from '@/vue/SheetContext';
import BaseWeaponSheet from '@/vue/sheets/item/BaseWeaponSheet.vue';
import Localized from '@/vue/components/Localized.vue';
import VehicleWeaponDataModel from '@/item/data/VehicleWeaponDataModel';

const context = inject<ItemSheetContext<VehicleWeaponDataModel>>(RootContext)!;
const system = computed(() => context.data.item.systemData);
</script>

<template>
	<BaseWeaponSheet>
		<template v-slot:extra-data>
			<div class="row">
				<label><Localized label="Genesys.Labels.FiringArc" /></label>
				<div class="firing-arc-options">
					<div>
						<input type="checkbox" name="system.firingArc.fore" :checked="system.firingArc.fore" />
						<label>Fore</label>
					</div>
					<div>
						<input type="checkbox" name="system.firingArc.aft" :checked="system.firingArc.aft" />
						<label>Aft</label>
					</div>
					<div>
						<input type="checkbox" name="system.firingArc.port" :checked="system.firingArc.port" />
						<label>Port</label>
					</div>
					<div>
						<input type="checkbox" name="system.firingArc.starboard" :checked="system.firingArc.starboard" />
						<label>Starbord</label>
					</div>
				</div>
			</div>
		</template>
	</BaseWeaponSheet>
</template>

<style lang="scss" scoped>
.firing-arc-options {
	display: grid;
	grid-template-columns: auto auto;
}
</style>
