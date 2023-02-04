/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Item Sheet Registration
 */

import VueItemSheet from '@/vue/VueItemSheet';
import AbilitySheet from '@/vue/sheets/item/AbilitySheet.vue';
import ArmorSheet from '@/vue/sheets/item/ArmorSheet.vue';
import EquipmentSheet from '@/vue/sheets/item/EquipmentSheet.vue';
import InjurySheet from '@/vue/sheets/item/InjurySheet.vue';
import ItemQualitySheet from '@/vue/sheets/item/ItemQualitySheet.vue';
import SkillSheet from '@/vue/sheets/item/SkillSheet.vue';
import TalentSheet from '@/vue/sheets/item/TalentSheet.vue';
import WeaponSheet from '@/item/sheets/WeaponSheet';
import ArchetypeSheet from '@/item/sheets/ArchetypeSheet';
import CareerSheet from '@/item/sheets/CareerSheet';

/**
 * Constructs a VueItemSheet subclass with no extra processing - just the sheet itself.
 * @param sheetClass Vue component to use for the sheet.
 */
function basicSheet(sheetClass: any) {
	return class extends VueItemSheet {
		override get vueComponent() {
			return sheetClass;
		}
	};
}

/**
 * Registers Item sheets used by the system.
 */
export function register() {
	Items.unregisterSheet('core', ItemSheet);

	Items.registerSheet('genesys', basicSheet(AbilitySheet), {
		types: ['ability'],
		makeDefault: true,
	});

	Items.registerSheet('genesys', basicSheet(ArmorSheet), {
		types: ['armor'],
		makeDefault: true,
	});

	Items.registerSheet('genesys', basicSheet(EquipmentSheet), {
		types: ['consumable', 'container', 'gear'],
		makeDefault: true,
	});

	Items.registerSheet('genesys', basicSheet(InjurySheet), {
		types: ['injury'],
		makeDefault: true,
	});

	Items.registerSheet('genesys', basicSheet(ItemQualitySheet), {
		types: ['quality'],
		makeDefault: true,
	});

	Items.registerSheet('genesys', basicSheet(SkillSheet), {
		types: ['skill'],
		makeDefault: true,
	});

	Items.registerSheet('genesys', basicSheet(TalentSheet), {
		types: ['talent'],
		makeDefault: true,
	});

	Items.registerSheet('genesys', WeaponSheet, {
		types: ['weapon'],
		makeDefault: true,
	});

	Items.registerSheet('genesys', ArchetypeSheet, {
		types: ['archetype'],
		makeDefault: true,
	});

	Items.registerSheet('genesys', CareerSheet, {
		types: ['career'],
		makeDefault: true,
	});
}
