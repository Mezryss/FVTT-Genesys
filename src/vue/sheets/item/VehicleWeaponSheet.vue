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
						<label><Localized label="Genesys.FiringArc.Fore" /></label>
					</div>
					<div>
						<input type="checkbox" name="system.firingArc.aft" :checked="system.firingArc.aft" />
						<label><Localized label="Genesys.FiringArc.Aft" /></label>
					</div>
					<div>
						<input type="checkbox" name="system.firingArc.port" :checked="system.firingArc.port" />
						<label><Localized label="Genesys.FiringArc.Port" /></label>
					</div>
					<div>
						<input type="checkbox" name="system.firingArc.starboard" :checked="system.firingArc.starboard" />
						<label><Localized label="Genesys.FiringArc.Starboard" /></label>
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
