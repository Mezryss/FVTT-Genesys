<script lang="ts" setup>
import VehicleDataModel from '@/actor/data/VehicleDataModel';
import { inject, toRaw, ref, watch } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import GenesysActor from '@/actor/GenesysActor';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';

import DicePrompt from '@/app/DicePrompt';
import Localized from '@/vue/components/Localized.vue';
import SkillRanks from '@/vue/components/character/SkillRanks.vue';

type NonVehicleDataModel = CharacterDataModel | AdversaryDataModel;

type GroupedByMemberData = {
	actor: GenesysActor<NonVehicleDataModel>;
	role: string;
	skills: Map<string, GenesysItem<SkillDataModel>>;
};

type GroupedBySkillData = {
	skillName: string;
	skillImage: string;
	actors: Map<
		string,
		{
			actor: GenesysActor<NonVehicleDataModel>;
			skill: GenesysItem<SkillDataModel>;
			role: string;
		}
	>;
};

type GroupingMode = 'member' | 'skill';

const context = inject<ActorSheetContext<VehicleDataModel>>(RootContext)!;

const groupingMode = ref<GroupingMode>('member');
const groupedByMember = ref<Map<string, GroupedByMemberData>>(new Map());
const groupedBySkill = ref<Map<string, GroupedBySkillData>>(new Map());

watch(
	[context.sheet, groupingMode],
	async () => {
		const actorData = toRaw(context.data.actor).systemData;
		const allActorSkills = new Map<string, GroupedByMemberData>();

		for (const role of actorData.roles) {
			for (const skill of role.skills) {
				for (const member of role.members) {
					if (!allActorSkills.has(member)) {
						const targetActor = await fromUuid<GenesysActor<NonVehicleDataModel>>(member);
						if (!targetActor) {
							continue;
						}
						allActorSkills.set(member, { actor: targetActor, role: role.name, skills: new Map() });
					}

					const targetActorSkill = allActorSkills.get(member)!;

					if (!targetActorSkill.skills.has(skill)) {
						const skillItem = targetActorSkill.actor.items.find((item) => item.type === 'skill' && item.name === skill);
						if (skillItem) {
							targetActorSkill.skills.set(skill, skillItem as GenesysItem<SkillDataModel>);
						} else {
							const backupSkill = CONFIG.genesys.skills.find((aSkill) => aSkill.name === skill);
							if (backupSkill) {
								targetActorSkill.skills.set(skill, backupSkill);
							} else {
								continue;
							}
						}
					}
				}
			}
		}

		if (groupingMode.value === 'member') {
			groupedByMember.value = allActorSkills;
		} else if (groupingMode.value === 'skill') {
			const groupedBySkillData = new Map<string, GroupedBySkillData>();
			for (const role of actorData.roles) {
				for (const skill of role.skills) {
					if (!groupedBySkillData.has(skill)) {
						const targetSkill = CONFIG.genesys.skills.find((skillItem) => skillItem.name === skill);
						if (!targetSkill) {
							continue;
						}

						groupedBySkillData.set(skill, {
							skillName: skill,
							skillImage: targetSkill.img,
							actors: new Map(),
						});
					}
					const skillUsers = groupedBySkillData.get(skill)!;

					for (const member of role.members) {
						const actorSkills = allActorSkills.get(member);
						if (!actorSkills) {
							continue;
						}

						const desiredSkill = actorSkills.skills.get(skill);
						if (desiredSkill) {
							skillUsers.actors.set(member, {
								actor: actorSkills.actor,
								skill: desiredSkill,
								role: role.name,
							});
						}
					}
				}
			}

			groupedBySkill.value = new Map([...groupedBySkillData.entries()].sort(sortNames));
		}
	},
	{ immediate: true },
);

function sortNames([left]: [string, any], [right]: [string, any]) {
	if (left > right) {
		return 1;
	} else if (left < right) {
		return -1;
	} else {
		return 0;
	}
}

async function rollSkillForActor(actor: GenesysActor, skill: GenesysItem<SkillDataModel>) {
	if (actor.isOwner) {
		const promptOptions = skill.pack ? { rollUnskilled: skill.systemData.characteristic } : {};
		await DicePrompt.promptForRoll(actor, skill.name, promptOptions);
	}
}

async function openActorSheet(actor: GenesysActor) {
	await toRaw(actor).sheet.render(true);
}
</script>

<template>
	<section class="tab-skills">
		<div class="grouping-mode">
			Group By:
			<select v-model="groupingMode">
				<option value="member"><Localized label="Genesys.Tabs.Crew" /></option>
				<option value="skill"><Localized label="Genesys.Labels.Skill" /></option>
			</select>
		</div>
		<div v-if="groupingMode === 'member'" class="members-container">
			<section v-for="[memberId, details] in groupedByMember" :key="memberId">
				<div class="member-details">
					<img class="member-image" :src="details.actor.img" :alt="details.actor.name" draggable="false" />
					<a class="member-name" @click="openActorSheet(details.actor as GenesysActor<NonVehicleDataModel>)">{{ details.actor.name }}</a>
					<div class="member-roles"><Localized label="Genesys.Labels.Role" />: {{ details.role }}</div>

					<div class="member-skills" v-if="details.skills.size > 0">
						<div class="member-skills-header">
							<span><Localized label="Genesys.Labels.RoleSkills" /></span>
						</div>

						<div class="member-skills-container">
							<div v-for="[skillName, skill] in details.skills" :key="skillName" class="member-skill">
								<img :src="skill.img" :alt="skill.name" />
								<a class="skill-name" @click="rollSkillForActor(details.actor as GenesysActor<NonVehicleDataModel>, skill as GenesysItem<SkillDataModel>)">
									<span>{{ skill.name }} (<Localized :label="`Genesys.CharacteristicAbbr.${skill.systemData.characteristic.capitalize()}`" />)</span>
								</a>

								<span class="skill-rank">{{ skill.systemData.rank }}</span>
								<SkillRanks :skill-value="skill.systemData.rank" :characteristic-value="(details.actor.systemData as NonVehicleDataModel).characteristics[skill.systemData.characteristic]" />
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
		<div v-else-if="groupingMode === 'skill'" class="skills-container">
			<section v-for="[skillName, details] in groupedBySkill" :key="skillName">
				<div class="skill-details">
					<div class="skill-details-name">
						<img class="skill-details-image" :src="details.skillImage" :alt="details.skillName" draggable="false" />
						{{ details.skillName }}
					</div>
					<div class="skill-contents">
						<div class="skill-content-header">
							<div class="skill-content-header-charName"><Localized label="Genesys.Labels.CharacterName" /></div>
							<div class="skill-content-header-roles"><Localized label="Genesys.Labels.Role" /></div>
							<div class="skill-content-header-skill"><Localized label="Genesys.Labels.Skill" /></div>
						</div>

						<div v-for="[actorId, actorRoleSkill] in details.actors" :key="actorId" class="skill-content-details">
							<img class="skill-content-details-charImage" :src="actorRoleSkill.actor.img" :alt="actorRoleSkill.actor.name" draggable="false" />
							<a class="skill-content-details-charName" @click="openActorSheet(actorRoleSkill.actor as GenesysActor<NonVehicleDataModel>)">{{ actorRoleSkill.actor.name }}</a>
							<div>{{ actorRoleSkill.role }}</div>
							<div class="skill-content-details-skillRank">{{ actorRoleSkill.skill.systemData.rank }}</div>
							<a @click="rollSkillForActor(actorRoleSkill.actor as GenesysActor<NonVehicleDataModel>, actorRoleSkill.skill as GenesysItem<SkillDataModel>)">
								<SkillRanks
									:skill-value="actorRoleSkill.skill.systemData.rank"
									:characteristic-value="(actorRoleSkill.actor.systemData as NonVehicleDataModel).characteristics[actorRoleSkill.skill.systemData.characteristic]"
								/>
							</a>
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
	display: flex;
	flex-direction: column;

	.grouping-mode {
		font-family: 'Bebas Neue', sans-serif;
		font-size: 1em;
		margin-left: auto;

		select {
			margin-left: 0.5rem;
		}
	}

	.members-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5em;
		margin-top: 0.5em;

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
							margin: 0.1em;
							width: 1.5rem;
							height: 1.5rem;
						}
					}
				}
			}
		}
	}

	.skills-container {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		gap: 0.5em;
		padding: 0.5em;

		.skill-details {
			display: grid;
			grid-template-rows: auto auto;
			background: transparentize(colors.$light-blue, 0.8);
			border-radius: 1em;
			height: 100%;
			gap: 0.5em;
			padding: 0.5rem;

			.skill-details-name {
				grid-row: 1 / span 1;
				font-family: 'Bebas Neue', sans-serif;
				width: 100%;
				font-size: 2rem;
				vertical-align: bottom;
				padding: 0px;

				.skill-details-image {
					width: 2rem;
					border: none;
					border-radius: 0.25rem;
					vertical-align: middle;
				}
			}

			.skill-contents {
				grid-row: 2 / span 1;
				display: grid;
				grid-template-rows: auto auto;

				.skill-content-header {
					grid-row: 1 / span 1;
					display: grid;
					grid-template-columns: 1.5rem 2fr 1.5fr 1.5em 80px;
					font-family: 'Bebas Neue', sans-serif;
					align-items: center;
					justify-items: center;
					gap: 0.5em;

					.skill-content-header-charName {
						grid-column: 1 / span 2;
						justify-self: left;
					}

					.skill-content-header-roles {
						grid-column: 3 / span 1;
					}

					.skill-content-header-skill {
						grid-column: 4 / span 2;
					}
				}

				.skill-content-details {
					grid-row: auto / span 1;
					display: grid;
					width: 100%;
					grid-template-columns: 1.5rem 2fr 1.5fr 1.5em 80px;
					border-top: 1px dashed colors.$blue;
					align-items: center;
					justify-items: center;
					padding: 2px 0;
					gap: 0.5em;

					.skill-content-details-charImage {
						border: none;
						border-radius: 0.25rem;
					}

					.skill-content-details-charName {
						font-family: 'Roboto Serif', serif;
						font-size: 1rem;
						justify-self: left;
					}

					.skill-content-details-skillRank {
						background: transparentize(white, 0.5);
						border: 1px dashed black;
						border-radius: 0.75rem;
						text-align: center;
						margin: 0.1em;
						width: 1.5em;
						height: 1.5em;
						line-height: 1.5em;
					}
				}
			}
		}
	}
}
</style>
