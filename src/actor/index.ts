/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Genesys Actors root.
 */

import { register as registerSheets } from '@/actor/sheets';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import GenesysActor from '@/actor/GenesysActor';
import MinionDataModel from '@/actor/data/MinionDataModel';
import RivalDataModel from '@/actor/data/RivalDataModel';
import NemesisDataModel from '@/actor/data/NemesisDataModel';
import VehicleDataModel from '@/actor/data/VehicleDataModel';

export function register() {
	CONFIG.Actor.documentClass = GenesysActor;

	registerDataModels();
	registerSheets();
}

export const AdversaryTypes = ['minion', 'nemesis', 'rival'];

function registerDataModels() {
	CONFIG.Actor.dataModels.character = CharacterDataModel;
	CONFIG.Actor.dataModels.minion = MinionDataModel;
	CONFIG.Actor.dataModels.rival = RivalDataModel;
	CONFIG.Actor.dataModels.nemesis = NemesisDataModel;
	CONFIG.Actor.dataModels.vehicle = VehicleDataModel;
}
