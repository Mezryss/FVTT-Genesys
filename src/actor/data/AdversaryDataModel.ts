/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Base data shared by all Adversaries.
 */
import { Characteristic, CharacteristicsContainer } from '@/data/Characteristics';
import { Defense } from '@/data/Actors';

type Motivation = {
	name: string;
	description: string;
};

type Motivations = {
	strength: Motivation;
	flaw: Motivation;
	desire: Motivation;
	fear: Motivation;
};

// We can get rid of this type when Typecript finally allows getting the keys of private static variables; this will be replaced
// by the following syntax: `keyof typeof VehicleDataModel.#RELEVANT_TYPES`
type RelevantTypes = {
	SKILL: string[];
	COMBAT: string[];
	TALENT: string[];
	INVENTORY: string[];
};

export default abstract class AdversaryDataModel extends foundry.abstract.DataModel {
	abstract characteristics: CharacteristicsContainer;
	abstract soak: number;
	abstract defense: Defense;
	abstract description: string;
	abstract motivations: Motivations;
	abstract superCharacteristics: Set<Characteristic>;

	/**
	 * A list of Document types that an Adversary actor cares about for different reasons.
	 */
	static readonly #RELEVANT_TYPES: RelevantTypes = {
		// Types that are related to the Skills tab.
		SKILL: ['skill'],
		// Types that are related to the Combat tab.
		COMBAT: ['injury'],
		// Types that are related to the Talents tab.
		TALENT: ['ability', 'talent'],
		// Types that are related to the equipment.
		INVENTORY: ['weapon', 'armor', 'consumable', 'gear', 'container'],
	};

	static isRelevantTypeForContext(context: keyof RelevantTypes, type: string) {
		return !!type && (AdversaryDataModel.#RELEVANT_TYPES[context]?.includes(type) ?? false); // eslint-disable-line
	}

	static override defineSchema() {
		const fields = foundry.data.fields;

		return {
			characteristics: new fields.SchemaField({
				brawn: new fields.NumberField({ integer: true, initial: 0 }),
				agility: new fields.NumberField({ integer: true, initial: 0 }),
				intellect: new fields.NumberField({ integer: true, initial: 0 }),
				cunning: new fields.NumberField({ integer: true, initial: 0 }),
				willpower: new fields.NumberField({ integer: true, initial: 0 }),
				presence: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			soak: new fields.NumberField({ integer: true, initial: 0 }),
			defense: new fields.SchemaField({
				melee: new fields.NumberField({ integer: true, initial: 0 }),
				ranged: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			description: new fields.HTMLField(),
			motivations: new fields.SchemaField({
				strength: new fields.SchemaField({
					name: new fields.StringField(),
					description: new fields.HTMLField(),
				}),
				flaw: new fields.SchemaField({
					name: new fields.StringField(),
					description: new fields.HTMLField(),
				}),
				desire: new fields.SchemaField({
					name: new fields.StringField(),
					description: new fields.HTMLField(),
				}),
				fear: new fields.SchemaField({
					name: new fields.StringField(),
					description: new fields.HTMLField(),
				}),
			}),
			superCharacteristics: new fields.SetField(new fields.StringField()),
		};
	}
}
