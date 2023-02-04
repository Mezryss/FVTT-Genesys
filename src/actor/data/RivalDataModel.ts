/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Rival Adversaries
 */
import GenesysActor from '@/actor/GenesysActor';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';
import IHasPreCreate from '@/data/IHasPreCreate';

export default abstract class RivalDataModel extends AdversaryDataModel implements IHasPreCreate<GenesysActor<RivalDataModel>> {
	abstract wounds: {
		value: number;
		max: number;
	};

	async preCreate(actor: GenesysActor<RivalDataModel>, _data: PreDocumentId<any>, _options: DocumentModificationContext<GenesysActor<RivalDataModel>>, _user: foundry.documents.BaseUser) {
		const prototypeToken = {
			bar1: { attribute: 'wounds' },
		};

		await actor.updateSource({ prototypeToken });
	}

	static override defineSchema() {
		const fields = foundry.data.fields;

		return {
			...super.defineSchema(),
			wounds: new fields.SchemaField({
				value: new fields.NumberField({ initial: 0 }),
				max: new fields.NumberField({ initial: 0 }),
			}),
		};
	}
}
