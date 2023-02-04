/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Careers
 */
import GenesysItem from '@/item/GenesysItem';
import BaseItemDataModel from '@/item/data/BaseItemDataModel';
import SkillDataModel from '@/item/data/SkillDataModel';

export default abstract class CareerDataModel extends BaseItemDataModel {
	/**
	 * Career skills offered by the Career.
	 */
	abstract careerSkills: GenesysItem<SkillDataModel>[];

	/**
	 * (Owned Only) The list of skills the player selected as their Career Skills to take ranks in.
	 */
	abstract selectedSkillIDs: string[];

	static override defineSchema() {
		const fields = foundry.data.fields;

		return {
			...super.defineSchema(),
			careerSkills: new fields.ArrayField(new fields.ObjectField()),
			selectedSkillIDs: new fields.ArrayField(new fields.StringField()),
		};
	}
}
