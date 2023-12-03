// Utility interface to mark Document DataModel instances that have custom onDelete callbacks.
export default interface IHasOnDelete<DocumentType extends foundry.abstract.Document> {
	onDelete?(document: DocumentType, options: DocumentModificationContext<DocumentType>, userId: string): void;
}
