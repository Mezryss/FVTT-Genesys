import GenesysActor from '@/actor/GenesysActor';
import IHasOnDelete from '@/data/IHasOnDelete';
import IHasPreCreate from '@/data/IHasPreCreate';
import GenesysEffect from '@/effects/GenesysEffect';
import EquipmentDataModel, { EquipmentState } from '@/item/data/EquipmentDataModel';
import GenesysItem from '@/item/GenesysItem';

type ValueWithMax = {
	value: number;
	max: number;
};

type ValueWithThreshold = {
	value: number;
	threshold: number;
};

type ActorPointer = {
	uuid: string;
	sort: number;
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

// We can get rid of this type when Typescript finally allows getting the keys of private static variables, which will make it so
// that the first argument type of `isRelevantTypeForContext` is replaced with `keyof typeof VehicleDataModel.#RELEVANT_TYPES`.
type RelevantTypes = {
	COMBAT: string[];
	ROLE: string[];
	PASSENGER: string[];
	ENCUMBRANCE: string[];
	INVENTORY: string[];
	EQUIPABLE: string[];
	CONSUMABLE: string[];
};

export default abstract class VehicleDataModel extends foundry.abstract.DataModel implements IHasPreCreate<GenesysActor<VehicleDataModel>>, IHasOnDelete<GenesysActor<VehicleDataModel>> {
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
	abstract passengers: ValueWithThreshold & { list: ActorPointer[] };
	abstract encumbrance: ValueWithThreshold;
	abstract roles: RoleData[];

	/**
	 * A list of Document types that a Vehicle actor cares about for different reasons.
	 */
	static readonly #RELEVANT_TYPES: RelevantTypes = {
		// Types that are related to the Combat tab.
		COMBAT: ['injury'],
		// Types that are allowed to be dropped on a role.
		ROLE: ['character', 'minion', 'rival', 'nemesis', 'skill'],
		// Types that are allowed to be a added as passengers.
		PASSENGER: ['character', 'minion', 'rival', 'nemesis'],
		// Types that are used to calculate encumbrance values.
		ENCUMBRANCE: ['vehicleWeapon', 'weapon', 'armor', 'consumable', 'gear', 'container'],
		// Types that are listed on the Inventory tab.
		INVENTORY: ['vehicleWeapon', 'weapon', 'armor', 'consumable', 'gear', 'container'],
		// Types that can be equipped.
		EQUIPABLE: ['vehicleWeapon'],
		// Types that can be spent.
		CONSUMABLE: ['consumable'],
	};

	static isRelevantTypeForContext(context: keyof RelevantTypes, type: string) {
		return !!type && (VehicleDataModel.#RELEVANT_TYPES[context]?.includes(type) ?? false); // eslint-disable-line
	}

	static readonly _GAME_VEHICLES = new Set<GenesysActor<VehicleDataModel>>();

	static override migrateData(source: any) {
		const passengers: Array<ActorPointer & { id?: string }> | undefined = source.passengers?.list;
		if (passengers) {
			for (const passenger of passengers) {
				// eslint-disable-next-line no-prototype-builtins
				if (!passenger.hasOwnProperty('id')) {
					break;
				}
				// We removed the `id` property and added `uuid`. We transfer the data from one to the other to allow the migration
				// script that runs after to save the proper data. (See "src\migrations\1-use-uuid-for-vehicle.ts")
				passenger.uuid = passenger.id!;
				delete passenger.id;
			}
		}

		return super.migrateData(source);
	}

	constructor(...args: any[]) {
		super(...args);

		const actor = this.parent as unknown as GenesysActor<this>;
		if (actor.id) {
			VehicleDataModel._GAME_VEHICLES.add(actor);
		}
	}

	/**
	 * Gets the current encumbrance value and threshold after taking into account item's quantities and containers.
	 */
	get currentEncumbrance() {
		const actor = this.parent as unknown as GenesysActor<this>;
		const cargoEncumbrance = actor.items.reduce(
			(accum, item) => {
				const equipment = item as GenesysItem<EquipmentDataModel>;

				if (VehicleDataModel.isRelevantTypeForContext('ENCUMBRANCE', equipment.type) && equipment.systemData.encumbrance !== undefined) {
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

	async addRole() {
		const actor = this.parent as unknown as GenesysActor<this>;

		const roleId = randomID();
		const roles = [
			...this.roles,
			{
				id: roleId,
				name: '',
				skills: [],
				members: [],
			},
		];

		await actor.update({
			'system.roles': roles,
		});

		return roleId;
	}

	async deleteRole(roleId: string) {
		const actor = this.parent as unknown as GenesysActor<this>;

		const roles = [...this.roles];
		const roleIndex = roles.findIndex((role) => role.id === roleId);

		if (roleIndex !== -1) {
			roles.splice(roleIndex, 1);
			await actor.update({
				'system.roles': roles,
			});
		}
	}

	async updateRoleName(roleId: string, newName: string) {
		const actor = this.parent as unknown as GenesysActor<this>;

		const roles = [...this.roles];
		const roleIndex = roles.findIndex((role) => role.id === roleId);

		if (roleIndex !== -1) {
			roles[roleIndex].name = newName;
			await actor.update({
				'system.roles': roles,
			});
		}
	}

	async addSkillToRole(roleId: string, skillName: string) {
		const actor = this.parent as unknown as GenesysActor<this>;

		const roles = [...this.roles];
		const role = roles.find((role) => role.id === roleId);

		if (role && !role.skills.includes(skillName)) {
			role.skills.push(skillName);
			await actor.update({
				'system.roles': roles,
			});
		}
	}

	async removeSkillFromRole(roleId: string, skillName: string) {
		const actor = this.parent as unknown as GenesysActor<this>;

		const roles = [...this.roles];
		const role = roles.find((role) => role.id === roleId);

		if (role) {
			const skillIndex = role.skills.findIndex((skill) => skill === skillName);

			if (skillIndex !== -1) {
				role.skills.splice(skillIndex, 1);
				await actor.update({
					'system.roles': roles,
				});
			}
		}
	}

	async removeMemberFromRole(roleId: string, memberUuid: string) {
		const actor = this.parent as unknown as GenesysActor<this>;

		const roles = [...this.roles];
		const role = roles.find((role) => role.id === roleId);

		if (role) {
			const memberIndex = role.members.findIndex((member) => member === memberUuid);

			if (memberIndex !== -1) {
				role.members.splice(memberIndex, 1);
				await actor.update({
					'system.roles': roles,
				});
			}
		}
	}

	async addPassenger(passengerUuid: string) {
		const actor = this.parent as unknown as GenesysActor<this>;

		const passengers = [...this.passengers.list];

		if (!passengers.some((passenger) => passenger.uuid === passengerUuid)) {
			const lastPassengerSort = passengers[passengers.length - 1]?.sort ?? 0;
			passengers.push({ uuid: passengerUuid, sort: lastPassengerSort + CONST.SORT_INTEGER_DENSITY });
			await actor.update({
				'system.passengers.list': passengers,
			});
		}
	}

	async removePassenger(passengerUuid: string) {
		const actor = this.parent as unknown as GenesysActor<this>;

		const passengers = [...this.passengers.list];
		const passengerIndex = passengers.findIndex((passenger) => passenger.uuid === passengerUuid);
		if (passengerIndex !== -1) {
			passengers.splice(passengerIndex, 1);
			await actor.update({
				'system.passengers.list': passengers,
			});
		}
	}

	hasCrew(crewUuid: string) {
		return this.passengers.list.some((passenger) => passenger.uuid === crewUuid) || this.roles.some((role) => role.members.includes(crewUuid));
	}

	async removeCrew(crewUuid: string) {
		const actor = this.parent as unknown as GenesysActor<this>;
		const updateMap = new Map<string, any>();

		const passengers = [...this.passengers.list];
		const passengerIndex = passengers.findIndex((passenger) => passenger.uuid === crewUuid);
		if (passengerIndex !== -1) {
			passengers.splice(passengerIndex, 1);
			updateMap.set('system.passengers.list', passengers);
		}

		const roles = [...this.roles];
		let hasRoleUpdates = false;
		for (const role of roles) {
			const memberIndex = role.members.findIndex((member) => member === crewUuid);
			if (memberIndex !== -1) {
				role.members.splice(memberIndex, 1);
				hasRoleUpdates = true;
			}
		}

		if (hasRoleUpdates) {
			updateMap.set('system.roles', roles);
		}

		if (updateMap.size > 0) {
			await actor.update(Object.fromEntries(updateMap));
		}
	}

	// Maintain consistent with the function of the same name in `CharacterDataModel`.
	async handleEffectsStatus(items: GenesysItem[], overrides?: { equipmentState: EquipmentState }) {
		const actor = this.parent as unknown as GenesysActor<this>;

		const allUpdates = [];
		for (const item of items) {
			let effectDisableStatus = false;

			// If the item is equipment then enable its effects only if it's are on the proper equipment state.
			if (VehicleDataModel.isRelevantTypeForContext('INVENTORY', item.type)) {
				const itemEquipmentState = overrides?.equipmentState ? overrides.equipmentState : (item.systemData as EquipmentDataModel).state;
				if (VehicleDataModel.isRelevantTypeForContext('EQUIPABLE', item.type)) {
					effectDisableStatus = EquipmentState.Equipped !== itemEquipmentState;
				} else if (VehicleDataModel.isRelevantTypeForContext('CONSUMABLE', item.type)) {
					effectDisableStatus = EquipmentState.Used !== itemEquipmentState;
				} else {
					effectDisableStatus = EquipmentState.Carried !== itemEquipmentState;
				}
			}

			allUpdates.push(
				...actor.effects
					.filter((effect) => (effect as GenesysEffect).originItem?.id === item.id && effect.disabled !== effectDisableStatus)
					.map(
						async (effect) =>
							await effect.update({
								disabled: effectDisableStatus,
							}),
					),
			);
		}

		await Promise.all(allUpdates);
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
			source: new fields.HTMLField(),
			price: new fields.NumberField({ initial: 0 }),
			rarity: new fields.NumberField({ integer: true, initial: 0 }),
			currency: new fields.NumberField({ initial: 0 }),
			passengers: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0 }),
				threshold: new fields.NumberField({ integer: true, initial: 0 }),
				list: new fields.ArrayField(
					new fields.SchemaField({
						uuid: new fields.StringField(),
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
		const targetActor = actor as GenesysActor;
		if (targetActor.type === 'vehicle') {
			return;
		}

		const genesysActorUuid = targetActor.uuid;
		for (const vehicle of VehicleDataModel._GAME_VEHICLES) {
			if (vehicle.sheet.rendered && vehicle.systemData.hasCrew(genesysActorUuid)) {
				vehicle.sheet.render(true);
			}
		}
	});

	Hooks.on('deleteActor', (actor) => {
		const targetActor = actor as GenesysActor;

		if (targetActor.type === 'vehicle') {
			// Whenever a vehicle is deleted remove it from the updates array.
			VehicleDataModel._GAME_VEHICLES.delete(targetActor as GenesysActor<VehicleDataModel>);
		} else {
			// Whenever a non-vehicle actor is deleted let the primary GM remove it from all the vehicles in the world.
			const isGmHub = game.users.activeGM?.isSelf ?? (game.user.isGM && game.users.filter((user) => user.isGM && user.active).every((candidate) => candidate.id >= game.user.id));
			if (isGmHub) {
				const genesysActorUuid = targetActor.uuid;
				for (const vehicle of VehicleDataModel._GAME_VEHICLES) {
					vehicle.systemData.removeCrew(genesysActorUuid);
				}
			}
		}
	});
}
