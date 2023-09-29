/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Player Character Sheet
 */

import VueCharacterSheet from '@/vue/sheets/actor/CharacterSheet.vue';
import GenesysItem from '@/item/GenesysItem';
import BaseItemDataModel from '@/item/data/BaseItemDataModel';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import ArchetypeDataModel from '@/item/data/ArchetypeDataModel';
import CareerDataModel from '@/item/data/CareerDataModel';
import SkillDataModel from '@/item/data/SkillDataModel';
import { EntryType } from '@/actor/data/character/ExperienceJournal';
import CareerSkillPrompt from '@/app/CareerSkillPrompt';
import TalentDataModel from '@/item/data/TalentDataModel';
import VueSheet from '@/vue/VueSheet';
import GenesysActorSheet from '@/actor/GenesysActorSheet';
import { ActorSheetContext } from '@/vue/SheetContext';
import GenesysEffect from '@/effects/GenesysEffect';

/**
 * Actor sheet used for Player Characters
 */
export default class CharacterSheet extends VueSheet(GenesysActorSheet<CharacterDataModel>) {
	override get vueComponent() {
		return VueCharacterSheet;
	}

	override async getVueContext(): Promise<ActorSheetContext<CharacterDataModel>> {
		return {
			sheet: this,
			data: await this.getData(),
		};
	}

	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'skills',
				},
			],
		};
	}

	protected override async _onDropItem(event: DragEvent, data: DropCanvasData<'Item', GenesysItem<BaseItemDataModel>>): Promise<GenesysItem<BaseItemDataModel>[] | boolean> {
		if (!this.isEditable || !data.uuid) {
			return false;
		}

		const droppedItem: GenesysItem | undefined = await (<any>GenesysItem.implementation).fromDropData(data);
		if (!droppedItem) {
			return false;
		}

		// If it's an archetype, delete the old one and apply the new one.
		if (droppedItem.type === 'archetype') {
			if (!this.canRemoveArchetype()) {
				return false;
			}

			const existingArchetype = <GenesysItem<ArchetypeDataModel> | undefined>this.actor.items.find((i) => i.type === 'archetype');
			if (existingArchetype) {
				await this.removeArchetype(existingArchetype);
			}

			await this.applyArchetype(<GenesysItem<ArchetypeDataModel>>droppedItem);
		}

		// If it's a career, delete the old one and apply the new one.
		if (droppedItem.type === 'career') {
			// Don't allow a career change if we've already started making changes to the character!
			if (this.actor.systemData.experienceJournal.entries.length > 1) {
				return false;
			}

			const existingCareer = <GenesysItem<CareerDataModel> | undefined>this.actor.items.find((i) => i.type === 'career');
			if (existingCareer) {
				await this.removeCareer(existingCareer);
			}

			await this.applyCareer(<GenesysItem<CareerDataModel>>droppedItem);

			return false; // applyCareer handles adding the embedded document to the character.
		}

		if (droppedItem.type === 'talent') {
			const talent = <GenesysItem<TalentDataModel>>droppedItem;
			const existingTalent = <GenesysItem<TalentDataModel>>this.actor.items.find((i) => i.type === 'talent' && i.name.toLowerCase() === talent.name.toLowerCase());

			if (existingTalent) {
				if (existingTalent.systemData.ranked === 'no') {
					ui.notifications.info(game.i18n.format('Genesys.Notifications.TalentNotRanked', { talentName: existingTalent.name }));
					return false;
				}

				const newRank = existingTalent.systemData.rank + 1;
				const newEffectiveTier = existingTalent.systemData.effectiveNextTier;
				const cost = existingTalent.systemData.advanceCost;

				if (this.actor.systemData.availableXP < cost) {
					ui.notifications.info(game.i18n.format('Genesys.Notifications.CannotAffordRankedTalent', { name: talent.name, newRank, cost }));
					return false;
				}

				await existingTalent.update({
					'system.rank': newRank,
				});

				await this.actor.update({
					'system.experienceJournal.entries': [
						...this.actor.systemData.experienceJournal.entries,
						{
							amount: -cost,
							type: EntryType.TalentRank,
							data: {
								name: existingTalent.name,
								id: existingTalent.id,
								tier: newEffectiveTier,
								rank: newRank,
							},
						},
					],
				});
			} else {
				// New talent
				const cost = talent.systemData.tier * 5;

				if (this.actor.systemData.availableXP < cost) {
					ui.notifications.info(game.i18n.format('Genesys.Notifications.CannotAffordTalent', { name: talent.name, cost }));
					return false;
				}

				const [newTalent] = (await this._onDropItemCreate(talent.toObject())) as GenesysItem<TalentDataModel>[];

				await this.actor.update({
					'system.experienceJournal.entries': [
						...this.actor.systemData.experienceJournal.entries,
						{
							amount: -cost,
							type: EntryType.NewTalent,
							data: {
								name: newTalent.name,
								id: newTalent.id,
								tier: newTalent.systemData.tier,
								rank: 1,
							},
						},
					],
				});
			}

			return false;
		}

		// Prevent adding the same skill multiple times.
		if (droppedItem.type === 'skill' && this.actor.items.find((i) => i.type === 'skill' && i.name.toLowerCase() === droppedItem.name.toLowerCase())) {
			return false;
		}

		if (['weapon', 'armor'].includes(droppedItem.type)) {
			const [equipable] = await this._onDropItemCreate(droppedItem.toObject());

			await Promise.all(
				this.actor.effects
					.filter((effect) => (effect as GenesysEffect).originItem?.id === equipable.id && !effect.disabled)
					.map(
						async (effect) =>
							await effect.update({
								disabled: true,
							}),
					),
			);

			return false;
		}

		return await super._onDropItem(event, data);
	}

	async #updateForArchetype(workingData: CharacterDataModel) {
		await this.actor.update({
			'system.characteristics.brawn': workingData.characteristics.brawn,
			'system.characteristics.agility': workingData.characteristics.agility,
			'system.characteristics.intellect': workingData.characteristics.intellect,
			'system.characteristics.cunning': workingData.characteristics.cunning,
			'system.characteristics.willpower': workingData.characteristics.willpower,
			'system.characteristics.presence': workingData.characteristics.presence,

			'system.wounds.max': workingData.wounds.max,
			'system.strain.max': workingData.strain.max,

			'system.experienceJournal.entries': workingData.experienceJournal.entries,
		});
	}

	canRemoveArchetype() {
		return this.actor.systemData.experienceJournal.entries.length <= 1;
	}

	/**
	 *
	 * @param archetype
	 */
	async applyArchetype(archetype: GenesysItem<ArchetypeDataModel>) {
		const workingData = <CharacterDataModel>deepClone(this.actor.systemData);
		const archetypeData = archetype.systemData;

		// Characteristics
		workingData.characteristics.brawn += archetypeData.characteristics.brawn;
		workingData.characteristics.agility += archetypeData.characteristics.agility;
		workingData.characteristics.intellect += archetypeData.characteristics.intellect;
		workingData.characteristics.cunning += archetypeData.characteristics.cunning;
		workingData.characteristics.willpower += archetypeData.characteristics.willpower;
		workingData.characteristics.presence += archetypeData.characteristics.presence;

		// Wound & Strain Thresholds
		workingData.wounds.max += archetypeData.woundThreshold + archetypeData.characteristics.brawn;
		workingData.strain.max += archetypeData.strainThreshold + archetypeData.characteristics.willpower;

		// Granted Items
		const items = archetypeData.grantedItems;

		// Non-skills get added as embedded items.
		const nonSkills = items.filter((i) => i && i.type !== 'skill');
		await this.actor.createEmbeddedDocuments('Item', nonSkills);

		// Skills gain a rank.
		const grantedSkills = items.filter((i) => i && i.type === 'skill').map((s) => s.name);
		await Promise.all(
			this.actor.items
				.filter((i) => i.type === 'skill')
				.map(async (skill) => {
					if (grantedSkills.includes(skill.name)) {
						await skill.update({
							'system.rank': (<SkillDataModel>skill.system).rank + 1,
						});
					}
				}),
		);

		// Prepend starting XP to character's Experience Journal.
		workingData.experienceJournal.entries = [
			{
				amount: archetypeData.startingXP,
				type: EntryType.Starting,
			},
			...workingData.experienceJournal.entries,
		];

		await this.#updateForArchetype(workingData);
	}

	/**
	 *
	 * @param archetype
	 */
	async removeArchetype(archetype: GenesysItem<ArchetypeDataModel>) {
		const workingData = <CharacterDataModel>deepClone(this.actor.systemData);
		const archetypeData = archetype.systemData;

		// Reduce characteristics.
		workingData.characteristics.brawn -= archetypeData.characteristics.brawn;
		workingData.characteristics.agility -= archetypeData.characteristics.agility;
		workingData.characteristics.intellect -= archetypeData.characteristics.intellect;
		workingData.characteristics.cunning -= archetypeData.characteristics.cunning;
		workingData.characteristics.willpower -= archetypeData.characteristics.willpower;
		workingData.characteristics.presence -= archetypeData.characteristics.presence;

		// Wound & Strain Thresholds
		workingData.wounds.max -= archetypeData.woundThreshold + archetypeData.characteristics.brawn;
		workingData.strain.max -= archetypeData.strainThreshold + archetypeData.characteristics.willpower;

		// Remove starting XP from Experience Journal.
		workingData.experienceJournal.entries = workingData.experienceJournal.entries.slice(1);

		// Remove granted items.
		const items = archetypeData.grantedItems;

		// Non-skills are embedded items & need to be deleted.
		const nonSkills = items.filter((i) => i && i.type !== 'skill').map((a) => a.name);
		await Promise.all(
			this.actor.items
				.filter((i) => i.type !== 'skill')
				.map(async (i) => {
					if (nonSkills.includes(i.name)) {
						await i.delete();
					}
				}),
		);

		// Skills get reduced by 1 rank.
		const grantedSkills = items.filter((i) => i && i.type === 'skill').map((s) => s.name);
		await Promise.all(
			this.actor.items
				.filter((i) => i.type === 'skill')
				.map(async (i) => {
					if (grantedSkills.includes(i.name)) {
						await i.update({
							'system.rank': (<SkillDataModel>i.system).rank - 1,
						});
					}
				}),
		);

		// Update data.
		await this.#updateForArchetype(workingData);

		// Delete the archetype.
		await archetype.delete();
	}

	/**
	 *
	 * @param droppedCareer
	 */
	async applyCareer(droppedCareer: GenesysItem<CareerDataModel>) {
		const [career] = await this._onDropItemCreate(droppedCareer.toObject());
		const careerSkillNames = droppedCareer.systemData.careerSkills.map((s) => s.name.toLowerCase());

		const commonSkills = <GenesysItem<SkillDataModel>[]>this.actor.items.filter((i) => i.type === 'skill' && careerSkillNames.includes(i.name.toLowerCase()));
		const selectedSkills = await CareerSkillPrompt.promptForSkills(commonSkills);

		await career.update({
			'system.selectedSkillIDs': selectedSkills,
		});

		await Promise.all(
			commonSkills.map(
				async (skill) =>
					await skill.update({
						'system.career': true,
						'system.rank': skill.systemData.rank + (selectedSkills.includes(skill.id) ? 1 : 0),
					}),
			),
		);
	}

	/**
	 *
	 * @param career
	 */
	async removeCareer(career: GenesysItem<CareerDataModel>) {
		const careerData = career.systemData;

		// Unmark Career Skills
		const careerSkillNames = careerData.careerSkills.map((s) => s.name);
		const skills = <GenesysItem<SkillDataModel>[]>this.actor.items.filter((i) => i.type === 'skill');

		await Promise.all(
			skills.map(async (skill) => {
				// Only un-mark career skills from the Career
				if (careerSkillNames.includes(skill.name)) {
					// Reduce the skill's rank if it was one of the selected skills.
					const rank = skill.systemData.rank - (careerData.selectedSkillIDs.includes(skill.id) ? 1 : 0);

					await skill.update({
						'system.career': false,
						'system.rank': rank,
					});
				}
			}),
		);

		await career.delete();
	}
}
