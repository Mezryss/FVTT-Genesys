<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';

import GenesysItem from '@/item/GenesysItem';
import GenesysActor from '@/actor/GenesysActor';
import InjuryDataModel from '@/item/data/InjuryDataModel';
import SkillDataModel from '@/item/data/SkillDataModel';
import DicePrompt, { RollType } from '@/app/DicePrompt';
import VehicleDataModel from '@/actor/data/VehicleDataModel';
import { EquipmentState } from '@/item/data/EquipmentDataModel';
import VehicleWeaponDataModel from '@/item/data/VehicleWeaponDataModel';

import Localized from '@/vue/components/Localized.vue';
import Enriched from '@/vue/components/Enriched.vue';
import Tooltip from '@/vue/components/Tooltip.vue';

import SelectCharacterSkillPrompt, { CharacterSkillOption } from '@/app/SelectCharacterSkillPrompt';

import { NAMESPACE as SETTINGS_NAMESPACE } from '@/settings';
import { KEY_SKILL_FOR_REPAIRING_VEHICLE_HITS } from '@/settings/campaign';

const rootContext = inject<ActorSheetContext<VehicleDataModel>>(RootContext)!;

const actor = computed(() => toRaw(rootContext.data.actor));
const weapons = computed(() => actor.value.items.filter((i) => i.type === 'vehicleWeapon' && i.system.state === EquipmentState.Equipped) as GenesysItem<VehicleWeaponDataModel>[]);
const criticalHits = computed(() => actor.value.items.filter((i) => i.type === 'injury') as GenesysItem<InjuryDataModel>[]);

const SEVERITY_TO_DIFFICULTY: Record<InjuryDataModel['severity'], number> = {
	'-': 0,
	easy: 1,
	average: 2,
	hard: 3,
	daunting: 4,
};

function getFiringArcLabels(weapon: GenesysItem<VehicleWeaponDataModel>) {
	const possibleDirections = Object.entries(weapon.systemData.firingArc);
	const firingArc = possibleDirections.filter(([_arc, canFire]) => canFire);

	if (possibleDirections.length == firingArc.length) {
		return [game.i18n.localize('Genesys.FiringArc.All')];
	} else if (firingArc.length === 0) {
		return [game.i18n.localize('Genesys.FiringArc.None')];
	} else {
		return firingArc.map(([arc, _canFire]) => game.i18n.localize(`Genesys.FiringArc.${arc.capitalize()}`));
	}
}

async function openItem(item: GenesysItem) {
	await item.sheet?.render(true);
}

async function deleteItem(item: GenesysItem) {
	await item.delete();
}

async function pickAttackerAndRollAttack(weapon: GenesysItem<VehicleWeaponDataModel>) {
	const relevantRoles = actor.value.systemData.roles.filter((role) => role.skills.some((skill) => weapon.systemData.skills.includes(skill)));
	const potentialAttackers = relevantRoles.reduce((accum, role) => {
		for (const member of role.members) {
			const currentActor = game.actors.get(member) as GenesysActor | undefined;
			const potentialSkills = currentActor?.items.filter((item) => item.type === 'skill' && weapon.systemData.skills.includes(item.name) && role.skills.includes(item.name)) ?? [];
			potentialSkills.forEach((skillItem) => accum.push({ actor: currentActor!, skill: skillItem as GenesysItem<SkillDataModel> }));
		}
		return accum;
	}, [] as CharacterSkillOption[]);

	if (potentialAttackers.length === 0) {
		return;
	}

	const selectAttacker = await SelectCharacterSkillPrompt.promptFromCharactersList(potentialAttackers);
	if (!selectAttacker) {
		return;
	}

	await DicePrompt.promptForRoll(selectAttacker.actor, selectAttacker.skill.id, {
		rollType: RollType.Attack,
		rollData: { weapon },
	});
}

async function repairHit(criticalHit: GenesysItem<InjuryDataModel>) {
	const skillNameForRepairing = game.settings.get(SETTINGS_NAMESPACE, KEY_SKILL_FOR_REPAIRING_VEHICLE_HITS) as string;
	const relevantRoles = actor.value.systemData.roles.filter((role) => role.skills.includes(skillNameForRepairing));
	const potentialRepairer = relevantRoles.reduce((accum, role) => {
		for (const member of role.members) {
			const currentActor = game.actors.get(member) as GenesysActor | undefined;
			const potentialSkill = currentActor?.items.find((item) => item.type === 'skill' && item.name === skillNameForRepairing);
			if (potentialSkill) {
				accum.push({ actor: currentActor!, skill: potentialSkill as GenesysItem<SkillDataModel> });
			}
		}
		return accum;
	}, [] as CharacterSkillOption[]);

	if (potentialRepairer.length === 0) {
		return;
	}

	const selectRepairer = await SelectCharacterSkillPrompt.promptFromCharactersList(potentialRepairer);
	if (!selectRepairer) {
		return;
	}

	await DicePrompt.promptForRoll(selectRepairer.actor, selectRepairer.skill.id, {
		startingDifficulty: SEVERITY_TO_DIFFICULTY[criticalHit.systemData.severity],
	});
}
</script>

<template>
	<section class="tab-combat">
		<div class="block">
			<div class="header"><Localized label="Genesys.Labels.Attacks" /></div>
			<div class="weapons">
				<div class="weapon header">
					<div class="name"><Localized label="Genesys.Labels.Name" /></div>
					<div class="skill"><Localized label="Genesys.Labels.Skill" /></div>
					<div class="damage"><Localized label="Genesys.Labels.Damage" /></div>
					<div class="crit"><Localized label="Genesys.Labels.Crit" /></div>
					<div class="range"><Localized label="Genesys.Labels.Range" /></div>
					<div class="firing-arc"><Localized label="Genesys.Labels.FiringArc" /></div>
				</div>

				<div v-for="weapon in weapons" :key="weapon.id" class="weapon">
					<img :src="weapon.img" :alt="weapon.name" />

					<div class="name">
						<a @click="pickAttackerAndRollAttack(weapon)">{{ weapon.name }}</a>
					</div>

					<div class="skill" v-if="weapon.systemData.skills.length > 0">
						{{ weapon.systemData.skills.join(', ') }}
					</div>
					<div class="skill" v-else><Localized label="Genesys.Labels.SkillNotFound" /></div>

					<div class="damage">{{ weapon.systemData.baseDamage }}</div>

					<div class="crit">{{ weapon.systemData.critical }}</div>

					<div class="range"><Localized :label="`Genesys.Range.${weapon.systemData.range.capitalize()}`" /></div>

					<div class="firing-arc">
						<span v-for="arc in getFiringArcLabels(weapon)" :key="arc">{{ arc }}</span>
					</div>

					<div class="qualities" v-if="weapon.systemData.qualities.length > 0">
						<Tooltip v-for="quality in weapon.systemData.qualities" :key="quality.name" :content="quality.description">
							<div class="quality">
								{{ quality.name }} <template v-if="quality.isRated">{{ quality.rating }}</template>
							</div>
						</Tooltip>
					</div>
				</div>
			</div>
		</div>

		<div class="block">
			<div class="header"><Localized label="Genesys.Labels.CriticalHits" /></div>
			<div class="critical-hits">
				<div class="critical-hit header">
					<div><Localized label="Genesys.Labels.Severity" /></div>
					<div><Localized label="Genesys.Labels.Hit" /></div>
				</div>

				<div v-for="criticalHit in criticalHits" :key="criticalHit.id" class="critical-hit">
					<div class="severity">
						<a @click="repairHit(criticalHit)">
							<template v-if="criticalHit.systemData.severity === 'easy'">D</template>
							<template v-if="criticalHit.systemData.severity === 'average'">DD</template>
							<template v-if="criticalHit.systemData.severity === 'hard'">DDD</template>
							<template v-if="criticalHit.systemData.severity === 'daunting'">DDDD</template>
						</a>
					</div>
					<div class="name">
						<a @click="openItem(criticalHit)">{{ criticalHit.name }}</a>
					</div>
					<div v-if="rootContext.data.editable" class="actions">
						<a @click="openItem(criticalHit)"><i class="fas fa-edit"></i></a>
						<a @click="deleteItem(criticalHit)"><i class="fas fa-trash"></i></a>
					</div>
					<div v-else />
					<div class="description"><Enriched :value="criticalHit.systemData.description" /></div>
				</div>
			</div>
		</div>
	</section>
</template>

<style lang="scss">
@use '@scss/vars/colors.scss';

.tab-combat {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	gap: 0.5em;
	padding: 0.5em;

	.weapon {
		display: grid;
		grid-template-rows: auto auto;
		grid-template-columns: 1.5rem 2fr 1fr repeat(4, 80px);
		border-bottom: 1px dashed colors.$blue;
		align-items: center;
		justify-items: center;

		& > .header {
			grid-template-rows: auto;
		}

		.name {
			justify-self: left;
		}

		&:not(.header) {
			grid-template-rows: auto auto;

			& > .name {
				font-family: 'Roboto Serif', serif;
			}
		}

		&.header > .name {
			grid-column: 1 / span 2;
		}

		&:last-child {
			border-bottom: none;
		}

		.firing-arc {
			text-align: center;

			& > span {
				display: inline-flex;
				flex-direction: row;
				flex-wrap: nowrap;
				gap: 0.5em;

				&::after {
					content: ',';
					margin-right: 0.25em;
					margin-left: -0.4em;
				}

				&:last-of-type::after {
					display: none;
				}
			}
		}

		.description {
			grid-column: 1 / span all;
			justify-self: left;
			border-left: 4px solid colors.$light-blue;
			margin-left: 0.5em;
			padding-left: 0.5em;

			grid-row: 2 / span 1;
			max-height: 0;
			transition: max-height 0.5s ease-in-out;
			overflow: hidden;
			padding-right: 0.5em;

			&.active {
				max-height: 200px;
			}
		}

		.qualities {
			grid-column: 1 / span all;
			grid-row: 2 / span 1;
		}
	}

	.qualities {
		justify-self: left;
		padding-left: 1em;

		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 0.25em;

		.quality {
			background: transparentize(colors.$gold, 0.7);
			border: 1px dashed colors.$gold;
			border-radius: 0.25em;
			padding: 0.25em;
			font-family: 'Bebas Neue', sans-serif;
		}
	}

	.skill {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		white-space: nowrap;
		gap: 0.25em;
	}

	.block {
		background: transparentize(colors.$light-blue, 0.8);
		padding: 0.5em;
		border-radius: 0.5em;

		.header {
			font-family: 'Bebas Neue', sans-serif;
		}

		& > .header {
			font-size: 1.25em;
		}

		img {
			border: none;
			padding: 2px;
			border-radius: 0.25rem;
		}

		.critical-hits {
			display: flex;
			flex-direction: column;
			flex-wrap: nowrap;
			padding: 0.25em;

			.severity {
				font-family: 'Genesys Symbols', sans-serif;
				font-size: 1.25em;
				color: colors.$die-difficulty;
				-webkit-text-stroke: 1px black;
				text-stroke: 1px black;
				letter-spacing: -2px;
				position: relative;
				top: 0.25em;
			}

			.critical-hit {
				display: grid;
				grid-template-columns: /* Severity */ 70px /* Name */ 1fr /* Actions */ auto;
				grid-template-rows: auto auto;
				align-items: center;
				border-bottom: 1px dashed colors.$blue;
				column-gap: 0.5em;

				.name {
					font-family: 'Roboto Serif', serif;
				}

				&:last-child {
					border-bottom: none;
				}

				.description {
					grid-column: 1 / span all;
					justify-self: left;
					border-left: 4px solid colors.$light-blue;
					margin-left: 1em;
					padding-left: 0.5em;

					grid-row: 2 / span 1;
					max-height: 0;
					transition: max-height 0.5s ease-in-out;
					overflow: hidden;
					padding-right: 0.5em;

					&.active {
						max-height: 200px;
					}
				}
			}
		}
	}

	.actions {
		display: flex;
		gap: 0.25em;
	}
}
</style>