/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Armor equipment
 */

import EquipmentDataModel from '@/item/data/EquipmentDataModel';
import { ContainedItemQuality } from '@/item/data/WeaponDataModel';

export default abstract class ArmorDataModel extends EquipmentDataModel {
	/**
	 * Amount of Defense given by the item.
	 */
	abstract defense: number;

	/**
	 * Amount of Soak given by the item.
	 */
	abstract soak: number;

	/**
	 * Item qualities for the armor.
	 */
	abstract qualities: ContainedItemQuality[];

	static override defineSchema() {
		const fields = foundry.data.fields;

		return {
			...super.defineSchema(),
			defense: new fields.NumberField({ integer: true, initial: 0 }),
			soak: new fields.NumberField({ integer: true, initial: 0 }),
			qualities: new fields.ArrayField(
				new fields.SchemaField({
					name: new fields.StringField(),
					description: new fields.HTMLField(),
					isRated: new fields.BooleanField({ initial: true }),
					rating: new fields.NumberField({ initial: 1, integer: true }),
				}),
			),
		};
	}
}
