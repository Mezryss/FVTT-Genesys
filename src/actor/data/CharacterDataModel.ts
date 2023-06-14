/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Player Character
 */

import GenesysActor from '@/actor/GenesysActor';
import { EntryType, ExperienceJournal } from '@/actor/data/character/ExperienceJournal';
import IHasPreCreate from '@/data/IHasPreCreate';
import GenesysItem from '@/item/GenesysItem';
import ArmorDataModel from '@/item/data/ArmorDataModel';
import EquipmentDataModel, { EquipmentState } from '@/item/data/EquipmentDataModel';
import { NAMESPACE as SETTINGS_NAMESPACE } from '@/settings';
import { KEY_SKILLS_COMPENDIUM, DEFAULT_SKILLS_COMPENDIUM } from '@/settings/campaign';
import { CharacteristicsContainer } from '@/data/Characteristics';
import { CombatPool, Defense } from '@/data/Actors';

export const EQUIPMENT_TYPES = ['armor', 'consumable', 'container', 'gear', 'weapon'];

type Motivation = {
	name: string;
	description: string;
};

type Motivations = {
	strength: Motivation;
	flaw: Motivation;
	desire: Motivation;
	fear: Motivation;
};

type Details = {
	gender: string;
	age: string;
	height: string;
	build: string;
	hair: string;
	eyes: string;
	notableFeatures: string;
};

type Encumbrance = {
	value: number;
	threshold: number;
};

type CharacterActor = GenesysActor<CharacterDataModel>;
type ArmorItem = GenesysItem<ArmorDataModel>;
type EquipmentItem = GenesysItem<EquipmentDataModel>;

export default abstract class CharacterDataModel extends foundry.abstract.DataModel implements IHasPreCreate<GenesysActor<CharacterDataModel>> {
	abstract characteristics: CharacteristicsContainer;
	abstract soak: number;
	abstract defense: Defense;
	abstract wounds: CombatPool;
	abstract strain: CombatPool;
	abstract illustration: string;
	abstract motivations: Motivations;
	abstract details: Details;
	abstract experienceJournal: ExperienceJournal;
	abstract encumbrance: Encumbrance;
	abstract currency: number;
	abstract notes: string;

	/**
	 * Total value for Soak (base + Brawn + Armor).
	 */
	get totalSoak(): number {
		const armorSoak = (<CharacterActor>(<unknown>this.parent)).items
			.filter((i) => i.type === 'armor' && (<ArmorItem>i).systemData.state === 'equipped')
			.map((i) => (<ArmorItem>i).systemData.soak)
			.reduce((total, s) => total + s, 0);
		return this.soak + this.characteristics.brawn + armorSoak;
	}

	/**
	 * Total value for Defense (base defenses + armor).
	 */
	get totalDefense(): Defense {
		const armorDefense = (<CharacterActor>(<unknown>this.parent)).items
			.filter((i) => i.type === 'armor' && (<ArmorItem>i).systemData.state === 'equipped')
			.map((i) => (<ArmorItem>i).systemData.defense)
			.reduce((total, d) => total + d, 0);

		return {
			ranged: Math.min(4, this.defense.ranged + armorDefense),
			melee: Math.min(4, this.defense.melee + armorDefense),
		};
	}

	/**
	 * Amount of XP the character has available to spend right now.
	 */
	get availableXP() {
		return this.experienceJournal.entries.reduce((total, entry) => total + entry.amount, 0);
	}

	/**
	 * Amount of experience the character has available to spend solely from their starting XP pool.
	 */
	get availableStartingXP() {
		const startingXP = this.experienceJournal.entries[0];
		if (!startingXP || startingXP.type !== EntryType.Starting) {
			return 0;
		}

		return this.experienceJournal.entries.reduce((total, entry) => total + Math.min(0, entry.amount), startingXP.amount);
	}

	/**
	 * Total amount of experience the character has gained over their lifetime.
	 */
	get totalXP() {
		return this.experienceJournal.entries.reduce((total, entry) => total + Math.max(0, entry.amount), 0);
	}

	/**
	 * Player's current Encumbrance value, including both ActiveEffects and equipment.
	 */
	get currentEncumbrance(): Encumbrance {
		return {
			value: Math.max(0, (<CharacterActor>(<unknown>this.parent)).items.reduce((total, i) => total + this.#effectiveEncumbranceForItem(<EquipmentItem>i), 0) + this.encumbrance.value),
			threshold: 5 + this.encumbrance.threshold + this.characteristics.brawn + this.#additionalEncumbranceThreshold(),
		};
	}

	/**
	 * Whether the character is currently encumbered.
	 */
	get isEncumbered() {
		const currentEncumbrance = this.currentEncumbrance;

		return currentEncumbrance.value > currentEncumbrance.threshold;
	}

	get canPurchaseCharacteristicAdvance(): { brawn: boolean; agility: boolean; intellect: boolean; cunning: boolean; willpower: boolean; presence: boolean } {
		const availableXP = this.availableStartingXP;

		return {
			brawn: this.characteristics.brawn < 5 && availableXP >= (this.characteristics.brawn + 1) * 10,
			agility: this.characteristics.agility < 5 && availableXP >= (this.characteristics.agility + 1) * 10,
			intellect: this.characteristics.intellect < 5 && availableXP >= (this.characteristics.intellect + 1) * 10,
			cunning: this.characteristics.cunning < 5 && availableXP >= (this.characteristics.cunning + 1) * 10,
			willpower: this.characteristics.willpower < 5 && availableXP >= (this.characteristics.willpower + 1) * 10,
			presence: this.characteristics.presence < 5 && availableXP >= (this.characteristics.presence + 1) * 10,
		};
	}

	#additionalEncumbranceThreshold() {
		return (<CharacterActor>(<unknown>this.parent)).items
			.filter((i) => (<EquipmentItem>i).systemData.encumbrance !== undefined && (i as EquipmentItem).systemData.state !== EquipmentState.Dropped && (i as EquipmentItem).systemData.encumbrance < 0)
			.reduce((total, i) => total + Math.abs((<EquipmentItem>i).systemData.encumbrance), 0);
	}

	#effectiveEncumbranceForItem(item: EquipmentItem) {
		if (!EQUIPMENT_TYPES.includes(item.type)) {
			return 0;
		}

		// Negative encumbrance increases Encumbrance Threshold.
		if (item.systemData.encumbrance < 0 || item.systemData.state === 'dropped') {
			return 0;
		}

		// When armor is worn, its encumbrance rating is reduced by three (to a minimum of 0).
		if (item.type === 'armor') {
			if (item.systemData.state === 'equipped') {
				return Math.max(0, item.systemData.encumbrance - 3) + Math.max(0, item.systemData.encumbrance * (item.systemData.quantity - 1));
			}
		}

		// If it's contained, we need to cycle through to the root container to determine if the container is dropped.
		if (item.systemData.container !== '') {
			let container = <EquipmentItem>(<CharacterActor>(<unknown>this.parent)).items.get(item.systemData.container);
			while (container) {
				if (container.systemData.container === '') {
					// If the root container is dropped, this item doesn't contribute.
					if (container.systemData.state === 'dropped') {
						return 0;
					}

					// Otherwise return to the regular path.
					break;
				}

				container = <EquipmentItem>(<CharacterActor>(<unknown>this.parent)).items.get(item.systemData.container);
			}
		}

		return item.systemData.encumbrance * item.systemData.quantity;
	}

	async preCreate(actor: GenesysActor<this>, _data: PreDocumentId<any>, _options: DocumentModificationContext<GenesysActor<CharacterDataModel>>, _user: User) {
		// Player character tokens should default to being Friendly.
		const prototypeToken = {
			bar1: { attribute: 'wounds' },
			bar2: { attribute: 'strain' },
			disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
			actorLink: true,
		};

		await actor.updateSource({ prototypeToken });

		// Pre-Populate the Character with skill data.
		if (actor.items.find((i) => i.type === 'skill')) {
			// Already have skills data, so we have no reason to add new ones.
			return;
		}

		let skillsCompendiumName = <string>game.settings.get(SETTINGS_NAMESPACE, KEY_SKILLS_COMPENDIUM);

		// Validate the setting is actually set.
		if (skillsCompendiumName.length === 0) {
			ui.notifications.warn(game.i18n.localize('Genesys.Notifications.NoSkillsCompendium'));
			skillsCompendiumName = DEFAULT_SKILLS_COMPENDIUM;
		}

		// Attempt to load the pack
		const pack = game.packs.get(skillsCompendiumName);

		if (!pack) {
			ui.notifications.error(game.i18n.format('Genesys.Notifications.MissingCompendium', { name: skillsCompendiumName }));
			return;
		}
		if (pack.metadata.type !== 'Item') {
			ui.notifications.error(game.i18n.format('Genesys.Notifications.WrongCompendiumType', { name: skillsCompendiumName, type: pack.metadata.type }));
			return;
		}
		const skillIds = pack.index.filter((i) => i.type === 'skill');
		if (skillIds.length === 0) {
			ui.notifications.warn(game.i18n.format('Genesys.Notifications.NoSkillsInCompendium', { name: skillsCompendiumName }));
			return;
		}

		// Populate the skill items
		const skillItems = (await pack.getDocuments()).filter((i) => (<GenesysItem>i).type === 'skill').map((i) => i.toObject());
		actor.updateSource({ items: skillItems });
	}

	static override defineSchema() {
		const fields = foundry.data.fields;

		return {
			characteristics: new fields.SchemaField({
				brawn: new fields.NumberField({ integer: true, initial: 0 }),
				agility: new fields.NumberField({ integer: true, initial: 0 }),
				intellect: new fields.NumberField({ integer: true, initial: 0 }),
				cunning: new fields.NumberField({ integer: true, initial: 0 }),
				willpower: new fields.NumberField({ integer: true, initial: 0 }),
				presence: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			soak: new fields.NumberField({ integer: true, initial: 0 }),
			defense: new fields.SchemaField({
				melee: new fields.NumberField({ integer: true, initial: 0 }),
				ranged: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			wounds: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0 }),
				max: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			strain: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0 }),
				max: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			illustration: new fields.StringField(),
			motivations: new fields.SchemaField({
				strength: new fields.SchemaField({
					name: new fields.StringField(),
					description: new fields.HTMLField(),
				}),
				flaw: new fields.SchemaField({
					name: new fields.StringField(),
					description: new fields.HTMLField(),
				}),
				desire: new fields.SchemaField({
					name: new fields.StringField(),
					description: new fields.HTMLField(),
				}),
				fear: new fields.SchemaField({
					name: new fields.StringField(),
					description: new fields.HTMLField(),
				}),
			}),
			details: new fields.SchemaField({
				gender: new fields.StringField(),
				age: new fields.StringField(),
				height: new fields.StringField(),
				build: new fields.StringField(),
				hair: new fields.StringField(),
				eyes: new fields.StringField(),
				notableFeatures: new fields.StringField(),
			}),
			notes: new fields.HTMLField(),
			experienceJournal: new fields.SchemaField({
				entries: new fields.ArrayField(
					new fields.SchemaField({
						amount: new fields.NumberField({ integer: true, initial: 0 }),
						type: new fields.StringField({ required: true }),
						data: new fields.ObjectField(),
					}),
				),
			}),
			encumbrance: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0 }),
				threshold: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			currency: new fields.NumberField({ initial: 500 }),
		};
	}
}
