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

/**
 * This type represents a role that can be hold on the vehicle.
 */
type RoleData = {
	// An unique id to identify the role.
	id: string;
	// The name of the role.
	name: string;
	// The list of skills that hold significance for this role.
	skills: string[];
	// The actors that are able to perform this role.
	members: string[];
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
	abstract passengers: ValueWithThreshold & { list: Array<{ id: string; sort: number }> };
	abstract encumbrance: ValueWithThreshold;
	abstract roles: RoleData[];

	/**
	 * A list of Document types that a Vehicle actor care about for different reasons.
	 */
	static readonly RELEVANT_TYPES = {
		// Item types that can be handled when dropped into the vehicle sheet.
		DROP_ITEM: ['vehicleWeapon', 'weapon', 'armor', 'consumable', 'gear', 'container', 'skill', 'injury'],
		// Actor types that can be handled when dropped into the vehicle sheet.
		DROP_ACTOR: ['character', 'minion', 'rival', 'nemesis'],
		// Item types that are used to calculate encumbrance values.
		ENCUMBRANCE: ['vehicleWeapon', 'weapon', 'armor', 'consumable', 'gear', 'container'],
		// Item types that are listed on the Inventory tab.
		INVENTORY: ['vehicleWeapon', 'weapon', 'armor', 'consumable', 'gear', 'container'],
		// Item types that can be equipped.
		EQUIPABLE: ['vehicleWeapon'],
	};

	static readonly _GAME_VEHICLES = new Set<GenesysActor<VehicleDataModel>>();

	constructor(...args: any[]) {
		super(...args);

		const actor = this.parent as unknown as GenesysActor<VehicleDataModel>;
		if (actor.id) {
			VehicleDataModel._GAME_VEHICLES.add(actor);
		}
	}

	/**
	 * Gets the current encumbrance value and threshold after taking into account item's quantities and containers.
	 */
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
		const currentEncumbrance = this.currentEncumbrance;
		return currentEncumbrance.value > currentEncumbrance.threshold;
	}

	/**
	 * Gets the current number of passengers after including those listed on the sheet.
	 */
	get currentPassengers() {
		return {
			value: Math.max(this.passengers.value + this.passengers.list.length, 0),
			threshold: Math.max(this.passengers.threshold, 0),
		};
	}

	get isOverCapacity() {
		const currentPassengers = this.currentPassengers;
		return currentPassengers.value > currentPassengers.threshold;
	}

	async preCreate(actor: GenesysActor<VehicleDataModel>, _data: PreDocumentId<any>, _options: DocumentModificationContext<GenesysActor<VehicleDataModel>>, _user: User) {
		const prototypeToken = {
			bar1: { attribute: 'hullTrauma' },
			bar2: { attribute: 'systemStrain' },
			actorLink: true,
		};

		await actor.updateSource({ prototypeToken });
	}

	onDelete(actor: GenesysActor<VehicleDataModel>, _options: DocumentModificationContext<GenesysActor<VehicleDataModel>>, _userId: string) {
		VehicleDataModel._GAME_VEHICLES.delete(actor);
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
			passengers: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0 }),
				threshold: new fields.NumberField({ integer: true, initial: 0 }),
				list: new fields.ArrayField(
					new fields.SchemaField({
						id: new fields.StringField(),
						sort: new fields.NumberField({ integer: true, initial: 0 }),
					}),
				),
			}),
			encumbrance: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0 }),
				threshold: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			roles: new fields.ArrayField(
				new fields.SchemaField({
					id: new fields.StringField(),
					name: new fields.StringField(),
					skills: new fields.ArrayField(new fields.StringField()),
					members: new fields.ArrayField(new fields.StringField()),
				}),
			),
		};
	}
}

export function register() {
	// Whenever an actor that is on a vehicle is updated we make sure to re-render the vehicle sheet.
	Hooks.on('updateActor', (actor) => {
		const genesysActor = actor as GenesysActor;
		for (const vehicle of VehicleDataModel._GAME_VEHICLES) {
			if (vehicle.sheet.rendered && (vehicle.systemData.roles.some((role) => role.members.includes(genesysActor.id)) || vehicle.systemData.passengers.list.some((passenger) => passenger.id === genesysActor.id))) {
				vehicle.sheet.render(true);
			}
		}
	});
}
