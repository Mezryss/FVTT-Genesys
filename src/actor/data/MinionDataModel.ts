/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Minion Adversaries
 */
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';
import GenesysActor from '@/actor/GenesysActor';
import IHasPreCreate from '@/data/IHasPreCreate';
import { TokenAttributeDetails } from '@/token/GenesysTokenDocument';

export default abstract class MinionDataModel extends AdversaryDataModel implements IHasPreCreate<GenesysActor<MinionDataModel>> {
	abstract groupSize: number;
	abstract wounds: {
		value: number;
		threshold: number;
	};

	static override readonly tokenAttributes: Record<string, TokenAttributeDetails> = {
		wounds: {
			label: 'Wounds',
			isBar: true,
			editable: true,
			valuePath: 'wounds.value',
			maxPath: 'groupWoundThreshold',
		},
		members: {
			label: 'Remaining Members',
			isBar: false,
			editable: false,
			valuePath: 'remainingMembers',
		},
		...AdversaryDataModel.tokenAttributes,
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

	async preCreate(actor: GenesysActor<MinionDataModel>, _data: PreDocumentId<any>, _options: DocumentModificationContext<GenesysActor<MinionDataModel>>, _user: foundry.documents.BaseUser) {
		const prototypeToken = {
			bar1: { attribute: 'wounds' },
			bar2: { attribute: 'members' },
		};

		await actor.updateSource({ prototypeToken });
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
