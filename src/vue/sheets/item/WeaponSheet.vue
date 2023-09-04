<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';

import { ItemSheetContext, RootContext } from '@/vue/SheetContext';
import BasicItemSheet from '@/vue/sheets/item/BasicItemSheet.vue';
import Localized from '@/vue/components/Localized.vue';
import WeaponDataModel from '@/item/data/WeaponDataModel';
import { Characteristic } from '@/data/Characteristics';

const context = inject<ItemSheetContext<WeaponDataModel>>(RootContext)!;

const system = computed(() => context.data.item.systemData);

async function deleteSkill(index: number) {
	const updatedSkills = [...system.value.skills];
	updatedSkills.splice(index, 1);

	await toRaw(context.data.item).update({
		'system.skills': updatedSkills,
	});
}

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
					<label><Localized label="Genesys.Labels.Damage" /></label>
					<input type="number" name="system.baseDamage" :value="system.baseDamage" />
				</div>

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

				<div class="row">
					<label><Localized label="Genesys.Labels.Critical" /></label>
					<input type="number" name="system.critical" :value="system.critical" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Range" /></label>
					<select name="system.range" :value="system.range">
						<option value="engaged"><Localized label="Genesys.Range.Engaged" /></option>
						<option value="short"><Localized label="Genesys.Range.Short" /></option>
						<option value="medium"><Localized label="Genesys.Range.Medium" /></option>
						<option value="long"><Localized label="Genesys.Range.Long" /></option>
						<option value="extreme"><Localized label="Genesys.Range.Extreme" /></option>
					</select>
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
					<label><Localized label="Genesys.Labels.Skills" /></label>
					<div>
						<div v-for="(skill, index) in system.skills" :key="index" class="data">
							<div>{{ skill }}</div>
							<a @click="deleteSkill(index)"><i class="fas fa-trash"></i></a>
						</div>
					</div>
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

.data {
	display: grid;
	grid-template-columns: /* Name */ 1fr /* Delete Button */ auto;
	align-items: center;
	border-bottom: 1px dashed colors.$blue;
	padding: 2px;

	&:last-child {
		border-bottom: none;
	}
}

.data-rated {
	@extend .data;
	grid-template-columns: /* Name */ 2fr /* Rating */ 1fr /* Delete Button */ auto;

	a {
		margin-left: 1rem;
	}
}
</style>
