<script lang="ts" setup>
import { computed, inject, onBeforeMount, onBeforeUpdate, ref, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import Characteristic from '@/vue/components/character/Characteristic.vue';
import Localized from '@/vue/components/Localized.vue';
import EffectsView from '@/vue/views/EffectsView.vue';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';
import Editor from '@/vue/components/Editor.vue';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';
import TalentDataModel from '@/item/data/TalentDataModel';
import AbilityDataModel from '@/item/data/AbilityDataModel';
import EquipmentDataModel from '@/item/data/EquipmentDataModel';
import { EQUIPMENT_TYPES } from '@/actor/data/CharacterDataModel';
import SkillRanks from '@/vue/components/character/SkillRanks.vue';
import DicePrompt, { RollType } from '@/app/DicePrompt';
import ContextMenu from '@/vue/components/ContextMenu.vue';
import MenuItem from '@/vue/components/MenuItem.vue';
import Enriched from '@/vue/components/Enriched.vue';
import WeaponDataModel from '@/item/data/WeaponDataModel';

const context = inject<ActorSheetContext<AdversaryDataModel>>(RootContext)!;
const actor = computed(() => toRaw(context.data.actor));
const system = computed(() => toRaw(context.data.actor).systemData);

const skills = computed(() => actor.value.items.filter((i) => i.type === 'skill') as GenesysItem<SkillDataModel>[]);
const talents = computed(() => actor.value.items.filter((i) => i.type === 'talent') as GenesysItem<TalentDataModel>[]);
const abilities = computed(() => actor.value.items.filter((i) => i.type === 'ability') as GenesysItem<AbilityDataModel>[]);
const equipment = computed(() => actor.value.items.filter((i) => EQUIPMENT_TYPES.includes(i.type)) as GenesysItem<EquipmentDataModel>[]);

const effects = ref<any>([]);

const editLabel = game.i18n.localize('Genesys.Labels.Edit');
const deleteLabel = game.i18n.localize('Genesys.Labels.Delete');
const rankUpLabel = game.i18n.localize('Genesys.Labels.RankUp');
const rankDownLabel = game.i18n.localize('Genesys.Labels.RankDown');

async function addEffect(category: string) {
	await toRaw(context.sheet.actor).createEmbeddedDocuments('ActiveEffect', [
		{
			label: context.data.actor.name,
			icon: 'icons/svg/aura.svg',
			disabled: category === 'suppressed',
			duration: category === 'temporary' ? { rounds: 1 } : undefined,
		},
	]);
}

function updateEffects() {
	effects.value = [...toRaw(context.data.actor).effects];
}

async function rollSkill(skill: GenesysItem<SkillDataModel>) {
	await DicePrompt.promptForRoll(toRaw(context.data.actor), skill.id);
}

async function rollAttack(weapon: GenesysItem) {
	if (weapon.type !== 'weapon') {
		return;
	}

	await DicePrompt.promptForRoll(toRaw(context.data.actor), skillForWeapon(weapon)[1], { rollType: RollType.Attack, rollData: { weapon } });
}

async function editItem(item: GenesysItem) {
	await toRaw(item).sheet.render(true);
}

async function deleteItem(item: GenesysItem) {
	await toRaw(item).delete();
}

async function adjustTalentOrSkillRank(item: GenesysItem<TalentDataModel> | GenesysItem<SkillDataModel>, adjustment: number) {
	// Talents should be deleted if rank is reduced to 0.
	if (item.systemData.rank + adjustment === 0 && item.type === 'talent') {
		await toRaw(item).delete();
	} else {
		await toRaw(item).update({
			'system.rank': Math.max(0, item.systemData.rank + adjustment),
		});
	}
}

function skillForWeapon(weapon: GenesysItem): [name: string, id: string] {
	if ((weapon.systemData as WeaponDataModel).skills.length === 0) {
		return ['Unskilled', '-'];
	}

	const validSkillNames = (weapon.systemData as WeaponDataModel).skills.map((s) => s.toLowerCase());

	// Does the Adversary have one of these skills?
	const possessedSkill = toRaw(context.data.actor).items.find((i) => i.type === 'skill' && validSkillNames.includes(i.name.toLowerCase()));

	if (possessedSkill) {
		return [possessedSkill.name, possessedSkill.id];
	} else {
		return [(weapon.systemData as WeaponDataModel).skills[0], '-'];
	}
}

function damageForWeapon(weapon: GenesysItem): number {
	const weaponData = weapon.system as WeaponDataModel;

	if (weaponData.damageCharacteristic === '-') {
		return weaponData.baseDamage;
	}

	return weaponData.baseDamage + system.value.characteristics[weaponData.damageCharacteristic];
}

onBeforeMount(updateEffects);
onBeforeUpdate(updateEffects);
</script>

<template>
	<div class="adversary-sheet">
		<header>
			<img :src="context.data.actor.img" :alt="context.data.actor.name" data-edit="img" />
			<input type="text" name="name" :value="context.data.actor.name" />
		</header>

		<nav class="sheet-tabs" data-group="primary">
			<div class="spacer"></div>

			<a class="item" data-tab="stats"><Localized label="Genesys.Tabs.Data" /></a>
			<a class="item" data-tab="effects"><Localized label="Genesys.Tabs.Effects" /></a>

			<div class="spacer"></div>
		</nav>

		<section class="sheet-body">
			<div class="tab" data-tab="stats">
				<section class="stats-tab">
					<div :class="`description ${system.description.trim() === '' ? 'empty' : ''}`">
						<Editor name="system.description" :content="system.description" button />
					</div>

					<div class="characteristics-container">
						<div class="characteristics-row">
							<Characteristic label="Genesys.Characteristics.Brawn" :value="system.characteristics.brawn" name="system.characteristics.brawn" can-edit />
							<Characteristic label="Genesys.Characteristics.Agility" :value="system.characteristics.agility" name="system.characteristics.agility" can-edit />
							<Characteristic label="Genesys.Characteristics.Intellect" :value="system.characteristics.intellect" name="system.characteristics.intellect" can-edit />
							<Characteristic label="Genesys.Characteristics.Cunning" :value="system.characteristics.cunning" name="system.characteristics.cunning" can-edit />
							<Characteristic label="Genesys.Characteristics.Willpower" :value="system.characteristics.willpower" name="system.characteristics.willpower" can-edit />
							<Characteristic label="Genesys.Characteristics.Presence" :value="system.characteristics.presence" name="system.characteristics.presence" can-edit />
						</div>
					</div>

					<div class="stats-row">
						<slot name="stats">Stats Row Not Populated</slot>
					</div>

					<div class="adversary-items">
						<slot name="skills">
							<span class="header"><Localized label="Genesys.Adversary.Skills" />:</span>
							<div class="container">
								<Localized v-if="skills.length === 0" label="Genesys.Adversary.None" />
								<ContextMenu v-for="skill in skills" :key="skill.id" class="skill">
									<template v-slot:menu-items>
										<MenuItem @click="adjustTalentOrSkillRank(skill, 1)">
											<template v-slot:icon><i class="fas fa-circle-up"></i></template>
											{{ rankUpLabel }}
										</MenuItem>

										<MenuItem @click="adjustTalentOrSkillRank(skill, -1)">
											<template v-slot:icon><i class="fas fa-circle-down"></i></template>
											{{ rankDownLabel }}
										</MenuItem>

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
										<span>{{ skill.name }} {{ skill.systemData.rank }}</span>
										<SkillRanks :skill-value="skill.systemData.rank" :characteristic-value="system.characteristics[skill.systemData.characteristic]" />
									</a>
								</ContextMenu>
							</div>
						</slot>
					</div>

					<div class="adversary-items">
						<span class="header"><Localized label="Genesys.Adversary.Talents" />:</span>
						<div class="container">
							<Localized v-if="talents.length === 0" label="Genesys.Adversary.None" />
							<div v-for="talent in talents" :key="talent.id" class="talent">
								<ContextMenu :disable-menu="!context.data.editable">
									<template v-slot:menu-items>
										<MenuItem @click="adjustTalentOrSkillRank(talent, 1)">
											<template v-slot:icon><i class="fas fa-circle-up"></i></template>
											{{ rankUpLabel }}
										</MenuItem>

										<MenuItem @click="adjustTalentOrSkillRank(talent, -1)">
											<template v-slot:icon><i class="fas fa-circle-down"></i></template>
											{{ rankDownLabel }}
										</MenuItem>

										<MenuItem @click="editItem(talent)">
											<template v-slot:icon><i class="fas fa-edit"></i></template>
											{{ editLabel }}
										</MenuItem>

										<MenuItem @click="deleteItem(talent)">
											<template v-slot:icon><i class="fas fa-trash"></i></template>
											{{ deleteLabel }}
										</MenuItem>
									</template>

									<label
										><a @click="editItem(talent)">{{ talent.name }} {{ talent.systemData.ranked === 'yes' ? talent.systemData.rank : null }}</a></label
									>
								</ContextMenu>
								<Enriched class="description" v-if="talent.systemData.description" :value="talent.systemData.description" />
							</div>
						</div>
					</div>

					<div class="adversary-items">
						<span class="header"><Localized label="Genesys.Adversary.Abilities" />:</span>
						<div class="container">
							<Localized v-if="abilities.length === 0" label="Genesys.Adversary.None" />
							<div v-for="ability in abilities" :key="ability.id" class="talent">
								<ContextMenu :disable-menu="!context.data.editable">
									<template v-slot:menu-items>
										<MenuItem @click="deleteItem(ability)">
											<template v-slot:icon><i class="fas fa-trash"></i></template>
											{{ deleteLabel }}
										</MenuItem>
									</template>

									<label
										><a @click="editItem(ability)">{{ ability.name }}</a></label
									>
								</ContextMenu>
								<Enriched class="description" v-if="ability.systemData.description" :value="ability.systemData.description" />
							</div>
						</div>
					</div>

					<div class="adversary-items">
						<span class="header"><Localized label="Genesys.Adversary.Equipment" />:</span>
						<div class="container">
							<Localized v-if="equipment.length === 0" label="Genesys.Adversary.None" />
							<ContextMenu v-for="item in equipment.filter((i) => i.type === 'weapon')" :key="item.id" class="weapon">
								<template v-slot:menu-items>
									<MenuItem @click="editItem(item)">
										<template v-slot:icon><i class="fas fa-edit"></i></template>
										{{ editLabel }}
									</MenuItem>

									<MenuItem @click="deleteItem(item)" v-if="context.data.editable">
										<template v-slot:icon><i class="fas fa-trash"></i></template>
										{{ deleteLabel }}
									</MenuItem>
								</template>

								<a @click="rollAttack(item)">
									<i class="far fa-dice-d10"></i>
									{{ item.name }}
									(<span class="weapon-details">
										<span>{{ skillForWeapon(item)[0] }}</span>
										<span>Damage {{ damageForWeapon(item) }}</span>
										<span>Critical {{ item.system.critical }}</span>
										<span>Range [<Localized :label="`Genesys.Range.${item.system.range.capitalize()}`" />]</span>
										<span v-if="item.system.qualities.length > 0" class="weapon-qualities">
											<span v-for="quality in item.system.qualities" :key="quality.name">{{ quality.name }}{{ quality.isRated ? ` ${quality.rating}` : null }}</span>
										</span> </span
									>)
								</a>
							</ContextMenu>
							<ContextMenu v-for="item in equipment.filter((i) => i.type !== 'weapon')" :key="item.id" class="inventory-item" :disable-menu="!context.data.editable">
								<template v-slot:menu-items>
									<MenuItem @click="deleteItem(item)">
										<template v-slot:icon><i class="fas fa-trash"></i></template>
										{{ deleteLabel }}
									</MenuItem>
								</template>

								<a @click="editItem(item)">
									{{ item.name }}

									<span v-if="item.type === 'armor'" style="padding-right: 0.2em"> (+{{ item.system.soak }} <Localized label="Genesys.Labels.Soak" />) </span>

									<i v-if="item.type !== 'weapon'" class="fas fa-arrow-up-right-from-square"></i>
								</a>
							</ContextMenu>
						</div>
					</div>
				</section>
			</div>

			<div class="tab" data-tab="effects">
				<EffectsView :effects="[...effects]" @add-effect="addEffect" />
			</div>
		</section>
	</div>
</template>

<style lang="scss">
@use '@scss/mixins/reset.scss';
@use '@scss/vars/colors.scss';

.adversary-sheet {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;

	.stats-tab {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		gap: 0.5em;
	}

	.description {
		display: grid;
		grid-template-rows: 1fr;
		min-height: 2rem;

		&.empty {
			min-height: 200px;
		}
	}

	.adversary-items {
		width: 100%;
		display: flex;
		flex-direction: column;

		.header {
			font-family: 'Bebas Neue', sans-serif;
			font-size: 1.25em;
			color: colors.$blue;
		}
	}

	header {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem;
		align-items: center;

		img {
			border: 1px solid colors.$gold;
			background: transparentize(colors.$gold, 0.5);
			border-radius: 1em;
			height: 2.5rem;
		}

		@include reset.input;
		input {
			width: 100%;
			font-family: 'Bebas Neue', sans-serif;
			font-size: 2rem;
			color: colors.$blue;

			&,
			&:focus {
				border-bottom: 1px solid colors.$dark-blue;
			}
		}
	}

	.stats-row {
		display: flex;
		gap: 1em;
		align-items: center;
		justify-content: space-around;
	}

	.characteristics-container {
		display: grid;
		grid-template-columns: 1fr auto 1fr;

		.characteristics-row {
			grid-column: 2 / span 1;
		}
	}

	.characteristics-row {
		position: relative;
		display: flex;
		justify-content: center;
		gap: 3em;
		align-items: center;
		padding-bottom: 0.25rem;

		&::after {
			display: block;
			content: '';
			position: absolute;
			top: 0;
			left: -1.5rem;
			width: calc(100% + 3rem);
			height: 100%;
			background: colors.$gold;
			border-radius: 4rem;

			clip-path: polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%);
		}

		.characteristic-field {
			z-index: 1;
		}
	}

	.container {
		padding-left: 1em;
	}

	.skill {
		display: inline-block;

		& > a {
			display: inline-flex;
			flex-direction: row;
			flex-wrap: nowrap;
			align-items: center;
			gap: 0.5em;
		}

		& > a::after {
			display: block;
			content: ',';
			margin-right: 0.25em;
			margin-left: -0.4em;
		}

		&:last-of-type > a::after {
			display: none;
		}
	}

	.inventory-item {
		display: inline-flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		gap: 0.5em;

		&::after {
			display: block;
			content: ',';
			margin-right: 0.25em;
			margin-left: -0.4em;
		}

		&:last-of-type::after {
			display: none;
		}
	}

	.weapon-qualities span {
		&::after {
			display: inline;
			content: ',';
			margin-right: 0.25em;
		}

		&:last-of-type::after {
			display: none;
		}
	}

	.weapon-details > span {
		&::after {
			display: inline;
			content: ';';
			margin-right: 0.25em;
		}

		&:last-of-type::after {
			display: none;
		}
	}

	.talent {
		display: grid;
		grid-template-rows: repeat(2, auto);

		label {
			font-weight: bold;
		}

		.description {
			border-left: 2px solid colors.$light-blue;
			padding-left: 0.5em;
			font-size: 0.9em;
		}
	}
}
</style>
