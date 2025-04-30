/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */

import GenesysActor from '@/actor/GenesysActor';
import GenesysDie from '@/dice/types/GenesysDie';
import { Characteristic } from '@/data/Characteristics';
import GenesysItem from '@/item/GenesysItem';
import WeaponDataModel from '@/item/data/WeaponDataModel';
import VehicleWeaponDataModel from '@/item/data/VehicleWeaponDataModel';

export type GenesysRollResults = {
	/**
	 * Total number of successes that were rolled, including the one added by Triumphs. Always >= 0.
	 */
	totalSuccess: number;

	/**
	 * Total number of failures that were rolled, including the one added by Despairs. Always >= 0.
	 */
	totalFailures: number;

	/**
	 * Total number of advantages that were rolled. Always >= 0.
	 */
	totalAdvantage: number;

	/**
	 * Total number of threats that were rolled. Always >= 0.
	 */
	totalThreat: number;

	/**
	 * Total number of triumphs that were rolled. Always >= 0.
	 */
	totalTriumph: number;

	/**
	 * Total number of despairs that were rolled. Always >= 0.
	 */
	totalDespair: number;

	/**
	 * Number of successes left over in the roll after cancelling out with failures. May be negative if there were more failures.
	 */
	netSuccess: number;

	/**
	 * Number of failures left over in the roll after cancelling out with successes. May be negative if there were more successes.
	 */
	netFailure: number;

	/**
	 * Number of advantages left over in the roll after cancelling out with threats. May be negative if there were more threats.
	 */
	netAdvantage: number;

	/**
	 * Number of threats left over in the roll after cancelling out with advantages. May be negative if there were more advantages.
	 */
	netThreat: number;

	/**
	 * A map of die type to all the result faces from the roll.
	 */
	faces: Record<string, string[]>;

	/**
	 * Extra symbols added to the roll.
	 */
	extraSymbols: Record<string, number>;
};

export default class GenesysRoller {
	static async skillRoll({
		actor,
		characteristic,
		usesSuperCharacteristic,
		skillId,
		formula,
		symbols,
	}: {
		actor?: GenesysActor;
		characteristic?: Characteristic;
		usesSuperCharacteristic: boolean;
		skillId: string;
		formula: string;
		symbols: Record<string, number>;
	}) {
		const roll = new Roll(formula, { symbols });
		await roll.evaluate();
		const results = this.parseRollResults(roll);

		let description: string | undefined = undefined;

		if (skillId === '-') {
			if (characteristic) {
				description = game.i18n.format('Genesys.Rolls.Description.Characteristic', {
					characteristic: game.i18n.localize(`Genesys.Characteristics.${characteristic.capitalize()}`),
				});
			} else if (!actor) {
				description = game.i18n.format('Genesys.Rolls.Description.Simple', {
					superChar: usesSuperCharacteristic ? 'super-char' : 'hide-it',
				});
			}
		} else if (actor) {
			if (characteristic) {
				description = game.i18n.format('Genesys.Rolls.Description.Skill', {
					skill: actor.items.get(skillId)?.name ?? 'UNKNOWN',
					characteristic: game.i18n.localize(`Genesys.CharacteristicAbbr.${characteristic.capitalize()}`),
					superChar: usesSuperCharacteristic ? 'super-char' : 'hide-it',
				});
			} else {
				description = game.i18n.format('Genesys.Rolls.Description.SkillWithoutCharacteristic', {
					skill: actor.items.get(skillId)?.name ?? 'UNKNOWN',
				});
			}
		}

		const rollData = {
			description: description,
			results,
		};
		const html = await renderTemplate('systems/genesys/templates/chat/rolls/skill.hbs', rollData);

		const chatData = {
			user: game.user.id,
			speaker: { actor: actor?.id },
			content: html,
			type: CONST.CHAT_MESSAGE_TYPES.ROLL,
			rolls: [roll],
		};
		await ChatMessage.create(chatData);
	}

	static async attackRoll({
		actor,
		characteristic,
		usesSuperCharacteristic,
		skillId,
		formula,
		symbols,
		weapon,
	}: {
		actor?: GenesysActor;
		characteristic?: Characteristic;
		usesSuperCharacteristic: boolean;
		skillId: string;
		formula: string;
		symbols: Record<string, number>;
		weapon: GenesysItem<WeaponDataModel | VehicleWeaponDataModel>;
	}) {
		const roll = new Roll(formula, { symbols });
		await roll.evaluate();
		const results = this.parseRollResults(roll);

		let description: string | undefined = undefined;

		let totalDamage = weapon.systemData.baseDamage;
		let damageFormula = weapon.systemData.baseDamage.toString();

		const withDamageCharacteristic = (weapon.systemData as WeaponDataModel).damageCharacteristic;
		if (actor && withDamageCharacteristic && withDamageCharacteristic !== '-') {
			totalDamage += (actor.system as any).characteristics[withDamageCharacteristic] as number;
			damageFormula = game.i18n.localize(`Genesys.CharacteristicAbbr.${withDamageCharacteristic.capitalize()}`) + ` + ${damageFormula}`;
		}

		if (results.netSuccess > 0) {
			totalDamage += results.netSuccess;
		}

		if (skillId === '-') {
			if (characteristic) {
				description = game.i18n.format('Genesys.Rolls.Description.AttackCharacteristic', {
					name: weapon.name,
					characteristic: game.i18n.localize(`Genesys.Characteristics.${characteristic.capitalize()}`),
				});
			}
		} else if (actor) {
			if (characteristic) {
				description = game.i18n.format('Genesys.Rolls.Description.AttackSkill', {
					name: weapon.name,
					skill: actor.items.get(skillId)?.name ?? 'UNKNOWN',
					characteristic: game.i18n.localize(`Genesys.CharacteristicAbbr.${characteristic.capitalize()}`),
					superChar: usesSuperCharacteristic ? 'super-char' : 'hide-it',
				});
			} else {
				description = game.i18n.format('Genesys.Rolls.Description.AttackSkillWithoutCharacteristic', {
					name: weapon.name,
					skill: actor.items.get(skillId)?.name ?? 'UNKNOWN',
				});
			}
		}

		const attackQualities = weapon.systemData.qualities;
		await Promise.all(
			attackQualities.map(async (quality) => {
				quality.description = await TextEditor.enrichHTML(quality.description, { async: true });
			}),
		);

		const rollData = {
			description: description,
			results,
			totalDamage,
			damageFormula,
			critical: weapon.systemData.critical,
			// tbh I can't be assed to implement another Handlebars helper for array length so let's just do undefined. <.<
			qualities: weapon.systemData.qualities.length === 0 ? undefined : attackQualities,
			showDamageOnFailure: CONFIG.genesys.settings.showAttackDetailsOnFailure,
		};
		const html = await renderTemplate('systems/genesys/templates/chat/rolls/attack.hbs', rollData);

		const chatData = {
			user: game.user.id,
			speaker: { actor: actor?.id },
			rollMode: game.settings.get('core', 'rollMode'),
			content: html,
			type: CONST.CHAT_MESSAGE_TYPES.ROLL,
			rolls: [roll],
		};
		await ChatMessage.create(chatData);
	}

	static parseRollResults(roll: Roll): GenesysRollResults {
		const faces = roll.dice.reduce((faces: Record<string, string[]>, die) => {
			const genDie = <GenesysDie>die;
			if (faces[genDie.denomination] === undefined) {
				faces[genDie.denomination] = die.results.map((r) => genDie.getResultLabel(r));
			} else {
				faces[genDie.denomination].concat(die.results.map((r) => genDie.getResultLabel(r)));
			}

			return faces;
		}, {});

		// Get symbols from the dice results.
		const results = Object.values(faces)
			.flatMap((v) => v)
			.flatMap((v) => v.split(''))
			.filter((v) => v !== ' ')
			.reduce(
				(results: Record<string, number>, result) => {
					results[result] += 1;

					return results;
				},
				{
					a: 0,
					s: 0,
					t: 0,
					h: 0,
					f: 0,
					d: 0,
				},
			);

		// Add extra symbols specified by the roll.
		const extraSymbols = <Record<string, number>>roll.data.symbols;
		if (extraSymbols) {
			for (const symbol of ['a', 's', 't', 'h', 'f', 'd']) {
				results[symbol] += extraSymbols[symbol] ?? 0;
			}
		}

		// Threat & Triumph add successes & failures.
		results['s'] += results['t'];
		results['f'] += results['d'];

		return {
			totalSuccess: results['s'],
			totalFailures: results['f'],
			totalAdvantage: results['a'],
			totalThreat: results['h'],
			totalTriumph: results['t'],
			totalDespair: results['d'],

			netSuccess: results['s'] - results['f'],
			netFailure: results['f'] - results['s'],
			netAdvantage: results['a'] - results['h'],
			netThreat: results['h'] - results['a'],

			faces,
			extraSymbols,
		};
	}
}
