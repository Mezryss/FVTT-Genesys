<script lang="ts" setup>
import AdversarySheet from '@/vue/sheets/actor/AdversarySheet.vue';
import { computed, inject, toRaw } from 'vue';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import DicePrompt from '@/app/DicePrompt';
import Localized from '@/vue/components/Localized.vue';
import ContextMenu from '@/vue/components/ContextMenu.vue';
import MenuItem from '@/vue/components/MenuItem.vue';
import SkillRanks from '@/vue/components/character/SkillRanks.vue';
import CombatStat from '@/vue/components/character/CombatStat.vue';
import MinionDataModel from '@/actor/data/MinionDataModel';

const context = inject<ActorSheetContext<MinionDataModel>>(RootContext)!;
const actor = computed(() => toRaw(context.data.actor));
const system = computed(() => toRaw(context.data.actor).systemData);

const skills = computed(() => toRaw(context.data.actor).items.filter((i) => i.type === 'skill') as GenesysItem<SkillDataModel>[]);

const isIndependent = actor.value.getFlag<boolean>('genesys', 'independentMinion');
const editLabel = game.i18n.localize('Genesys.Labels.Edit');
const deleteLabel = game.i18n.localize('Genesys.Labels.Delete');

async function rollSkill(skill: GenesysItem<SkillDataModel>) {
	await DicePrompt.promptForRoll(toRaw(context.data.actor), skill.name);
}

async function editItem(item: GenesysItem) {
	await toRaw(item).sheet.render(true);
}

async function deleteItem(item: GenesysItem) {
	await toRaw(item).delete();
}
</script>

<template>
	<AdversarySheet>
		<template v-slot:stats>
			<CombatStat
				v-if="actor.isToken || isIndependent"
				label="Genesys.Labels.GroupSize"
				primary-label="Genesys.Adversary.Base"
				name="system.groupSize"
				:value="system.groupSize"
				has-secondary
				secondary-read-only
				secondary-label="Genesys.Adversary.Remaining"
				:secondary-value="system.remainingMembers"
				edit-primary
			/>

			<CombatStat v-else label="Genesys.Labels.GroupSize" name="system.groupSize" :value="system.groupSize" edit-primary />

			<CombatStat label="Genesys.Labels.Soak" name="system.soak" :value="system.soak" edit-primary />

			<CombatStat
				v-if="actor.isToken || isIndependent"
				label="Genesys.Labels.Wounds"
				primary-label="Genesys.Labels.Threshold"
				:value="system.groupWoundThreshold"
				has-secondary
				secondary-label="Genesys.Labels.Current"
				secondary-name="system.wounds.value"
				:secondary-value="system.wounds.value"
			/>

			<CombatStat v-else label="Genesys.Labels.WoundThreshold" name="system.wounds.threshold" :value="system.wounds.threshold" edit-primary />

			<CombatStat
				label="Genesys.Labels.Defense"
				primary-label="Genesys.Labels.DefenseRanged"
				:value="system.defense.ranged"
				name="system.defense.ranged"
				has-secondary
				secondary-name="system.defense.melee"
				secondary-label="Genesys.Labels.DefenseMelee"
				:secondary-value="system.defense.melee"
				edit-primary
			/>
		</template>

		<template v-slot:skills>
			<span class="header"><Localized label="Genesys.Adversary.MinionSkills" />:</span>
			<div class="container">
				<Localized v-if="skills.length === 0" label="Genesys.Adversary.None" />
				<ContextMenu v-for="skill in skills" :key="skill.id" class="skill">
					<template v-slot:menu-items>
						<MenuItem @click="editItem(skill)">
							<template v-slot:icon><i class="fas fa-edit"></i></template>
							{{ editLabel }}
						</MenuItem>

						<MenuItem @click="deleteItem(skill)">
							<template v-slot:icon><i class="fas fa-trash"></i></template>
							{{ deleteLabel }}
						</MenuItem>
					</template>

					<a @click="rollSkill(skill)">
						<span>{{ skill.name }}</span>
						<SkillRanks :skill-value="Math.max(0, system.remainingMembers - 1)" :characteristic-value="system.characteristics[skill.systemData.characteristic]" />
					</a>
				</ContextMenu>
			</div>
		</template>
	</AdversarySheet>
</template>
