/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Utility interface to mark Document DataModel instances that have custom preCreate callbacks.
 */

export default interface IHasPreCreate<DocumentType extends foundry.abstract.Document> {
	preCreate?(document: DocumentType, data: PreDocumentId<any>, options: DocumentModificationContext<DocumentType>, user: foundry.documents.BaseUser): Promise<void>;
}
