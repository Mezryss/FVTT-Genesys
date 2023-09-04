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
import { ClaimInitiativeSlotData, emit as socketEmit, SOCKET_NAME, SocketOperation, SocketPayload } from '@/socket';

const FLAG_CLAIMANTS = 'claimants';

type ClaimantData = Record<number, Record<number, string | undefined>>;

export default class GenesysCombat extends Combat {
	initiativeSkills: string[] = [];

	claimantForSlot(round: number, slot: number): string | undefined {
		const claimants = this.getFlag('genesys', FLAG_CLAIMANTS) as ClaimantData | undefined;

		if (!claimants) {
			return undefined;
		}

		return claimants[round]?.[slot];
	}

	async claimSlot(round: number, slot: number, combatantId: string) {
		if (!game.user.isGM) {
			socketEmit(SocketOperation.ClaimInitiativeSlot, {
				combatId: this.id,
				combatantId,
				round,
				slot,
			});
			return;
		}

		const claimants = { ...(this.getFlag('genesys', FLAG_CLAIMANTS) as ClaimantData | undefined) };

		if (!claimants[round]) {
			claimants[round] = {};
		}

		claimants[round][slot] = combatantId;

		await this.setFlag('genesys', FLAG_CLAIMANTS, claimants);
	}

	async revokeSlot(round: number, slot: number) {
		if (!game.user.isGM) {
			return;
		}

		await this.unsetFlag('genesys', `claimants.${round}.${slot}`);
	}

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

/**
 * Register socket listener for Genesys Combats
 */
export function register() {
	game.socket.on(SOCKET_NAME, async (payload: SocketPayload<ClaimInitiativeSlotData>) => {
		if (!game.user.isGM || payload.operation !== SocketOperation.ClaimInitiativeSlot || !payload.data) {
			return;
		}

		// Only one GM should execute the rest of the code.
		const isHub = game.users.filter((user) => user.isGM && user.active).every((candidate) => candidate.id >= game.user.id);
		if (!isHub) {
			return;
		}

		const combat = game.combats.get(payload.data.combatId) as GenesysCombat | undefined;
		if (!combat) {
			console.error(`Socket received Claim Initiative payload with invalid combat ID ${payload.data.combatId}`);
			return;
		}

		await combat.claimSlot(payload.data.round, payload.data.slot, payload.data.combatantId);
	});
}
