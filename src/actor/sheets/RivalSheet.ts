/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Rival Sheet
 */

import RivalDataModel from '@/actor/data/RivalDataModel';
import AdversarySheet from '@/actor/sheets/AdversarySheet';
import VueRivalSheet from '@/vue/sheets/actor/RivalSheet.vue';

/**
 * Actor sheet used for Player Characters
 */
export default class RivalSheet extends AdversarySheet<RivalDataModel> {
	override get vueComponent() {
		return VueRivalSheet;
	}
}
