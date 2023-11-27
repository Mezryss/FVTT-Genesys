<script lang="ts" setup>
import { computed, inject } from 'vue';

import { ItemSheetContext, RootContext } from '@/vue/SheetContext';
import BaseWeaponSheet from '@/vue/sheets/item/BaseWeaponSheet.vue';
import Localized from '@/vue/components/Localized.vue';
import WeaponDataModel from '@/item/data/WeaponDataModel';
import { Characteristic } from '@/data/Characteristics';

const context = inject<ItemSheetContext<WeaponDataModel>>(RootContext)!;

const system = computed(() => context.data.item.systemData);
</script>

<template>
	<BaseWeaponSheet>
		<template v-slot:extra-data>
			<div class="row">
				<label><Localized label="Genesys.Labels.DamageCharacteristic" /></label>
				<select name="system.damageCharacteristic" :value="system.damageCharacteristic">
					<option value="-">-</option>
					<option :value="Characteristic.Brawn"><Localized label="Genesys.Characteristics.Brawn" /></option>
					<option :value="Characteristic.Agility"><Localized label="Genesys.Characteristics.Agility" /></option>
					<option :value="Characteristic.Intellect"><Localized label="Genesys.Characteristics.Intellect" /></option>
					<option :value="Characteristic.Cunning"><Localized label="Genesys.Characteristics.Cunning" /></option>
					<option :value="Characteristic.Willpower"><Localized label="Genesys.Characteristics.Willpower" /></option>
					<option :value="Characteristic.Presence"><Localized label="Genesys.Characteristics.Presence" /></option>
				</select>
			</div>
		</template>
	</BaseWeaponSheet>
</template>
