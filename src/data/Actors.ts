/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Generic data types relevant to Actor types.
 */

export type Defense = {
	melee: number;
	ranged: number;
};

export type CombatPool = {
	value: number;
	max: number;
};
