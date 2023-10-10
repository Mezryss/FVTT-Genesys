import GenesysActor from '@/actor/GenesysActor';
import IHasPreCreate from '@/data/IHasPreCreate';
import EquipmentDataModel from '@/item/data/EquipmentDataModel';
import GenesysItem from '@/item/GenesysItem';

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
	abstract currency: number;
	abstract passenger: ValueWithThreshold;
	abstract encumbrance: ValueWithThreshold;

	static readonly RELEVANT_TYPES = {
		DROP_ITEM: ['weapon', 'armor', 'consumable', 'gear', 'container'],
		ENCUMBRANCE: ['weapon', 'armor', 'consumable', 'gear', 'container'],
		INVENTORY: ['weapon', 'armor', 'consumable', 'gear', 'container'],
	};

	get currentEncumbrance() {
		const actor = this.parent as unknown as GenesysActor<VehicleDataModel>;
		const cargoEncumbrance = actor.items.reduce(
			(accum, item) => {
				const equipment = item as GenesysItem<EquipmentDataModel>;

				if (VehicleDataModel.RELEVANT_TYPES.ENCUMBRANCE.includes(equipment.type) && equipment.systemData.encumbrance !== undefined) {
					if (equipment.systemData.encumbrance >= 0) {
						accum.value += equipment.systemData.encumbrance * equipment.systemData.quantity;
					} else {
						accum.threshold -= equipment.systemData.encumbrance * equipment.systemData.quantity;
					}
				}

				return accum;
			},
			{ value: this.encumbrance.value, threshold: this.encumbrance.threshold },
		);

		return {
			value: Math.max(cargoEncumbrance.value, 0),
			threshold: Math.max(cargoEncumbrance.threshold, 0),
		};
	}

	get isEncumbered() {
		return this.currentEncumbrance.value > this.currentEncumbrance.threshold;
	}

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
			currency: new fields.NumberField({ initial: 0 }),
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
