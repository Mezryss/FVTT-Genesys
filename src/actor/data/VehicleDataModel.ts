import GenesysActor from '@/actor/GenesysActor';
import IHasPreCreate from '@/data/IHasPreCreate';

type ValueWithMax = {
	value: number;
	max: number;
};

type ValueWithThreshold = {
	value: number;
	threshold: number;
};

export default abstract class VehicleDataModel extends foundry.abstract.DataModel implements IHasPreCreate<GenesysActor<VehicleDataModel>> {
	abstract silhouette: number;
	abstract speed: number;
	abstract handling: number;
	abstract defense: number;
	abstract armor: number;
	abstract hullTrauma: ValueWithMax;
	abstract systemStrain: ValueWithMax;
	abstract illustration: string;
	abstract description: string;
	abstract complement: string;
	abstract consumables: string;
	abstract source: string;
	abstract price: number;
	abstract rarity: number;
	abstract passenger: ValueWithThreshold;
	abstract encumbrance: ValueWithThreshold;

	async preCreate(actor: GenesysActor<VehicleDataModel>, _data: PreDocumentId<any>, _options: DocumentModificationContext<GenesysActor<VehicleDataModel>>, _user: User) {
		const prototypeToken = {
			bar1: { attribute: 'hullTrauma' },
			bar2: { attribute: 'systemStrain' },
			actorLink: true,
		};

		await actor.updateSource({ prototypeToken });
	}

	static override defineSchema() {
		const fields = foundry.data.fields;

		return {
			silhouette: new fields.NumberField({ integer: true, initial: 0 }),
			speed: new fields.NumberField({ integer: true, initial: 0 }),
			handling: new fields.NumberField({ integer: true, initial: 0 }),
			defense: new fields.NumberField({ integer: true, initial: 0 }),
			armor: new fields.NumberField({ integer: true, initial: 0 }),
			hullTrauma: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0 }),
				max: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			systemStrain: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0 }),
				max: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			illustration: new fields.StringField(),
			description: new fields.HTMLField(),
			complement: new fields.StringField(),
			consumables: new fields.StringField(),
			source: new fields.StringField(),
			price: new fields.NumberField({ initial: 0 }),
			rarity: new fields.NumberField({ integer: true, initial: 0 }),
			passenger: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0 }),
				threshold: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			encumbrance: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0 }),
				threshold: new fields.NumberField({ integer: true, initial: 0 }),
			}),
		};
	}
}
