/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */

import GenesysCombat from '@/combat/GenesysCombat';
import GenesysCombatant from '@/combat/GenesysCombatant';
import GenesysCombatTracker from '@/combat/GenesysCombatTracker';

export function register() {
	CONFIG.Combat.documentClass = GenesysCombat;
	CONFIG.Combatant.documentClass = GenesysCombatant;
	CONFIG.ui.combat = GenesysCombatTracker;
}
