/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Critical Injuries
 */
import BaseItemDataModel from '@/item/data/BaseItemDataModel';

export default abstract class InjuryDataModel extends BaseItemDataModel {
	/**
	 * Severity level of the injury, which aligns with Difficulty levels to heal it.
	 */
	abstract severity: '-' | 'easy' | 'average' | 'hard' | 'daunting';

	static override defineSchema() {
		const fields = foundry.data.fields;

		return {
			...super.defineSchema(),
			severity: new fields.StringField({
				initial: 'average',
				choices: ['-', 'easy', 'average', 'hard', 'daunting'],
			}),
		};
	}
}
