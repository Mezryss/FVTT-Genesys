/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Weapons
 */

import BaseWeaponDataModel from '@/item/data/BaseWeaponDataModel';
import { Characteristic } from '@/data/Characteristics';

export default abstract class WeaponDataModel extends BaseWeaponDataModel {
	/**
	 * Characteristic that is added to the damage value.
	 */
	abstract damageCharacteristic: Characteristic | '-';

	static override defineSchema() {
		const fields = foundry.data.fields;

		return {
			...super.defineSchema(),
			damageCharacteristic: new fields.StringField({
				initial: '-',
				choices: ['-', Characteristic.Brawn, Characteristic.Agility, Characteristic.Intellect, Characteristic.Cunning, Characteristic.Willpower, Characteristic.Presence],
			}),
		};
	}
}
