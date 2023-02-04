/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Item Qualities
 */
import BaseItemDataModel from '@/item/data/BaseItemDataModel';

export default abstract class ItemQualityDataModel extends BaseItemDataModel {
	/**
	 * Whether the quality is passively applied or requires spending advantage.
	 */
	abstract activation: 'active' | 'passive';

	/**
	 * Whether the ability has levels (e.g. "Vicious 3") or not.
	 */
	abstract isRated: boolean;

	static override defineSchema() {
		const fields = foundry.data.fields;

		return {
			...super.defineSchema(),
			activation: new fields.StringField({
				initial: 'passive',
				choices: ['active', 'passive'],
			}),
			isRated: new fields.BooleanField({ initial: true }),
		};
	}
}
