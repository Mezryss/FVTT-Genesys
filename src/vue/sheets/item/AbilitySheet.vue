<script lang="ts" setup>
import { computed, inject } from 'vue';

import { ItemSheetContext, RootContext } from '@/vue/SheetContext';
import BasicItemSheet from '@/vue/sheets/item/BasicItemSheet.vue';
import Localized from '@/vue/components/Localized.vue';
import AbilityDataModel from '@/item/data/AbilityDataModel';

const context = inject<ItemSheetContext<AbilityDataModel>>(RootContext)!;

const system = computed(() => context.data.item.systemData);
</script>

<template>
	<BasicItemSheet show-effects-tab>
		<template v-slot:data>
			<section class="data-grid">
				<div class="row">
					<label>
						<Localized label="Genesys.Labels.Activation" />
					</label>
					<div class="activation-field">
						<select :value="system.activation.type" name="system.activation.type">
							<option value="active"><Localized label="Genesys.Labels.Active" /></option>
							<option value="passive"><Localized label="Genesys.Labels.Passive" /></option>
						</select>

						<input type="text" name="system.activation.detail" :value="system.activation.detail" />
					</div>
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Source" /></label>
					<input type="text" name="system.source" :value="system.source" />
				</div>
			</section>
		</template>
	</BasicItemSheet>
</template>

<style lang="scss" scoped>
.activation-field {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.25em;
}
</style>
