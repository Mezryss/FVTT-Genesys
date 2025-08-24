// @ts-nocheck -- The types we have are not v13 compatible

const ExtendedClass = foundry?.applications?.sidebar?.tabs?.CombatTracker ?? CombatTracker<GenesysCombat>;
export default class GenesysCombatTracker extends ExtendedClass {
	override _onRollInitiative(combatant) {
		return this.viewed.rollInitiative([combatant.id], undefined, { prompt: true });
	}
}
