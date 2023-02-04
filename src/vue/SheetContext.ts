/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Provides typing data for RootContext injected into Vue apps.
 */

import GenesysActor from '@/actor/GenesysActor';
import GenesysItem from '@/item/GenesysItem';
import BaseItemDataModel from '@/item/data/BaseItemDataModel';
import VueItemSheet from '@/vue/VueItemSheet';
import VueActorSheet from '@/vue/VueActorSheet';

export type ContextBase = { [key: string]: any };

/**
 * This symbol is used by Vue apps in the system to inject sheet data.
 */
export const RootContext = Symbol('Vue Root Context');

/**
 * Typing for context data injected into Vue sheets.
 */
export interface BaseSheetContext<
	DocumentType extends foundry.abstract.Document = foundry.abstract.Document,
	SheetOptionsType extends DocumentSheetOptions = DocumentSheetOptions,
	SheetType extends DocumentSheet<DocumentType, SheetOptionsType> = DocumentSheet<DocumentType, SheetOptionsType>,
	SheetDataType extends DocumentSheetData<DocumentType> = DocumentSheetData<DocumentType>,
> extends ContextBase {
	/**
	 * A reference to the Sheet instance the vue app is rendering.
	 */
	sheet: SheetType;

	/**
	 * Rendering context data retrieved from `getData()`.
	 */
	data: SheetDataType;
}

export interface GenesysActorSheetData<ActorDataModel extends foundry.abstract.DataModel = foundry.abstract.DataModel> extends ActorSheetData<GenesysActor<ActorDataModel>> {
	actor: GenesysActor<ActorDataModel>;
}

/**
 * Typing for context data injected into Vue Actor sheets.
 */
export interface ActorSheetContext<
	ActorDataModel extends foundry.abstract.DataModel = foundry.abstract.DataModel,
	SheetType extends VueActorSheet<ActorDataModel> = VueActorSheet<ActorDataModel>,
	SheetDataType extends GenesysActorSheetData<ActorDataModel> = GenesysActorSheetData<ActorDataModel>,
> extends ContextBase {
	/**
	 * A reference to the Sheet instance the vue app is rendering.
	 */
	sheet: SheetType;

	/**
	 * Rendering context data retrieved from `getData()`.
	 */
	data: SheetDataType;
}

export interface GenesysItemSheetData<ItemDataModel extends BaseItemDataModel = BaseItemDataModel> extends ItemSheetData<GenesysItem<ItemDataModel>> {
	item: GenesysItem<ItemDataModel>;
}

/**
 * Typing for context data injected into Vue Item sheets.
 */
export interface ItemSheetContext<
	ItemDataModel extends BaseItemDataModel = BaseItemDataModel,
	SheetType extends VueItemSheet<ItemDataModel> = VueItemSheet<ItemDataModel>,
	SheetDataType extends GenesysItemSheetData<ItemDataModel> = GenesysItemSheetData<ItemDataModel>,
> extends ContextBase {
	/**
	 * A reference to the Sheet instance the vue app is rendering.
	 */
	sheet: SheetType;

	/**
	 * Rendering context data retrieved from `getData()`.
	 */
	data: SheetDataType;
}
