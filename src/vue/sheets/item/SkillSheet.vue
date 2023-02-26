<script lang="ts" setup>
import { computed, inject } from 'vue';

import { ItemSheetContext, RootContext } from '@/vue/SheetContext';
import BasicItemSheet from '@/vue/sheets/item/BasicItemSheet.vue';
import Localized from '@/vue/components/Localized.vue';
import SkillDataModel from '@/item/data/SkillDataModel';
import Tooltip from '@/vue/components/Tooltip.vue';

const context = inject<ItemSheetContext<SkillDataModel>>(RootContext)!;

const system = computed(() => context.data.item.systemData);
</script>

<template>
	<BasicItemSheet show-effects-tab>
		<template v-slot:data>
			<section class="data-grid">
				<div class="row">
					<label><Localized label="Genesys.Labels.Characteristic" /></label>
					<select name="system.characteristic" :value="system.characteristic">
						<option value="brawn"><Localized label="Genesys.Characteristics.Brawn" /></option>
						<option value="agility"><Localized label="Genesys.Characteristics.Agility" /></option>
						<option value="intellect"><Localized label="Genesys.Characteristics.Intellect" /></option>
						<option value="cunning"><Localized label="Genesys.Characteristics.Cunning" /></option>
						<option value="willpower"><Localized label="Genesys.Characteristics.Willpower" /></option>
						<option value="presence"><Localized label="Genesys.Characteristics.Presence" /></option>
					</select>
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Category" /></label>
					<select name="system.category" :value="system.category">
						<option value="general"><Localized label="Genesys.SkillCategory.General" /></option>
						<option value="magic"><Localized label="Genesys.SkillCategory.Magic" /></option>
						<option value="combat"><Localized label="Genesys.SkillCategory.Combat" /></option>
						<option value="social"><Localized label="Genesys.SkillCategory.Social" /></option>
						<option value="knowledge"><Localized label="Genesys.SkillCategory.Knowledge" /></option>
					</select>
				</div>

				<div class="row">
					<label>
						<Tooltip content="Genesys.Tooltips.IsInitiative" localized><Localized label="Genesys.Labels.IsInitiative" /></Tooltip>
					</label>
					<input type="checkbox" name="system.initiative" :checked="system.initiative" />
				</div>

				<div class="row">
					<label><Localized label="Genesys.Labels.Source" /></label>
					<input type="text" name="system.source" :value="system.source" />
				</div>
			</section>
		</template>
	</BasicItemSheet>
</template>
