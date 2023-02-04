<script lang="ts" setup>
import { computed, inject } from 'vue';

import { ItemSheetContext, RootContext } from '@/vue/SheetContext';
import BasicItemSheet from '@/vue/sheets/item/BasicItemSheet.vue';
import Localized from '@/vue/components/Localized.vue';
import InjuryDataModel from '@/item/data/InjuryDataModel';

const context = inject<ItemSheetContext<InjuryDataModel>>(RootContext)!;

const system = computed(() => context.data.item.systemData);
</script>

<template>
	<BasicItemSheet show-effects-tab>
		<template v-slot:data>
			<section class="data-grid">
				<div class="row">
					<label><Localized label="Genesys.Labels.Severity" /></label>
					<select name="system.severity" :value="system.severity">
						<option value="-">—</option>
						<option value="easy"><Localized label="Genesys.Difficulty.Easy" /></option>
						<option value="average"><Localized label="Genesys.Difficulty.Average" /></option>
						<option value="hard"><Localized label="Genesys.Difficulty.Hard" /></option>
						<option value="daunting"><Localized label="Genesys.Difficulty.Daunting" /></option>
					</select>
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Source" /></label>
					<input type="text" name="system.source" :value="system.source" />
				</div>
			</section>
		</template>
	</BasicItemSheet>
</template>
