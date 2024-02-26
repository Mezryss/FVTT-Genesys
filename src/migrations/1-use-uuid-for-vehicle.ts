import GenesysActor from '@/actor/GenesysActor';
import VehicleDataModel from '@/actor/data/VehicleDataModel';
import { MigrationStatus } from '@/migrations/MigrationHelper';

/**
 * Migration script for vehicles that are using an actor's id instead of the actor's uuid. The former is not completly unique
 * and limits the type of actors it can refer to.
 */
export async function migrate_UseUuidForVehicles() {
	// Get all the vehicles on the world and compendiums.
	const vehiclesInWorld = game.actors.filter<GenesysActor<VehicleDataModel>>((actor) => actor.type === 'vehicle');
	const vehiclesInCompendium = await Promise.all(
		game.packs.reduce(
			(accum, pack) => {
				if (pack.metadata.type === 'Actor') {
					pack.index.forEach((compendiumIndex) => {
						if (compendiumIndex.type === 'vehicle') {
							accum.push(pack.getDocument(compendiumIndex._id) as Promise<GenesysActor<VehicleDataModel>>);
						}
					});
				}
				return accum;
			},
			[] as Promise<GenesysActor<VehicleDataModel>>[],
		),
	);
	const vehicles = vehiclesInWorld.concat(vehiclesInCompendium);

	for (const vehicle of vehicles) {
		const updateMap = new Map<string, any>();
		const passengersList = vehicle.systemData.passengers.list;

		// If the vehicle has passangers on them then we need to update their references from id's to UUID's.
		if (passengersList.length > 0) {
			const passengers: typeof passengersList = [];

			for (const passenger of passengersList) {
				const passengerActor = game.actors.get(passenger.uuid);

				if (passengerActor) {
					passengers.push({
						uuid: passengerActor.uuid,
						sort: passenger.sort,
					});
				}
			}

			updateMap.set('system.passengers.list', passengers);
		}

		let updateRoles = false;
		const roles = [...vehicle.systemData.roles];
		for (const role of roles) {
			const roleMembers = role.members;

			// If the role has any members then we need to update their references from id's to UUID's.
			if (roleMembers.length > 0) {
				const members: string[] = [];

				for (const member of roleMembers) {
					const memberActor = game.actors.get(member);

					if (memberActor) {
						members.push(memberActor.uuid);
					}
				}

				role.members = members;
				updateRoles = true;
			}
		}

		// Update the roles array if at least one of them had to be updated.
		if (updateRoles) {
			updateMap.set('system.roles', roles);
		}

		if (updateMap.size > 0) {
			await vehicle.update(Object.fromEntries(updateMap));
		}
	}

	return MigrationStatus.SUCCESS;
}
