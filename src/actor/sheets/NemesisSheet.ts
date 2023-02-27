/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Nemesis Sheet
 */

import AdversarySheet from '@/actor/sheets/AdversarySheet';
import VueNemesisSheet from '@/vue/sheets/actor/NemesisSheet.vue';

/**
 * Actor sheet used for Player Characters
 */
export default class NemesisSheet extends AdversarySheet {
	override get vueComponent() {
		return VueNemesisSheet;
	}
}
