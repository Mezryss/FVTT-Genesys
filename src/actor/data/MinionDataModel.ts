/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Minion Adversaries
 */
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';

export default abstract class MinionDataModel extends AdversaryDataModel {
	abstract groupSize: number;
	abstract wounds: {
		value: number;
		threshold: number;
	};

	get groupWoundThreshold() {
		return this.wounds.threshold * this.groupSize;
	}

	get remainingMembers(): number {
		if (this.groupWoundThreshold === 0) {
			return 0;
		}
		if (this.wounds.value === 0) {
			return this.groupSize;
		}

		return Math.max(0, this.groupSize - Math.floor((this.wounds.value - 1) / this.wounds.threshold));
	}

	static override defineSchema() {
		const fields = foundry.data.fields;

		return {
			...super.defineSchema(),
			groupSize: new fields.NumberField({ initial: 4, integer: true }),
			wounds: new fields.SchemaField({
				value: new fields.NumberField({ initial: 0, integer: true }),
				threshold: new fields.NumberField({ initial: 0, integer: true }),
			}),
		};
	}
}
