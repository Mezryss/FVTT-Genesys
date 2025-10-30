import { Characteristic } from '@/data/Characteristics';
import GenesysEffect from './GenesysEffect';
import { PoolModGlyphPattern } from '@/dice/types/GenesysPoolModifications';

type EffectChangeExpanded = foundry.data.EffectChangeSource & {
	skill?: string;
	char?: string;
};

export default class GenesysEffectSheetV2 extends ActiveEffectConfig<GenesysEffect> {
	static DEFAULT_OPTIONS = {
		classes: ['effect-sheet-v2'],
	};

	static override PARTS = {
		...super.PARTS,
		changes: { template: 'systems/genesys/templates/sheets/effect-changes-tab.hbs' },
	};

	override async _preparePartContext(partId: string, context: Record<string, unknown>): Promise<Record<string, unknown>> {
		const partContext = await super._preparePartContext(partId, context) as Record<string, unknown> & { source: GenesysEffect };

		if (partId === 'changes') {
			partContext.skills = Object.fromEntries(CONFIG.genesys.skills.map((skill) => [skill.name, skill.name]));
			partContext.characteristics = Object.fromEntries(Object.entries(Characteristic).map(([charName, charKey]) => [charKey, charName]));

			partContext.changes = partContext.source.changes.map((change: foundry.data.EffectChangeSource) => {
				const thisChange = { ...change } as EffectChangeExpanded;
				const extractDicePoolMod = thisChange.key.split(GenesysEffect.DICE_POOL_MOD_KEY_PATTERN);

				if (extractDicePoolMod.length === 2) {
					thisChange.key = extractDicePoolMod[0];

					if (extractDicePoolMod[0].includes(GenesysEffect.DICE_POOL_MOD_CHAR_TYPE)) {
						thisChange.char = extractDicePoolMod[1];
					} else if (extractDicePoolMod[0].includes(GenesysEffect.DICE_POOL_MOD_SKILL_TYPE)) {
						thisChange.skill = extractDicePoolMod[1];
					}
				}

				return thisChange;
			});
		}

		return partContext;
	}

	override _onChangeForm(formConfig: Record<string, unknown>, event: Event) {
		super._onChangeForm(formConfig, event);

		const target = event.target as HTMLElement;
		if (target?.matches('select[name^="changes."][name$=".key"]')) {
			const targetSelect = target as HTMLSelectElement;
			let targetOptionType: string;

			if (GenesysEffect.DICE_POOL_MOD_KEY_PATTERN.test(targetSelect.value)) {
				if (targetSelect.value.includes(GenesysEffect.DICE_POOL_MOD_CHECK_TYPE)) {
					targetOptionType = 'check-selection';
				} else if (targetSelect.value.includes(GenesysEffect.DICE_POOL_MOD_CHAR_TYPE)) {
					targetOptionType = 'characteristic-selection';
				} else if (targetSelect.value.includes(GenesysEffect.DICE_POOL_MOD_SKILL_TYPE)) {
					targetOptionType = 'skill-selection';
				} else {
					targetOptionType = 'effect-mode';
				}
			} else {
				targetOptionType = 'effect-mode';
			}

			const children = targetSelect.closest('li')?.querySelector('.mode')?.children as HTMLCollection;
			for (let k = 0; k < children.length; k++) {
				if (children[k].classList.contains(targetOptionType)) {
					children[k].classList.add('show-it');
				} else {
					children[k].classList.remove('show-it');
				}
			}
		}
	}

	override _processFormData(event: Event, form: HTMLElement, formData: Record<string, unknown>) {
		const formDataExpanded = super._processFormData(event, form, formData) as { changes: EffectChangeExpanded[] };

		const dicePoolModificationPattern = new RegExp(`^${PoolModGlyphPattern.source}*$`);
		formDataExpanded.changes = Object.values(formDataExpanded.changes).map((change: EffectChangeExpanded) => {
			if (GenesysEffect.DICE_POOL_MOD_KEY_PATTERN.test(change.key)) {
				if (change.key.includes(GenesysEffect.DICE_POOL_MOD_CHECK_TYPE)) {
					change.key += '.';
				} else if (change.key.includes(GenesysEffect.DICE_POOL_MOD_CHAR_TYPE)) {
					change.key += `.${change.char}`;
				} else if (change.key.includes(GenesysEffect.DICE_POOL_MOD_SKILL_TYPE)) {
					change.key += `.${change.skill}`;
				}

				change.mode = CONST.ACTIVE_EFFECT_MODES.CUSTOM;
				if (!dicePoolModificationPattern.test(change.value)) {
					change.value = '';
				}

				delete change.char;
				delete change.skill;
			}

			return change;
		});

		return formDataExpanded;
	}
}
