<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';

import { ItemSheetContext, RootContext } from '@/vue/SheetContext';
import BasicItemSheet from '@/vue/sheets/item/BasicItemSheet.vue';
import Localized from '@/vue/components/Localized.vue';
import ArmorDataModel from '@/item/data/ArmorDataModel';

const context = inject<ItemSheetContext<ArmorDataModel>>(RootContext)!;

const system = computed(() => context.data.item.systemData);

async function deleteQuality(index: number) {
	const updatedQualities = [...system.value.qualities];
	updatedQualities.splice(index, 1);

	await toRaw(context.data.item).update({
		'system.qualities': updatedQualities,
	});
}

async function updateQualityRating(index: number, event: Event) {
	const value = parseInt((event.target as HTMLInputElement).value);

	if (isNaN(value)) {
		return;
	} else if (value <= 0) {
		return deleteQuality(index);
	} else if (system.value.qualities[index].rating !== value) {
		const qualities = system.value.qualities;
		qualities[index].rating = value;

		await toRaw(context.data.item).update({
			'system.qualities': qualities,
		});
	}
}
</script>

<template>
	<BasicItemSheet show-effects-tab>
		<template v-slot:data>
			<section class="data-grid">
				<div class="row">
					<label><Localized label="Genesys.Labels.Defense" /></label>
					<input type="number" name="system.defense" :value="system.defense" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Soak" /></label>
					<input type="number" name="system.soak" :value="system.soak" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Encumbrance" /></label>
					<input type="number" name="system.encumbrance" :value="system.encumbrance" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Price" /></label>
					<input type="number" name="system.price" :value="system.price" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Rarity" /></label>
					<input type="number" name="system.rarity" :value="system.rarity" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Source" /></label>
					<input type="text" name="system.source" :value="system.source" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Qualities" /></label>
					<div>
						<div v-for="(quality, index) in system.qualities" :key="index" class="data-rated">
							<div>{{ quality.name }}</div>
							<div>
								<span v-if="quality.isRated"><input type="text" :value="quality.rating" @blur="updateQualityRating(index, $event)" /></span>
							</div>
							<a @click="deleteQuality(index)"><i class="fas fa-trash"></i></a>
						</div>
					</div>
				</div>
			</section>
		</template>
	</BasicItemSheet>
</template>

<style lang="scss" scoped>
@use '@scss/vars/colors.scss';

.data-rated {
	display: grid;
	grid-template-columns: /* Name */ 2fr /* Rating */ 1fr /* Delete Button */ auto;
	align-items: center;
	border-bottom: 1px dashed colors.$blue;
	padding: 2px;

	&:last-child {
		border-bottom: none;
	}

	a {
		margin-left: 1rem;
	}
}
</style>
