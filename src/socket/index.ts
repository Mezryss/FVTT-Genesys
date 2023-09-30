/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Root for Socket utilities
 */

/**
 * Identifier used for Genesys-originated socket messages
 */
export const SOCKET_NAME = 'system.genesys';

/**
 * Enum containing all possible socket operations.
 *
 * Every entry should have a corresponding overload specified for {@link emit}.
 */
export enum SocketOperation {
	/**
	 * Called when a player spends a Story Point.
	 */
	PlayerSpendStoryPoint,

	/**
	 * Forcibly update the StoryPointTracker data.
	 */
	UpdateStoryPointTracker,

	/**
	 * Called when a player wants to claim an initiative slot.
	 */
	ClaimInitiativeSlot,

	/**
	 * Update the turns for the Combat Tracker.
	 */
	UpdateCombatTracker,

	/**
	 * Called when a player rolls initiative for an extra slot.
	 */
	UpdateInitiativeForExtraSlot,
}

export type CombatSocketBaseData = {
	/**
	 * Combat ID to claim a slot in.
	 */
	combatId: string;
};

export type ClaimInitiativeSlotData = CombatSocketBaseData & {
	/**
	 * Combatant ID claiming the slot.
	 */
	combatantId: string;

	/**
	 * Round to claim a slot in.
	 */
	round: number;

	/**
	 * Slot to claim.
	 */
	slot: number;
};

export type UpdateInitiativeForExtraSlotData = CombatSocketBaseData & {
	/**
	 * An array of updates to apply to the extra initiative slots.
	 */
	updates: { index: number; initiative: number }[];

	/**
	 * If the combat turn should be updated after adding the new initiative values.
	 */
	updateTurn: boolean;
};

/**
 * Socket Payload typing
 */
export type SocketPayload<T extends { [key: string]: unknown }> = {
	operation: SocketOperation;
	data?: T;
};

/**
 * Spend a Story Point.
 */
export function emit(operation: SocketOperation.PlayerSpendStoryPoint): void;

/**
 * Force the Story Point Tracker application to refresh its data.
 */
export function emit(operation: SocketOperation.UpdateStoryPointTracker): void;

/**
 * Claim an Initiative slot.
 */
export function emit(operation: SocketOperation.ClaimInitiativeSlot, data: ClaimInitiativeSlotData): void;

/**
 * Refresh the Combat Tracker's data.
 */
export function emit(operation: SocketOperation.UpdateCombatTracker, data: CombatSocketBaseData): void;

/**
 * Update the initiative value of some extra slots.
 */
export function emit(operation: SocketOperation.UpdateInitiativeForExtraSlot, data: UpdateInitiativeForExtraSlotData): void;

/**
 * Utility wrapper for the system's socket emits, providing type-safe argument checking for each operation.
 *
 * @see {@link SocketOperation}
 */
export function emit<T extends { [key: string]: unknown }>(operation: SocketOperation, data?: T): void {
	const payload: SocketPayload<T> = {
		operation,
		data,
	};

	game.socket.emit(SOCKET_NAME, payload);
}
