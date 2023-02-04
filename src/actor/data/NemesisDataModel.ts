/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Nemesis Adversaries
 */
import GenesysActor from '@/actor/GenesysActor';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';
import { CombatPool } from '@/data/Actors';
import IHasPreCreate from '@/data/IHasPreCreate';

export default abstract class NemesisDataModel extends AdversaryDataModel implements IHasPreCreate<GenesysActor<NemesisDataModel>> {
	abstract wounds: CombatPool;
	abstract strain: CombatPool;

	async preCreate(actor: GenesysActor<NemesisDataModel>, _data: PreDocumentId<any>, _options: DocumentModificationContext<GenesysActor<NemesisDataModel>>, _user: foundry.documents.BaseUser) {
		const prototypeToken = {
			bar1: { attribute: 'wounds' },
			bar2: { attribute: 'strain' },
			actorLink: true,
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
			strain: new fields.SchemaField({
				value: new fields.NumberField({ initial: 0 }),
				max: new fields.NumberField({ initial: 0 }),
			}),
		};
	}
}
