<script lang="ts" setup>
import { computed, inject } from 'vue';

import { ItemSheetContext, RootContext } from '@/vue/SheetContext';
import BasicItemSheet from '@/vue/sheets/item/BasicItemSheet.vue';
import Localized from '@/vue/components/Localized.vue';
import TalentDataModel from '@/item/data/TalentDataModel';

const context = inject<ItemSheetContext<TalentDataModel>>(RootContext)!;

const system = computed(() => context.data.item.systemData);
</script>

<template>
	<BasicItemSheet show-effects-tab has-decoration>
		<template v-slot:decoration>
			<div class="talent-tier">{{ system.tier }}</div>
		</template>

		<template v-slot:data>
			<section class="data-grid">
				<div class="row">
					<label><Localized label="Genesys.Labels.Tier" /></label>
					<input type="number" name="system.tier" :value="system.tier" :min="1" :max="5" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Activation" /></label>
					<div class="activation-field">
						<select name="system.activation.type" :value="system.activation.type">
							<option value="active"><Localized label="Genesys.Labels.Active" /></option>
							<option value="passive"><Localized label="Genesys.Labels.Passive" /></option>
						</select>

						<input type="text" name="system.activation.detail" :value="system.activation.detail" />
					</div>
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Ranked" /></label>
					<select name="system.ranked" :value="system.ranked">
						<option value="yes"><Localized label="Genesys.Labels.Yes" /></option>
						<option value="no"><Localized label="Genesys.Labels.No" /></option>
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

<style lang="scss" scoped>
@use '@scss/vars/colors.scss';

.activation-field {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.25em;
}

.talent-tier {
	display: flex;
	align-items: center;
	justify-content: center;
	aspect-ratio: 1;
	height: 100%;
	border-radius: 50%;
	border: 1px dashed colors.$gold;
	font-family: 'Roboto Slab', sans-serif;
	font-size: 2em;
	margin-right: 1em;
}
</style>
