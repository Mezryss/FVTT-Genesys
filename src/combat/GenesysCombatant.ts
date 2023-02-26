/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */

import GenesysActor from '@/actor/GenesysActor';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import GenesysCombat from '@/combat/GenesysCombat';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';
import MinionDataModel from '@/actor/data/MinionDataModel';
import { Characteristic } from '@/data/Characteristics';

export default class GenesysCombatant extends Combatant<GenesysCombat, GenesysActor> {
	initiativeSkillName?: string;

	get disposition() {
		switch ((this.actor.token ?? (this.actor.prototypeToken as any)).disposition) {
			case CONST.TOKEN_DISPOSITIONS.FRIENDLY:
				return 'friendly';

			case CONST.TOKEN_DISPOSITIONS.NEUTRAL:
				return 'neutral';

			case CONST.TOKEN_DISPOSITIONS.HOSTILE:
				return 'hostile';

			default:
				return 'neutral';
		}
	}

	override getInitiativeRoll(skillName: string = 'Unskilled'): Roll {
		const skill = this.actor.items.find((i) => i.type === 'skill' && i.name.toLowerCase() === skillName.toLowerCase()) as GenesysItem<SkillDataModel> | undefined;
		const characteristic = skill?.systemData?.characteristic ?? Characteristic.Brawn;
		const characteristicValue = (this.actor.systemData as CharacterDataModel | AdversaryDataModel).characteristics[characteristic];

		let skillValue = skill?.systemData?.rank ?? 0;
		if (skill && this.actor.type === 'minion') {
			skillValue = Math.max(0, (this.actor.systemData as MinionDataModel).remainingMembers - 1);
		}

		const yellow = Math.min(characteristicValue, skillValue);
		const green = Math.max(characteristicValue, skillValue) - yellow;

		return new Roll(`${yellow}dP+${green}dA`);
	}
}
