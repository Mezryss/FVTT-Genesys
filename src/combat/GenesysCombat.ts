/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */

import GenesysCombatant from '@/combat/GenesysCombatant';
import GenesysRoller from '@/dice/GenesysRoller';
import DicePrompt from '@/app/DicePrompt';

export default class GenesysCombat extends Combat {
	initiativeSkills: string[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override async rollInitiative(ids: string | string[], { formula = null, updateTurn = true, messageOptions = {} }: RollInitiativeOptions = {}, prompt: boolean = false) {
		ids = typeof ids === 'string' ? [ids] : ids;
		const currentId = this.combatant?.id;
		const chatRollMode = game.settings.get('core', 'rollMode');

		const updates: any[] = [];
		const messages: any[] = [];
		for (const [i, id] of ids.entries()) {
			// Combatant data
			const combatant = this.combatants.get(id) as Embedded<GenesysCombatant> | undefined;
			if (!combatant?.isOwner) {
				continue;
			}

			// Initiative roll result
			let skillName = combatant.initiativeSkillName ?? this.initiativeSkills[0] ?? 'Unskilled';
			const skillId = combatant.actor.items.find((i) => i.type === 'skill' && i.name.toLowerCase() === skillName.toLowerCase())?.id ?? '-';
			let roll: Roll | undefined;

			if (prompt) {
				try {
					const promptedRoll = await DicePrompt.promptForInitiative(combatant.actor, skillId, { startingDifficulty: 0 });

					roll = promptedRoll.roll;
					skillName = promptedRoll.skillName ?? 'Unskilled';
				} catch {
					continue;
				}
			}

			if (!roll) {
				roll = combatant.getInitiativeRoll(skillName);
			}

			await roll.evaluate({ async: true });
			const results = await GenesysRoller.parseRollResults(roll);
			updates.push({ _id: combatant.id, initiative: results.netSuccess + results.netAdvantage / 100 });

			const rollData = {
				description: game.i18n.format('Genesys.Rolls.Description.Initiative', { skill: skillName }),
				results,
			};
			const html = await renderTemplate('systems/genesys/templates/chat/rolls/skill.hbs', rollData);

			const chatData = {
				user: game.user.id,
				speaker: { actor: combatant.actorId },
				rollMode: 'rollMode' in messageOptions ? messageOptions.rollMode : combatant.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode,
				content: html,
				type: CONST.CHAT_MESSAGE_TYPES.ROLL,
				sound: i > 0 ? null : CONFIG.sounds.dice,
				roll,
			};

			messages.push(chatData);
		}

		if (!updates.length) {
			return this;
		}

		await this.updateEmbeddedDocuments('Combatant', updates);

		if (updateTurn && currentId) {
			await this.update({ turn: this.turns.findIndex((t) => t.id === currentId) });
		}

		await ChatMessage.implementation.create(messages);
		return this;
	}
}
