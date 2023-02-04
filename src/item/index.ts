/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Genesys Items Root.
 */

import GenesysItem from '@/item/GenesysItem';
import { register as registerSheets } from '@/item/sheets';

import AbilityDataModel from '@/item/data/AbilityDataModel';
import ArchetypeDataModel from '@/item/data/ArchetypeDataModel';
import ArmorDataModel from '@/item/data/ArmorDataModel';
import CareerDataModel from '@/item/data/CareerDataModel';
import ContainerDataModel from '@/item/data/ContainerDataModel';
import EquipmentDataModel from '@/item/data/EquipmentDataModel';
import InjuryDataModel from '@/item/data/InjuryDataModel';
import SkillDataModel from '@/item/data/SkillDataModel';
import TalentDataModel from '@/item/data/TalentDataModel';
import ItemQualityDataModel from '@/item/data/ItemQualityDataModel';
import WeaponDataModel from '@/item/data/WeaponDataModel';

export function register() {
	CONFIG.Item.documentClass = GenesysItem;

	registerDataModels();
	registerSheets();
}

function registerDataModels() {
	CONFIG.Item.systemDataModels.ability = AbilityDataModel;
	CONFIG.Item.systemDataModels.archetype = ArchetypeDataModel;
	CONFIG.Item.systemDataModels.armor = ArmorDataModel;
	CONFIG.Item.systemDataModels.career = CareerDataModel;
	CONFIG.Item.systemDataModels.consumable = EquipmentDataModel;
	CONFIG.Item.systemDataModels.container = ContainerDataModel;
	CONFIG.Item.systemDataModels.injury = InjuryDataModel;
	CONFIG.Item.systemDataModels.gear = EquipmentDataModel;
	CONFIG.Item.systemDataModels.skill = SkillDataModel;
	CONFIG.Item.systemDataModels.talent = TalentDataModel;
	CONFIG.Item.systemDataModels.quality = ItemQualityDataModel;
	CONFIG.Item.systemDataModels.weapon = WeaponDataModel;
}
