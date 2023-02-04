/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Base Genesys Item
 */

import GenesysActor from '@/actor/GenesysActor';
import BaseItemDataModel from '@/item/data/BaseItemDataModel';
import IHasPreCreate from '@/data/IHasPreCreate';

/**
 * Item class used as a base for all Genesys items.
 */
export default class GenesysItem<ItemDataModel extends foundry.abstract.DataModel = BaseItemDataModel> extends Item<GenesysActor> {
	/**
	 * Specialized property for accessing `item.system` in a typed manner.
	 */
	get systemData(): ItemDataModel {
		return <ItemDataModel>this.system;
	}

	protected override async _preCreate(data: PreDocumentId<this['_source']>, options: DocumentModificationContext<this>, user: foundry.documents.BaseUser) {
		await (<IHasPreCreate<this>>this.systemData).preCreate?.(this, data, options, user);

		return super._preCreate(data, options, user);
	}
}
