/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Armor equipment
 */

import EquipmentDataModel from '@/item/data/EquipmentDataModel';

export default abstract class ArmorDataModel extends EquipmentDataModel {
	/**
	 * Amount of Defense given by the item.
	 */
	abstract defense: number;

	/**
	 * Amount of Soak given by the item.
	 */
	abstract soak: number;

	static override defineSchema() {
		const fields = foundry.data.fields;

		return {
			...super.defineSchema(),
			defense: new fields.NumberField({ integer: true, initial: 0 }),
			soak: new fields.NumberField({ integer: true, initial: 0 }),
		};
	}
}
