<script lang="ts" setup>
import { computed, inject, onMounted, ref, toRaw } from 'vue';
import { DicePromptContext, type AttackRollData, RollType, InitiativeRollData } from '@/app/DicePrompt';
import { Characteristic } from '@/data/Characteristics';
import GenesysRoller from '@/dice/GenesysRoller';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';
import { NAMESPACE as SETTINGS_NAMESPACE } from '@/settings';
import { KEY_UNCOUPLE_SKILLS_FROM_CHARACTERISTICS, KEY_SUPER_CHARACTERISTICS } from '@/settings/campaign';
import { KEY_DICE_POOL_APPROXIMATION } from '@/settings/user';
import { RootContext } from '@/vue/SheetContext';
import Localized from '@/vue/components/Localized.vue';
import MinionDataModel from '@/actor/data/MinionDataModel';

enum UpgradeType {
	Positive,
	Negative,
}

type DieString = 'A' | 'P' | 'B' | 'D' | 'C' | 'S';
type SymbolString = 'a' | 's' | 't' | 'h' | 'f' | 'd';

type DicePool = {
	dice: Record<DieString, number>;
	symbols: Record<SymbolString, number>;
	usesSuperCharacteristic: boolean;
};

const SORT_ORDER: Record<DieString | SymbolString, number> = {
	// Proficiency & Challenge Dice
	P: 0,
	C: 0,
	// Ability & Difficulty Dice
	A: 1,
	D: 1,
	// Boost & Setback Dice
	B: 2,
	S: 2,
	// Success & Failure Symbols
	s: 3,
	f: 3,
	// Triumph & Despair Symbols
	t: 4,
	d: 4,
	// Advantage & Threat Symbols
	a: 5,
	h: 5,
};

/**
 * A mapping of dice font glyphs to their corresponding dice formula strings.
 */
const ICON_TO_FORMULA: Record<DieString, string> = {
	A: 'dA', // Ability Dice
	P: 'dP', // Proficiency Dice
	B: 'dB', // Boost Dice
	D: 'dI', // Difficulty Dice
	C: 'dC', // Challenge Dice
	S: 'dS', // Setback Dice
};

const context = inject<DicePromptContext>(RootContext)!;

const positiveDice = ref<DieString[]>([]);
const negativeDice = ref<DieString[]>(new Array(context.startingDifficulty).fill('D'));
const positiveSymbols = ref<SymbolString[]>([]);
const negativeSymbols = ref<SymbolString[]>([]);
const selectedCharacteristic = ref<Characteristic | '-'>(!context.rollUnskilled ? context.skills.find((s) => s.id === context.startingSkillId)?.systemData.characteristic ?? '-' : context.rollUnskilled);
const selectedSkill = ref<GenesysItem<SkillDataModel> | undefined>(!context.rollUnskilled ? context.skills.find((s) => s.id === context.startingSkillId) : undefined);
const successApproximation = ref('');

const availableSkills = computed<GenesysItem<SkillDataModel>[]>(() => toRaw(context.skills).sort(sortSkills));
const canChangeCharacteristic = computed(() => !selectedSkill.value || (game.settings.get(SETTINGS_NAMESPACE, KEY_UNCOUPLE_SKILLS_FROM_CHARACTERISTICS) as boolean));

const DICE_POOL_APPROXIMATION = Math.floor(game.settings.get(SETTINGS_NAMESPACE, KEY_DICE_POOL_APPROXIMATION) as number);

let currentDicePool: DicePool = {
	dice: {} as Record<DieString, number>,
	symbols: {} as Record<SymbolString, number>,
	usesSuperCharacteristic: false,
};

const allowSuperCharacteristics = game.settings.get(SETTINGS_NAMESPACE, KEY_SUPER_CHARACTERISTICS) as boolean;

onMounted(recalculateDicePool);

function selectDefaultCharacteristicForSkill(event: Event) {
	const target = event.currentTarget as HTMLSelectElement;

	const skill = toRaw(context.skills).find((s) => s.id === target.value);
	if (!skill) {
		selectedSkill.value = undefined;
	} else {
		selectedCharacteristic.value = skill.systemData.characteristic;
		selectedSkill.value = skill;
	}

	recalculateDicePool();
}

function characteristicChanged(event: Event) {
	const target = event.currentTarget as HTMLSelectElement;

	selectedCharacteristic.value = target.value as Characteristic | '-';

	recalculateDicePool();
}

/**
 * Sorting function for sorting dice & symbol arrays.
 */
function sortDice(a: DieString | SymbolString, b: DieString | SymbolString) {
	return SORT_ORDER[a] - SORT_ORDER[b];
}

/**
 * Utility method to sort skills alphabetically.
 */
function sortSkills(a: GenesysItem, b: GenesysItem) {
	const nameA = a.name.toLowerCase();
	const nameB = b.name.toLowerCase();

	if (nameA < nameB) {
		return -1;
	}
	if (nameA > nameB) {
		return 1;
	}

	return 0;
}

/**
 * Reduce arrays of dice & symbols into an object mapping the die type to the number of times it appears in the array.
 */
function reduceDice(pool: Record<DieString | SymbolString, number | undefined>, die: DieString | SymbolString) {
	if (pool[die] === undefined) {
		pool[die] = 1;
	} else {
		pool[die]! += 1;
	}

	return pool;
}

/**
 * Clear the Positive Dice Pool and re-establish the base Ability & Challenge dice based on Characteristic & Skill Ranks.
 */
function recalculateDicePool() {
	// Do nothing if the characteristic & skill are both unselected.
	if (selectedCharacteristic.value === '-' && !selectedSkill.value) {
		return;
	}

	const characteristicValue = selectedCharacteristic.value !== '-' ? ((context.actor.system as any).characteristics[selectedCharacteristic.value] as number) : 0;
	let skillValue = selectedSkill.value?.systemData.rank ?? 0;

	if (context.actor.type === 'minion' && selectedSkill.value) {
		skillValue = Math.max(0, (context.actor.system as MinionDataModel).remainingMembers - 1);
	}

	// Clear the Ability & Proficiency dice in the pool, but leave Boost Dice alone.
	const boostDice = positiveDice.value.filter((d) => d === 'B');

	const yellow = Math.min(characteristicValue, skillValue);
	const green = Math.max(characteristicValue, skillValue) - yellow;

	positiveDice.value = [...new Array(yellow).fill('P'), ...new Array(green).fill('A'), ...boostDice];

	approximateProbability();
}

function addDie(dieType: DieString) {
	if (['A', 'P', 'B'].includes(dieType)) {
		positiveDice.value.push(dieType);
		positiveDice.value.sort(sortDice);
	} else {
		negativeDice.value.push(dieType);
		negativeDice.value.sort(sortDice);
	}

	approximateProbability();
}

function removeDie(dieType: DieString) {
	let diceArrayRef = negativeDice;
	if (['A', 'P', 'B'].includes(dieType)) {
		//eslint-disable-next-line vue/no-ref-as-operand
		diceArrayRef = positiveDice;
	}
	let index = diceArrayRef.value.findIndex((s) => s === dieType);
	diceArrayRef.value.splice(index, 1);

	approximateProbability();
}

function addSymbol(symbolType: SymbolString) {
	if (['a', 's', 't'].includes(symbolType)) {
		positiveSymbols.value.push(symbolType);
		positiveSymbols.value.sort(sortDice);
	} else {
		negativeSymbols.value.push(symbolType);
		negativeSymbols.value.sort(sortDice);
	}

	approximateProbability();
}

function removeSymbol(symbolType: SymbolString) {
	let symbolArrayRef = negativeSymbols;
	if (['a', 's', 't'].includes(symbolType)) {
		//eslint-disable-next-line vue/no-ref-as-operand
		symbolArrayRef = positiveSymbols;
	}
	let index = symbolArrayRef.value.findIndex((s) => s === symbolType);
	symbolArrayRef.value.splice(index, 1);

	approximateProbability();
}

function upgradeDie(type: UpgradeType) {
	let diceArrayRef = negativeDice;
	let baseDie: DieString = 'D';
	let upgradedDie: DieString = 'C';

	if (type === UpgradeType.Positive) {
		//eslint-disable-next-line vue/no-ref-as-operand
		diceArrayRef = positiveDice;
		baseDie = 'A';
		upgradedDie = 'P';
	}

	const index = diceArrayRef.value.findIndex((d) => d === baseDie);
	if (index >= 0) {
		diceArrayRef.value[index] = upgradedDie;
	} else {
		diceArrayRef.value.push(baseDie);
		diceArrayRef.value.sort(sortDice);
	}

	approximateProbability();
}

function downgradeDie(type: UpgradeType) {
	let diceArrayRef = negativeDice;
	let baseDie: DieString = 'C';
	let downgradedDie: DieString = 'D';

	if (type === UpgradeType.Positive) {
		//eslint-disable-next-line vue/no-ref-as-operand
		diceArrayRef = positiveDice;
		baseDie = 'P';
		downgradedDie = 'A';
	}

	const index = diceArrayRef.value.findIndex((d) => d === baseDie);
	if (index >= 0) {
		diceArrayRef.value[index] = downgradedDie;
		diceArrayRef.value.sort(sortDice);
	}

	approximateProbability();
}

function compileDicePool() {
	const dice = positiveDice.value.concat(negativeDice.value).reduce(reduceDice, {} as Record<DieString | SymbolString, number>);
	const symbols = positiveSymbols.value.concat(negativeSymbols.value).reduce(reduceDice, {} as Record<DieString | SymbolString, number>);

	const useSuperCharacteristic = allowSuperCharacteristics && 'superCharacteristics' in context.actor.systemData && (context.actor.systemData.superCharacteristics as Set<Characteristic | '-'>).has(selectedCharacteristic.value);

	const formula = Object.keys(dice)
		.map((d) => `${dice[d as DieString]}${ICON_TO_FORMULA[d as DieString]}${d == 'P' && useSuperCharacteristic ? 'X' : ''}`)
		.join('+');

	return {
		formula: formula === '' ? '0' : formula,
		usesSuperCharacteristic: (useSuperCharacteristic && dice['P']) as boolean,
		dice,
		symbols,
	};
}

async function rollPool() {
	const { formula, symbols } = compileDicePool();

	const baseRollData = {
		actor: toRaw(context.actor),
		characteristic: selectedCharacteristic.value === '-' ? undefined : (selectedCharacteristic.value as Characteristic),
		skillId: selectedSkill.value?.id ?? '-',
		formula,
		symbols: symbols as Record<string, number>,
	};

	switch (context.rollType) {
		case RollType.Attack:
			await GenesysRoller.attackRoll({
				...baseRollData,
				weapon: (context.rollData as AttackRollData).weapon,
			});
			break;

		case RollType.Initiative:
			(context.rollData as InitiativeRollData).resolvePromise({
				roll: new Roll(formula, { symbols }),
				skillName: selectedSkill.value?.name ?? 'Unskilled',
			});
			break;

		default:
			await GenesysRoller.skillRoll(baseRollData);
	}

	await context.app.close();
}

function hasSameChanceToSucceed(firstDicePool: DicePool, secondDicePool: DicePool) {
	const firstPoolDiceEntries = Object.entries(firstDicePool.dice);

	// Dice always contribute to the success rate so any difference implies the pools have different probabilities.
	if (firstPoolDiceEntries.length !== Object.keys(secondDicePool.dice).length) {
		return false;
	}

	for (const [diceKey, diceAmount] of firstPoolDiceEntries) {
		if (secondDicePool.dice[diceKey as DieString] !== diceAmount) {
			return false;
		}
	}

	if (firstDicePool.usesSuperCharacteristic !== secondDicePool.usesSuperCharacteristic) {
		return false;
	}

	// Advantages and threats do not impact the chance to succeed so we ignore them.
	const firstPoolNetSuccesses = (firstDicePool.symbols['s'] ?? 0) + (firstDicePool.symbols['t'] ?? 0) - (firstDicePool.symbols['f'] ?? 0) - (firstDicePool.symbols['d'] ?? 0);
	const secondPoolNetSuccesses = (secondDicePool.symbols['s'] ?? 0) + (secondDicePool.symbols['t'] ?? 0) - (secondDicePool.symbols['f'] ?? 0) - (secondDicePool.symbols['d'] ?? 0);

	return firstPoolNetSuccesses === secondPoolNetSuccesses;
}

async function approximateProbability() {
	if (DICE_POOL_APPROXIMATION <= 0) {
		return;
	}

	const { formula, usesSuperCharacteristic, dice, symbols } = compileDicePool();

	const previousDicePool = currentDicePool;
	currentDicePool = {
		dice: dice as Record<DieString, number>,
		symbols: symbols as Record<SymbolString, number>,
		usesSuperCharacteristic,
	};

	// Slight optimization for a pool without dice.
	if (!Object.keys(dice).length) {
		const deterministicResult = (symbols.s ?? 0) > (symbols.f ?? 0) ? 100 : 0;
		successApproximation.value = deterministicResult.toFixed(2);
		return;
	}

	// No need to run this process again if nothing of importance has changed.
	if (hasSameChanceToSucceed(previousDicePool, currentDicePool)) {
		return;
	}

	const simulation = await Promise.all(
		[...Array(DICE_POOL_APPROXIMATION)].map(async () => {
			const roll = new Roll(formula, { symbols });
			const result = await roll.evaluate({ async: true });
			return GenesysRoller.parseRollResults(result);
		}),
	);

	const successfulRolls = simulation.filter((roll) => roll.netSuccess > 0);
	successApproximation.value = (Math.round((successfulRolls.length / simulation.length) * 10000) / 100).toFixed(2);
}
</script>

<template>
	<div class="genesys dice-prompt">
		<!-- Header Text -->
		<header>
			<span><Localized label="Genesys.DicePrompt.Title" /></span>
			<span class="hint"><Localized label="Genesys.DicePrompt.Hint" /></span>
		</header>

		<!-- Dice Pool Preview -->
		<div class="preview">
			<!-- Positive Pool -->
			<div class="positive">
				<div v-for="(die, index) in positiveDice" :key="index" @click="removeDie(die)" :class="`die die-${die}`">{{ die }}</div>
				<div v-for="(symbol, index) in positiveSymbols" :key="index" @click="removeSymbol(symbol)" class="symbol">{{ symbol }}</div>
			</div>

			<!-- Negative Pool -->
			<div class="negative">
				<div v-for="(die, index) in negativeDice" :key="index" @click="removeDie(die)" :class="`die die-${die}`">{{ die }}</div>
				<div v-for="(symbol, index) in negativeSymbols" :key="index" @click="removeSymbol(symbol)" class="symbol">{{ symbol }}</div>
			</div>

			<!-- Dice Box -->
			<div class="dice-box">
				<!-- Add Positive Dice -->
				<a @click="addDie('A')" data-die="A">A<i class="fas fa-plus"></i></a>
				<a @click="addDie('P')" data-die="P">P<i class="fas fa-plus"></i></a>
				<a @click="addDie('B')" data-die="B">B<i class="fas fa-plus"></i></a>

				<!-- Upgrade/Downgrade Positive Dice -->
				<a @click="upgradeDie(UpgradeType.Positive)" data-die="A">A<i class="fas fa-arrow-up"></i></a>
				<a @click="downgradeDie(UpgradeType.Positive)" data-die="P">P<i class="fas fa-arrow-down"></i></a>
				<span />

				<!-- Add Negative Dice -->
				<a @click="addDie('D')" data-die="D">D<i class="fas fa-plus"></i></a>
				<a @click="addDie('C')" data-die="C">C<i class="fas fa-plus"></i></a>
				<a @click="addDie('S')" data-die="S">S<i class="fas fa-plus"></i></a>

				<!-- Upgrade/Downgrade Negative Dice -->
				<a @click="upgradeDie(UpgradeType.Negative)" data-die="D">D<i class="fas fa-arrow-up"></i></a>
				<a @click="downgradeDie(UpgradeType.Negative)" data-die="C">C<i class="fas fa-arrow-down"></i></a>
				<span />

				<!-- Add Positive Symbols -->
				<a @click="addSymbol('a')">a<i class="fas fa-plus"></i></a>
				<a @click="addSymbol('s')">s<i class="fas fa-plus"></i></a>
				<a @click="addSymbol('t')">t<i class="fas fa-plus"></i></a>

				<!-- Add Negative Symbols -->
				<a @click="addSymbol('h')">h<i class="fas fa-plus"></i></a>
				<a @click="addSymbol('f')">f<i class="fas fa-plus"></i></a>
				<a @click="addSymbol('d')">d<i class="fas fa-plus"></i></a>
			</div>
		</div>

		<!-- Characteristic Selection -->
		<select name="characteristic" :value="selectedCharacteristic" :disabled="!canChangeCharacteristic" @change="characteristicChanged">
			<option value="-">—</option>
			<option :value="Characteristic.Brawn"><Localized label="Genesys.Characteristics.Brawn" /></option>
			<option :value="Characteristic.Agility"><Localized label="Genesys.Characteristics.Agility" /></option>
			<option :value="Characteristic.Intellect"><Localized label="Genesys.Characteristics.Intellect" /></option>
			<option :value="Characteristic.Cunning"><Localized label="Genesys.Characteristics.Cunning" /></option>
			<option :value="Characteristic.Willpower"><Localized label="Genesys.Characteristics.Willpower" /></option>
			<option :value="Characteristic.Presence"><Localized label="Genesys.Characteristics.Presence" /></option>
		</select>

		<!-- Skill Selection -->
		<select name="skill" :value="selectedSkill?.id ?? '-'" @change="selectDefaultCharacteristicForSkill">
			<option value="-">—</option>
			<option v-for="skill in availableSkills" :key="skill.id" :value="skill.id">{{ skill.name }} (<Localized :label="`Genesys.CharacteristicAbbr.${skill.systemData.characteristic.capitalize()}`" />)</option>
		</select>

		<div v-if="DICE_POOL_APPROXIMATION > 0" class="approximation">
			<label> <i class="fas fa-circle-info" data-tooltip="Genesys.DicePrompt.ApproximationDisclaimer"></i> <Localized label="Genesys.DicePrompt.Approximation" /> </label>

			<i v-if="successApproximation === ''" class="fas fa-spinner fa-spin"></i>
			<span v-else>{{ successApproximation }}%</span>
		</div>

		<!-- Roll Button -->
		<button class="roll-button" @click.prevent="rollPool"><Localized label="Genesys.DicePrompt.Roll" /></button>
	</div>
</template>

<style lang="scss" scoped>
@use '@scss/mixins/backgrounds.scss';
@use '@scss/vars/colors.scss';
@use '@scss/vars/sheet.scss';

.app-dice-prompt {
	min-width: 500px;
	min-height: 300px;

	.window-content {
		@include backgrounds.crossboxes();
	}
}

.dice-prompt {
	display: grid;
	grid-template-columns: 2fr 1fr 2fr;
	grid-template-rows: /* Header */ auto /* Dice Pool */ 1fr /* Skill & Characteristic */ auto /* Roll Button */ auto;
	gap: 0.5em;

	//#region Grid Layout
	header {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		grid-column: 1 / span all;
		grid-row: 1 / span 1;

		.hint {
			font-family: 'Roboto', serif;
			font-size: 0.8rem;
			color: colors.$dark-blue;
		}
	}

	.preview {
		grid-column: 1 / span all;
		grid-row: 2 / span 1;
	}

	[name='characteristic'],
	[name='skill'] {
		grid-row: 3 / span 1;
	}

	[name='characteristic'] {
		grid-column: 1 / span 1;
	}

	[name='skill'] {
		grid-column: 2 / span 2;
	}

	.approximation {
		grid-column: 1 / span 2;
		grid-row: 4 / span 1;

		label {
			margin-right: 1rem;
		}
	}

	.roll-button {
		grid-column: 3 / span 1;
		grid-row: 4 / span 1;
	}
	//#endregion

	header {
		color: colors.$blue;
		font-family: 'Bebas Neue', sans-serif;
		font-size: 2em;
	}

	.roll-button {
		color: colors.$blue;
		font-family: 'Bebas Neue', sans-serif;
		font-size: 1.25em;
	}

	.preview {
		display: grid;
		grid-template-columns: /* Pool Previews */ 1fr /* Dice Box */ auto;
		grid-template-rows: /* Positive Dice */ 1fr /* Negative Dice */ 1fr;
		gap: 0.5em;

		background: linear-gradient(to bottom, black -40%, colors.$blue 20%, darken(colors.$blue, 10%) 70%, black 130%);
		border-top: 1px solid black;
		border-bottom: 1px solid black;
		margin-left: -0.5rem;
		margin-right: -0.5rem;
		padding-left: 0.5em;

		.positive,
		.negative {
			grid-column: 1 / span 1;

			display: flex;
			align-items: center;
			flex-direction: row;
			flex-wrap: wrap;
		}

		.positive {
			grid-row: 1 / span 1;
		}

		.negative {
			grid-row: 2 / span 1;
		}

		.dice-box {
			grid-column: 2 / span 1;
			grid-row: 1 / span all;
			background: transparentize(black, 0.75);
			border-top-left-radius: 0.5rem;
			border-bottom-left-radius: 0.5rem;
			color: white;
			padding: 0.5em;
			column-gap: 0.25em;
			align-items: center;
			justify-items: center;
			font-size: 1.25em;

			display: grid;
			grid-template-columns: repeat(3, auto);

			a {
				display: inline-flex;
				flex-direction: row;
				flex-wrap: nowrap;
				align-items: flex-start;
				font-family: 'Genesys Symbols', sans-serif;

				&[data-die='A'] {
					color: colors.$die-ability;
				}

				&[data-die='P'] {
					color: colors.$die-proficiency;
				}

				&[data-die='B'] {
					color: colors.$die-boost;
				}

				&[data-die='D'] {
					-webkit-text-stroke: 0.5px white;
					text-stroke: 0.5px white;
					color: colors.$die-difficulty;

					i {
						-webkit-text-stroke: 0 transparent;
						text-stroke: 0 transparent;
					}
				}

				&[data-die='C'] {
					-webkit-text-stroke: 0.5px white;
					text-stroke: 0.5px white;
					color: colors.$die-challenge;

					i {
						-webkit-text-stroke: 0 transparent;
						text-stroke: 0 transparent;
					}
				}

				&[data-die='S'] {
					-webkit-text-stroke: 0.5px white;
					text-stroke: 0.5px white;
					color: colors.$die-setback;

					i {
						-webkit-text-stroke: 0 transparent;
						text-stroke: 0 transparent;
					}
				}
			}

			i {
				color: white;
				position: relative;
				font-size: 0.5em;
				top: -0.25em;
			}
		}

		.die,
		.symbol {
			display: inline;
			font-family: 'Genesys Symbols', sans-serif;
			font-size: 2rem;
			color: white;
			cursor: pointer;

			&:hover {
				text-shadow: 0 0 0 #fff, 0 0 1px #fff, 0 0 2px #e60073, 0 0 3px #e60073, 0 0 4px #e60073, 0 0 5px #e60073, 0 0 6px #e60073;
			}
		}

		.die {
			margin-left: -0.1em;
			margin-right: -0.05em;
			margin-top: 0.1em;
			-webkit-text-stroke: 2px black;
			text-stroke: 2px black;
			font-size: 2.5rem;

			// Ability & Difficulty Die
			&.die-A {
				color: colors.$die-ability;
			}

			&.die-D {
				color: colors.$die-difficulty;
			}

			// Proficiency Die
			&.die-P {
				color: colors.$die-proficiency;
			}

			&.die-C {
				color: colors.$die-challenge;
			}

			// Boost Die
			&.die-B {
				color: colors.$die-boost;
			}

			&.die-S {
				color: colors.$die-setback;
			}
		}
	}
}
</style>
