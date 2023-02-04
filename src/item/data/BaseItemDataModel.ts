/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Basic data model
 */

/**
 * Base data model shared by all Item documents.
 *
 * This class (and all subclasses) should be made abstract to deal with the way Foundry handles populating data for the schema.
 * By marking the class as abstract, TypeScript won't try to define the properties - which means Foundry is free to do as it wishes.
 * In this way, we can safely define the value types (to allow for typed access) on the data model. This works only because we never
 * have reason to instantiate any of the DataModel classes ourselves.
 */
export default abstract class BaseItemDataModel extends foundry.abstract.DataModel {
	abstract description: string;
	abstract source: string;

	static override defineSchema() {
		const fields = foundry.data.fields;

		return {
			description: new fields.HTMLField(),
			source: new fields.StringField(),
		};
	}
}
