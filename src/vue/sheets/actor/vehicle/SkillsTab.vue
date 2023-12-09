<script lang="ts" setup>
import VehicleDataModel from '@/actor/data/VehicleDataModel';
import { inject, computed, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import GenesysActor from '@/actor/GenesysActor';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';

import DicePrompt from '@/app/DicePrompt';

import Localized from '@/vue/components/Localized.vue';
import SkillRanks from '@/vue/components/character/SkillRanks.vue';

// The linter believes this is being unused (when in fact it isn't) so we prefix it so it's ignored.
type _NonVehicleDataModel = CharacterDataModel | AdversaryDataModel;

const context = inject<ActorSheetContext<VehicleDataModel>>(RootContext)!;

const dataGroupedByMember = computed(() =>
	toRaw(context.data.actor).systemData.roles.reduce((accum, role) => {
		for (const member of role.members) {
			if (!accum.has(member)) {
				const actor = game.actors.get(member);
				if (!actor) {
					continue;
				}

				accum.set(member, { actor: actor as GenesysActor, roles: [], skills: new Map() });
			}
			const details = accum.get(member)!;

			details.roles.push(role.name);

			for (const skill of role.skills) {
				const skillName = skill.toLowerCase();
				if (!details.skills.has(skillName)) {
					const skillItem = details.actor.items.find((item) => item.type === 'skill' && item.name.toLowerCase() === skillName);

					if (skillItem) {
						details.skills.set(skillName, skillItem as GenesysItem<SkillDataModel>);
					}
				}
			}
		}

		return accum;
	}, new Map<string, { actor: GenesysActor; roles: string[]; skills: Map<string, GenesysItem<SkillDataModel>> }>()),
);

async function rollSkillForActor(actor: GenesysActor, skill: GenesysItem<SkillDataModel>) {
	if (actor.isOwner) {
		await DicePrompt.promptForRoll(actor, skill.id);
	}
}
</script>

<template>
	<section class="tab-skills">
		<div class="skills-container">
			<section v-for="[memberId, details] in dataGroupedByMember" :key="memberId">
				<div class="member-details">
					<img class="member-image" :src="details.actor.img" :alt="details.actor.name" draggable="false" />
					<div class="member-name">{{ details.actor.name }}</div>
					<div class="member-roles"><Localized label="Genesys.Labels.Roles" />: {{ details.roles.join(', ') }}</div>

					<div class="member-skills" v-if="details.skills.size > 0">
						<div class="member-skills-header">
							<span><Localized label="Genesys.Labels.RoleSkills" /></span>
						</div>

						<div class="member-skills-container">
							<div v-for="[skillName, skill] in details.skills" :key="skillName" class="member-skill">
								<img :src="skill.img" :alt="skill.name" />
								<a class="skill-name" @click="rollSkillForActor(details.actor, skill)">
									<span>{{ skill.name }} (<Localized :label="`Genesys.CharacteristicAbbr.${skill.systemData.characteristic.capitalize()}`" />)</span>
								</a>

								<span class="skill-rank">{{ skill.systemData.rank }}</span>
								<SkillRanks :skill-value="skill.systemData.rank" :characteristic-value="(details.actor.systemData as _NonVehicleDataModel).characteristics[skill.systemData.characteristic]" />
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	</section>
</template>

<style lang="scss" scoped>
@use '@scss/vars/colors.scss';

.tab-skills {
	.skills-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5em;

		.member-details {
			display: grid;
			grid-template-rows: auto auto auto 1fr;
			grid-template-columns: 3rem auto;
			background: transparentize(colors.$light-blue, 0.8);
			border-radius: 1em;
			height: 100%;
			gap: 0.5em;
			padding: 0.5rem;

			.member-image {
				grid-row: 1 / span 2;
				grid-column: 1 / span 1;
				border-radius: 0.25em;
			}

			.member-name {
				grid-row: 1 / span 1;
				grid-column: 2 / span 1;

				font-family: 'Roboto Serif', serif;
				font-size: 1.15em;
				display: flex;
				align-items: center;
				gap: 0.25em;
			}

			.member-roles {
				grid-row: 2 / span 1;
				grid-column: 2 / span 1;

				font-family: 'Roboto Serif', serif;
				font-size: 0.9em;
				color: colors.$dark-blue;
				margin-left: 0.5em;
			}

			.member-skills {
				grid-row: 4 / span 1;
				grid-column: 1 / span all;

				.member-skills-header {
					& > span {
						font-family: 'Bebas Neue', sans-serif;
						font-size: 1em;
						color: #6d6e71;
					}
				}

				.member-skills-container {
					border: 1px solid black;

					.member-skill {
						width: 100%;
						display: grid;
						grid-template-columns: /* image */ 1.5rem /* name */ 1fr /* rank */ auto /* Dice Preview */ 80px;
						align-items: center;
						gap: 0.25rem;

						border-bottom: 1px dashed black;
						padding: 1px;

						&:last-of-type {
							border-bottom: none;
						}

						& > * {
							padding: 0.2em;
						}

						img {
							border: none;
							padding: 0;
							margin-left: 0.1em;
						}

						.skill-name {
							text-overflow: ellipsis;
							overflow: hidden;

							span {
								font-family: 'Roboto Slab', serif;
							}
						}

						.skill-rank {
							background: transparentize(white, 0.5);
							border: 1px dashed black;
							border-radius: 0.75rem;
							text-align: center;
							margin: 0.1em 0.1em 0.1em 0.2em;
							min-width: 1.5rem;
							height: 1.5rem;
						}
					}
				}
			}
		}
	}
}
</style>
