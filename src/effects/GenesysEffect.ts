/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file ActiveEffects Customizations
 */
import GenesysItem from '@/item/GenesysItem';
import GenesysActor from '@/actor/GenesysActor';
import TalentDataModel from '@/item/data/TalentDataModel';

export default class GenesysEffect extends ActiveEffect {
	override get isSuppressed() {
		return this.disabled;
	}

	// Prefix string used to identify active effects that are supposed to modify a dice pool.
	static DICE_POOL_MOD_KEY_PREFIX = 'genesys.pool.';

	// Indetifiers for the different types of rolls for which we can modify the dice pool.
	static DICE_POOL_MOD_CHECK_TYPE = 'check.';
	static DICE_POOL_MOD_CHAR_TYPE = 'char.';
	static DICE_POOL_MOD_SKILL_TYPE = 'skill.';

	// Identifiers for the source of the active effects affecting a dice pool.
	static DICE_POOL_MOD_SELF_SOURCE = 'self';
	static DICE_POOL_MOD_TARGET_SOURCE = 'target';

	// Unified pattern to identify an active effect key that modifies the dice pool.
	static DICE_POOL_MOD_KEY_PATTERN = /(?<=genesys\.pool\.(?:check|char|skill)\.(?:self|target))\.?/;

	get originItem(): GenesysItem | undefined {
		if (!this.origin || !(this.parent instanceof GenesysActor) || !this.origin.includes('.Item.')) {
			return undefined;
		}

		const itemId = this.origin.split('.Item.')[1];

		return (this.parent as GenesysActor).items.get(itemId) as GenesysItem | undefined;
	}

	override apply(actor: Actor, change: ApplicableChangeData<this>): unknown {
		const originItem = this.originItem;

		if (originItem && originItem.systemData instanceof TalentDataModel) {
			const talentData = <TalentDataModel>originItem.systemData;

			const rank = talentData.rank;
			const value = parseInt(change.value) * rank;
			if (!isNaN(value)) {
				change.value = value.toString();
			}
		}

		return super.apply(actor, change);
	}
}
