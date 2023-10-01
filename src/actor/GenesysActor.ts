/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Base Genesys Actor
 */
import GenesysCombat from '@/combat/GenesysCombat';
import GenesysCombatant from '@/combat/GenesysCombatant';
import IHasPreCreate from '@/data/IHasPreCreate';

export default class GenesysActor<ActorDataModel extends foundry.abstract.DataModel = foundry.abstract.DataModel> extends Actor {
	/**
	 * Specialized property for accessing `actor.system` in a typed manner.
	 */
	get systemData(): ActorDataModel {
		return <ActorDataModel>this.system;
	}

	/**
	 * Override the _preCreate callback to call preCreate from the data model class, if present.
	 * @inheritDoc
	 */
	protected override async _preCreate(data: PreDocumentId<this['_source']>, options: DocumentModificationContext<this>, user: User) {
		await (<IHasPreCreate<this>>this.systemData).preCreate?.(this, data, options, user);

		return super._preCreate(data, options, user);
	}

	/**
	 * Override the createDialog callback to include an unique class that identifies the created dialog.
	 * @inheritDoc
	 */
	static override createDialog(data?: { folder?: string | undefined } | undefined, options?: Partial<FormApplicationOptions> | undefined): Promise<ClientDocument<foundry.documents.BaseActor> | undefined> {
		// The 'dialog' class needs to be added explicitly, otherwise it won't be added by the super call.
		const touchedOptions = {
			...options,
			classes: [...(options?.classes ?? []), 'dialog', 'dialog-actor-create'],
		};

		return super.createDialog(data, touchedOptions);
	}

	/**
	 * Override the rollInitiative method to include rolling for all extra slots tied to the actor.
	 * @inheritDoc
	 */
	override async rollInitiative({ createCombatants = false, rerollInitiative = false, initiativeOptions = {} }: { createCombatants?: boolean; rerollInitiative?: boolean; initiativeOptions?: object } | undefined = {}) {
		const combat = (await super.rollInitiative({ createCombatants, rerollInitiative, initiativeOptions })) as GenesysCombat;

		const extraSlots = combat.extraSlotsForRound(combat.round);
		const extraInitiativeRolls = extraSlots.reduce(
			(accum, slot) => {
				const combatant = combat.combatants.get(slot.activationSource) as GenesysCombatant | undefined;

				if (
					// Make sure the combatant is linked to this actor.
					combatant &&
					((this.isToken && combatant.token === this.token) || (!this.isToken && combatant.actor === this)) &&
					// Only roll if the actor doesn't have an initiative value or if forcing a reroll.
					(rerollInitiative || slot.initiative === null)
				) {
					accum.combatantsIds.push(combatant.id);
					accum.activationIds.push(slot.index);
				}

				return accum;
			},
			{ combatantsIds: [], activationIds: [] } as { combatantsIds: string[]; activationIds: number[] },
		);

		await combat.rollInitiative(extraInitiativeRolls.combatantsIds, initiativeOptions, { extraSlotsRolls: extraInitiativeRolls.activationIds });
		return combat;
	}
}
