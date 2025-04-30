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
import { Characteristic } from '@/data/Characteristics';
import { ClaimInitiativeSlotData, emit as socketEmit, SOCKET_NAME, SocketOperation, SocketPayload, CombatSocketBaseData, UpdateInitiativeForExtraSlotData } from '@/socket';

const FLAG_CLAIMANTS = 'claimants';
const FLAG_EXTRA_SLOTS = 'extraSlots';

type ClaimantData = Record<number, Record<number, string | undefined>>;

type ExtraCombatSlot = {
	activationSource: string;
	initiative: number | null;
	startingRound: number;
	index: number;
};

type CombatSlotInfo = {
	slotOrigin: GenesysCombatant;
	initiative: number | null;
	disposition: 'friendly' | 'neutral' | 'hostile';
	id: string;
};

export type GenesysRollInitiativeOptions = {
	prompt?: boolean;
	extraSlotsRolls?: number[];
};

export type InitiativeSkill = {
	skillName: string;
	skillChar: Characteristic;
};

export default class GenesysCombat extends Combat {
	initiativeSkills: InitiativeSkill[] = [];

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

	extraSlotsForRound(round: number) {
		const extraSlots = (this.getFlag('genesys', FLAG_EXTRA_SLOTS) ?? []) as Omit<ExtraCombatSlot, 'index'>[];

		return extraSlots.reduce((accum, slot, index) => {
			if (slot.startingRound <= round) {
				accum.push({ ...slot, index });
			}
			return accum;
		}, [] as ExtraCombatSlot[]);
	}

	async addExtraSlot(combatantId: string, round: number) {
		const extraSlots = [...((this.getFlag('genesys', FLAG_EXTRA_SLOTS) ?? []) as Omit<ExtraCombatSlot, 'index'>[])];

		extraSlots.push({
			activationSource: combatantId,
			initiative: null,
			startingRound: round,
		});

		await this.setFlag('genesys', FLAG_EXTRA_SLOTS, extraSlots);
	}

	async updateExtraSlotsInitiative(updates: Omit<ExtraCombatSlot, 'activationSource' | 'startingRound'>[]) {
		const extraSlots = (this.getFlag('genesys', FLAG_EXTRA_SLOTS) ?? []) as Omit<ExtraCombatSlot, 'index'>[];

		for (const update of updates) {
			extraSlots[update.index].initiative = update.initiative;
		}

		await this.setFlag('genesys', FLAG_EXTRA_SLOTS, extraSlots);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override async rollInitiative(ids: string | string[], { formula = null, updateTurn = true, messageOptions = {} }: RollInitiativeOptions = {}, { prompt = false, extraSlotsRolls = [] }: GenesysRollInitiativeOptions = {}) {
		ids = typeof ids === 'string' ? [ids] : ids;
		const currentId = this.combatant?.id;
		const chatRollMode = game.settings.get('core', 'rollMode');

		const remainingExtraSlotsRolls = [...extraSlotsRolls];
		const extraSlotsPerCombatant = this.extraSlotsForRound(this.round).reduce(
			(accum, slot, index) => {
				if (accum[slot.activationSource]) {
					accum[slot.activationSource].push(index);
				} else {
					accum[slot.activationSource] = [index];
				}
				return accum;
			},
			{} as Record<string, number[]>,
		);

		let ignoreUpdateTurn = false;
		const extraSlotsUpdates: { index: number; initiative: number }[] = [];
		const combatantsUpdates: { _id: string; initiative: number }[] = [];
		const messages: any[] = [];
		for (const [i, id] of ids.entries()) {
			// Combatant data
			const combatant = this.combatants.get(id) as Embedded<GenesysCombatant> | undefined;
			if (!combatant?.isOwner) {
				continue;
			}

			// Initiative roll result
			let skillName = combatant.initiativeSkill?.skillName ?? this.initiativeSkills[0]?.skillName ?? 'Unskilled';
			let roll: Roll | undefined;

			if (prompt) {
				try {
					const promptedRoll = await DicePrompt.promptForInitiative(combatant.actor, skillName, { difficulty: '' });

					roll = promptedRoll.roll;
					skillName = promptedRoll.skillName;
				} catch {
					continue;
				}
			}

			if (!roll) {
				const charFallback = combatant.initiativeSkill?.skillChar ?? this.initiativeSkills[0]?.skillChar;
				roll = combatant.getInitiativeRoll(skillName, charFallback);
			}

			await roll.evaluate();
			const results = GenesysRoller.parseRollResults(roll);
			const superCharClass = roll.formula.toLowerCase().includes('dpx') ? 'super-char' : 'hide-it';
			const newInitiative = results.netSuccess + results.netAdvantage / 100;

			if (extraSlotsPerCombatant[combatant.id]) {
				// Check if the combatant is tied to an extra initiative slot that we want to roll.
				const resrIndex = remainingExtraSlotsRolls.findIndex((slotId) => extraSlotsPerCombatant[combatant.id].includes(slotId));
				if (resrIndex === -1) {
					combatantsUpdates.push({ _id: combatant.id, initiative: newInitiative });
				} else {
					const extraSlotIndex = remainingExtraSlotsRolls.splice(resrIndex, 1)[0];
					extraSlotsUpdates.push({ index: extraSlotIndex, initiative: newInitiative });
				}
			} else {
				combatantsUpdates.push({ _id: combatant.id, initiative: newInitiative });
			}

			const rollData = {
				description: game.i18n.format('Genesys.Rolls.Description.Initiative', { skill: skillName, superChar: superCharClass }),
				results,
			};
			const html = await renderTemplate('systems/genesys/templates/chat/rolls/skill.hbs', rollData);

			const chatData = {
				user: game.user.id,
				speaker: { actor: combatant.actorId },
				rollMode: 'rollMode' in messageOptions ? messageOptions.rollMode : combatant.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode,
				content: html,
				sound: i > 0 ? null : CONFIG.sounds.dice,
				rolls: [roll],
			};

			messages.push(chatData);
		}

		if (!messages.length) {
			return this;
		}

		if (extraSlotsUpdates.length) {
			if (game.user.isGM) {
				this.updateExtraSlotsInitiative(extraSlotsUpdates);

				// Force a re-calculation of turns and a re-render of the tracker if there are no updates that would do it for us.
				if (!combatantsUpdates.length) {
					this.setupTurns();
					this.debounceTrackerRender();
					socketEmit(SocketOperation.UpdateCombatTracker, { combatId: this.id });
				}
			} else {
				ignoreUpdateTurn = true;
				socketEmit(SocketOperation.UpdateInitiativeForExtraSlot, {
					combatId: this.id,
					updates: extraSlotsUpdates,
					updateTurn,
				});
			}
		}

		if (combatantsUpdates.length) {
			await this.updateEmbeddedDocuments('Combatant', combatantsUpdates);
		}

		if (!ignoreUpdateTurn && updateTurn && currentId) {
			await this.update({ turn: this.turns.findIndex((t) => t.id === currentId) });
		}

		await ChatMessage.implementation.create(messages);
		return this;
	}

	async addInitiativeSlot() {
		const controlledTokenCount = canvas.tokens.controlled.length;
		if (controlledTokenCount !== 1) {
			ui.notifications.warn(game.i18n.localize('Genesys.Notifications.SelectOneTokenForAction'));
			return;
		}

		const combatant = canvas.tokens.controlled[0].combatant as GenesysCombatant;
		if (!combatant) {
			ui.notifications.warn(game.i18n.localize('Genesys.Notifications.TokenIsNotCombatant'));
			return;
		}

		await this.addExtraSlot(combatant.id, this.round);

		// Force a re-calculation of turns and a re-render of the tracker
		this.setupTurns();
		this.debounceTrackerRender();
		socketEmit(SocketOperation.UpdateCombatTracker, { combatId: this.id });
	}

	override async resetAll() {
		this.updateExtraSlotsInitiative(
			this.extraSlotsForRound(this.round).map((slot) => ({
				index: slot.index,
				initiative: null,
			})),
		);

		return await super.resetAll();
	}

	override async rollAll(options?: RollInitiativeOptions | undefined, onlyNPCs: boolean = false) {
		const combatantIds = this.combatants.reduce((accum, combatant) => {
			if (combatant.isOwner && (!onlyNPCs || combatant.isNPC) && combatant.initiative === null) {
				accum.push(combatant.id);
			}
			return accum;
		}, [] as string[]);

		const extraSlotsRolls = this.extraSlotsForRound(this.round).reduce((accum, slot) => {
			if (slot.initiative === null) {
				const combatant = this.combatants.get(slot.activationSource) as GenesysCombatant | undefined;
				if (combatant && combatant.isOwner && (!onlyNPCs || combatant.isNPC)) {
					combatantIds.push(combatant.id);
					accum.push(slot.index);
				}
			}
			return accum;
		}, [] as number[]);

		return this.rollInitiative(combatantIds, options, { extraSlotsRolls });
	}

	override async rollNPC(options?: RollInitiativeOptions | undefined) {
		return this.rollAll(options, true);
	}

	override setupTurns() {
		const combatants = this.combatants.map(
			(combatant) =>
				({
					slotOrigin: combatant as GenesysCombatant,
					initiative: combatant.initiative,
					disposition: (combatant as GenesysCombatant).disposition,
					id: combatant.id,
				}) as CombatSlotInfo,
		);

		const extraActivations = this.extraSlotsForRound(this.round).reduce((accum, slot) => {
			const combatant = this.combatants.get(slot.activationSource) as GenesysCombatant | undefined;
			if (combatant) {
				accum.push({
					slotOrigin: combatant,
					initiative: slot.initiative,
					disposition: combatant.disposition,
					id: combatant.id,
				});
			}
			return accum;
		}, [] as CombatSlotInfo[]);

		const turns = combatants
			.concat(extraActivations)
			.sort(this._sortSlots)
			.map((slotData) => slotData.slotOrigin);

		if (this.turn !== null) {
			// @ts-ignore: This assignment is exactly the same as in the original method.
			this.turn = Math.clamp(this.turn, 0, turns.length - 1);
		}

		const currentCombatant = turns[this.turn];
		this.current = {
			round: this.round,
			turn: this.turn,
			combatantId: currentCombatant ? currentCombatant.id : null,
			tokenId: currentCombatant ? currentCombatant.tokenId : null,
		};

		if (!this.previous) {
			this.previous = this.current;
		}

		return (this.turns = turns as any);
	}

	protected _sortSlots(firstSlot: CombatSlotInfo, secondSlot: CombatSlotInfo) {
		const fsInitiative = firstSlot.initiative ?? -Infinity;
		const ssInitiative = secondSlot.initiative ?? -Infinity;

		// Sort by initiative value in descending order.
		if (fsInitiative === ssInitiative) {
			// Break initiative ties by using the combatants' disposition.
			if (firstSlot.disposition === secondSlot.disposition) {
				// Break ties in the combatants' disposition by using their id.
				if (firstSlot.id === secondSlot.id) {
					return 0;
				} else {
					return firstSlot.id > secondSlot.id ? 1 : -1;
				}
			} else {
				const dispositions = ['hostile', 'neutral', 'friendly'];
				return dispositions.indexOf(secondSlot.disposition) - dispositions.indexOf(firstSlot.disposition);
			}
		} else {
			return ssInitiative - fsInitiative;
		}
	}

	/**
	 * If this is the currently viewed encounter, re-render the CombatTracker application.
	 * We debounce this call to allow for updates to complete.
	 */
	debounceTrackerRender = foundry.utils.debounce(() => {
		if (ui.combat.viewed === this) {
			ui.combat.render();
		}
	}, 50);
}

/**
 * Register socket listener for Genesys Combats
 */
export function register() {
	// Helper function to determine if the code is being executed by only one GM.
	const isGmHub = () => {
		return game.user.isGM && game.users.filter((user) => user.isGM && user.active).every((candidate) => candidate.id >= game.user.id);
	};

	game.socket.on(SOCKET_NAME, async (payload: SocketPayload<CombatSocketBaseData>) => {
		if (!payload.data) {
			return;
		}

		const combat = game.combats.get(payload.data.combatId) as GenesysCombat | undefined;
		if (!combat) {
			console.error(`Socket received ${SocketOperation[payload.operation]} payload with invalid combat ID ${payload.data.combatId}`);
			return;
		}

		switch (payload.operation) {
			case SocketOperation.ClaimInitiativeSlot:
				if (!isGmHub()) {
					return;
				}

				const cisData = payload.data as ClaimInitiativeSlotData;
				await combat.claimSlot(cisData.round, cisData.slot, cisData.combatantId);
				break;

			case SocketOperation.UpdateCombatTracker:
				combat.setupTurns();
				combat.debounceTrackerRender();
				break;

			case SocketOperation.UpdateInitiativeForExtraSlot:
				if (!isGmHub()) {
					return;
				}

				const uifesData = payload.data as UpdateInitiativeForExtraSlotData;
				const currentCombatantId = combat.combatant?.id;

				await combat.updateExtraSlotsInitiative(uifesData.updates);
				combat.setupTurns();
				combat.debounceTrackerRender();
				socketEmit(SocketOperation.UpdateCombatTracker, { combatId: uifesData.combatId });

				if (uifesData.updateTurn && currentCombatantId) {
					await combat.update({ turn: combat.turns.findIndex((combatant) => combatant.id === currentCombatantId) });
				}
				break;

			default:
				return;
		}
	});
}
