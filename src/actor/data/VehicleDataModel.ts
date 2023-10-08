import GenesysActor from '@/actor/GenesysActor';
import IHasPreCreate from '@/data/IHasPreCreate';

export default abstract class VehicleDataModel extends foundry.abstract.DataModel implements IHasPreCreate<GenesysActor<VehicleDataModel>> {
	abstract silhouette: number;
	abstract speed: number;
	abstract handling: number;
	abstract defense: number;
	abstract armor: number;
	abstract hullTrauma: {
		value: number;
		max: number;
	};
	abstract systemStrain: {
		value: number;
		max: number;
	};

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
		};
	}
}
