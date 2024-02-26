import GenesysActor from '@/actor/GenesysActor';
import VehicleDataModel from '@/actor/data/VehicleDataModel';
import { MigrationStatus } from '@/migrations/MigrationHelper';

/**
 * Previously we allowed for an actor to be part of more than one role. This script removes any actor that is already part of
 * a role from any other role on the vehicle.
 */
export async function migrate_ActorOnlyOnceInCrew() {
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
		const crewIds = new Set<string>();

		// Check all the roles first and remove any actor that appears more than once from subsequent roles.
		const roles = [...vehicle.systemData.roles];
		let updateRoles = false;
		for (const role of roles) {
			for (let k = role.members.length - 1; k >= 0; k--) {
				if (crewIds.has(role.members[k])) {
					role.members.splice(k, 1);
					updateRoles = true;
				} else {
					crewIds.add(role.members[k]);
				}
			}
		}

		// Check the passengers and make sure all of them are not in any role.
		const passengers = [...vehicle.systemData.passengers.list];
		let updatePassengers = false;
		for (let k = passengers.length - 1; k >= 0; k--) {
			if (crewIds.has(passengers[k].uuid)) {
				passengers.splice(k, 1);
				updatePassengers = true;
			} else {
				crewIds.add(passengers[k].uuid);
			}
		}

		// Update the vehicle if we found at least one actor repeated.
		if (updateRoles || updatePassengers) {
			await vehicle.update({
				...(updateRoles && { 'system.roles': roles }),
				...(updatePassengers && { 'system.passengers.list': passengers }),
			});
		}
	}

	return MigrationStatus.SUCCESS;
}
