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

	get originItem(): GenesysItem | undefined {
		if (!this.origin || !(this.parent instanceof GenesysActor) || !this.origin.includes('.Item.')) {
			return undefined;
		}

		const itemId = this.origin.split('.Item.')[1];

		return (this.parent as GenesysActor).items.get(itemId) as GenesysItem | undefined;
	}

	override apply(actor: Actor, change: ApplicableChangeData<this>): unknown {
		const originItem = this.originItem;

		console.error('Applying Effect!');
		console.log(originItem);

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
