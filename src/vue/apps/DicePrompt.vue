<script lang="ts" setup>
import { inject, onMounted, ref, toRaw } from 'vue';
import { DicePromptContext, type AttackRollData, RollType, type InitiativeRollData, CALCULATE_CHANCE_WORKER_NAME } from '@/app/DicePrompt';
import { Characteristic } from '@/data/Characteristics';
import GenesysRoller from '@/dice/GenesysRoller';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';
import { RootContext } from '@/vue/SheetContext';
import Localized from '@/vue/components/Localized.vue';
import MinionDataModel from '@/actor/data/MinionDataModel';
import { DieType } from '@/dice';
import { DieCategory } from '@/dice/types/GenesysDie';
import { GenesysSymbol } from '@/dice/types/GenesysSymbol';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';
import GenesysActor from '@/actor/GenesysActor';

type AlsoNone<T> = T | undefined;
type PartialRecord<K extends keyof any, T> = Partial<Record<K, T>>;

type DieName = keyof typeof DieType;
type SymbolName = keyof typeof GenesysSymbol;
type PoolEntity = DieName | SymbolName;

type NonVehicleActorDataModel = CharacterDataModel | AdversaryDataModel;

type DicePool = {
	dice: PartialRecord<DieName, number>;
	symbols: PartialRecord<SymbolName, number>;
	usesSuperCharacteristic: boolean;
};

const SORT_ORDER: Record<PoolEntity, number> = {
	Proficiency: 0,
	Ability: 1,
	Boost: 2,

	Success: 3,
	Triumph: 4,
	Advantage: 5,

	Challenge: 0,
	Difficulty: 1,
	Setback: 2,

	Failure: 3,
	Despair: 4,
	Threat: 5,
};

const USE_UNCOUPLED_SKILLS = CONFIG.genesys.settings.uncoupleSkillsFromCharacteristics;
const USE_SUPER_CHARACTERISTICS = CONFIG.genesys.settings.useSuperCharacteristics;
const CHANCE_TO_SUCCEED_BY_SIMULATION_NUM_ROLLS = CONFIG.genesys.settings.showChanceToSucceedFromSimulations.amountOfRolls;
const USE_CHANCE_TO_SUCCEED_BY_PERMUTATION = !!game.workers.get && CONFIG.genesys.settings.showChanceToSucceedFromPermutations; // eslint-disable-line
const USE_CHANCE_TO_SUCCEED = USE_CHANCE_TO_SUCCEED_BY_PERMUTATION || CONFIG.genesys.settings.showChanceToSucceedFromSimulations.enabled;

const context = inject<DicePromptContext>(RootContext)!;

const positiveDice = ref<DieName[]>([]);
const negativeDice = ref<DieName[]>([]);
const positiveSymbols = ref<SymbolName[]>([]);
const negativeSymbols = ref<SymbolName[]>([]);
const availableSkills = ref<GenesysItem<SkillDataModel>[]>([]);
const selectedSkill = ref<AlsoNone<GenesysItem<SkillDataModel>>>();
const selectedCharacteristic = ref<AlsoNone<Characteristic>>();
const probabilityOfSuccess = ref<AlsoNone<string>>();

const useSuperCharacteristic = ref(false);

let currentDicePool: DicePool = {
	dice: {},
	symbols: {},
	usesSuperCharacteristic: false,
};

onMounted(() => {
	const actor = toRaw(context.actor);
	negativeDice.value = new Array<DieName>(context.difficulty).fill('Difficulty');
	availableSkills.value = actor ? (actor.items.filter((item) => item.type === 'skill') as GenesysItem<SkillDataModel>[]).sort(sortSkills) : [];
	selectedSkill.value = context.skillName ? (availableSkills.value.find((skill) => skill.name === context.skillName) as AlsoNone<GenesysItem<SkillDataModel>>) : undefined;
	selectedCharacteristic.value = selectedSkill.value?.systemData.characteristic ?? context.rollUnskilled;

	if (actor) {
		recalculateDicePool();
	}

	approximateProbability();
});

function onSkillChange(event: Event) {
	const selectedOption = event.currentTarget as HTMLSelectElement;

	selectedSkill.value = availableSkills.value.find((s) => s.id === selectedOption.value) as AlsoNone<GenesysItem<SkillDataModel>>;
	selectedCharacteristic.value = selectedSkill.value?.systemData.characteristic;

	recalculateDicePool();
}

function onCharacteristicChange(event: Event) {
	const selectedOption = event.currentTarget as HTMLSelectElement;

	selectedCharacteristic.value = selectedOption.value !== '-' ? (selectedOption.value as Characteristic) : undefined;

	recalculateDicePool();
}

/**
 * Sorting function for sorting dice & symbol arrays.
 */
function sortPoolEntities(f: PoolEntity, s: PoolEntity) {
	return SORT_ORDER[f] - SORT_ORDER[s];
}

/**
 * Utility method to sort skills alphabetically.
 */
function sortSkills(f: GenesysItem, s: GenesysItem) {
	const nameA = f.name.toLowerCase();
	const nameB = s.name.toLowerCase();

	if (nameA < nameB) {
		return -1;
	}
	if (nameA > nameB) {
		return 1;
	}

	return 0;
}

/**
 * Reduce arrays of dice or symbols into an object mapping the entity to the number of times it appears in the array.
 */
function reducePool(pool: PartialRecord<PoolEntity, number>, entity: PoolEntity) {
	if (pool[entity] === undefined) {
		pool[entity] = 1;
	} else {
		pool[entity]! += 1;
	}

	return pool;
}

/**
 * Clear the Positive Dice Pool and re-establish the base Ability & Challenge dice based on Characteristic & Skill Ranks.
 */
function recalculateDicePool() {
	// Do nothing if the characteristic & skill are both unselected.
	if (!selectedCharacteristic.value && !selectedSkill.value) {
		return;
	}

	const actor = context.actor as GenesysActor<NonVehicleActorDataModel>;

	const characteristicValue = selectedCharacteristic.value ? actor.systemData.characteristics[selectedCharacteristic.value] : 0;
	let skillValue = selectedSkill.value?.systemData.rank ?? 0;

	if (actor.type === 'minion' && selectedSkill.value) {
		skillValue = Math.max(0, (actor.systemData as MinionDataModel).remainingMembers - 1);
	}

	// Clear the Ability & Proficiency dice in the pool, but leave Boost Dice alone.
	const boostDice = positiveDice.value.filter((dice) => dice === 'Boost');

	const proficiencyDice = Math.min(characteristicValue, skillValue);
	const abilityDice = Math.max(characteristicValue, skillValue) - proficiencyDice;

	positiveDice.value = [...new Array<DieName>(proficiencyDice).fill('Proficiency'), ...new Array<DieName>(abilityDice).fill('Ability'), ...boostDice];

	approximateProbability();
}

function addDie(dieName: DieName) {
	const dice = DieType[dieName].CATEGORY === 'positive' ? positiveDice : negativeDice;

	dice.value.push(dieName);
	dice.value.sort(sortPoolEntities);

	approximateProbability();
}

function removeDie(dieName: DieName, index: number) {
	const dice = DieType[dieName].CATEGORY === 'positive' ? positiveDice : negativeDice;

	dice.value.splice(index, 1);

	approximateProbability();
}

function addSymbol(symbolName: SymbolName) {
	const symbols = GenesysSymbol[symbolName].CATEGORY === 'positive' ? positiveSymbols : negativeSymbols;

	symbols.value.push(symbolName);
	symbols.value.sort(sortPoolEntities);

	approximateProbability();
}

function removeSymbol(symbolName: SymbolName, index: number) {
	const symbols = GenesysSymbol[symbolName].CATEGORY === 'positive' ? positiveSymbols : negativeSymbols;

	symbols.value.splice(index, 1);

	approximateProbability();
}

function upgradeDie(dieCategory: DieCategory) {
	let dice = negativeDice;
	let baseDie: DieName = 'Difficulty';
	let upgradedDie: DieName = 'Challenge';

	if (dieCategory === 'positive') {
		// eslint-disable-next-line vue/no-ref-as-operand
		dice = positiveDice;
		baseDie = 'Ability';
		upgradedDie = 'Proficiency';
	}

	const index = dice.value.findIndex((d) => d === baseDie);
	if (index >= 0) {
		dice.value[index] = upgradedDie;
	} else {
		dice.value.push(baseDie);
		dice.value.sort(sortPoolEntities);
	}

	approximateProbability();
}

function downgradeDie(dieCategory: DieCategory) {
	let dice = negativeDice;
	let baseDie: DieName = 'Challenge';
	let downgradedDie: DieName = 'Difficulty';

	if (dieCategory === 'positive') {
		//eslint-disable-next-line vue/no-ref-as-operand
		dice = positiveDice;
		baseDie = 'Proficiency';
		downgradedDie = 'Ability';
	}

	const index = dice.value.findIndex((d) => d === baseDie);
	if (index >= 0) {
		dice.value[index] = downgradedDie;
		dice.value.sort(sortPoolEntities);
	}

	approximateProbability();
}

function compileDicePool() {
	const dice: PartialRecord<DieName, number> = positiveDice.value.concat(negativeDice.value).reduce(reducePool, {});
	const symbols: PartialRecord<SymbolName, number> = positiveSymbols.value.concat(negativeSymbols.value).reduce(reducePool, {});

	let poolHasSuperCharacteristic = useSuperCharacteristic.value;
	if (USE_SUPER_CHARACTERISTICS) {
		if (context.actor) {
			const actor = context.actor as GenesysActor<NonVehicleActorDataModel>;
			poolHasSuperCharacteristic = !!selectedCharacteristic.value && actor.systemData.superCharacteristics.has(selectedCharacteristic.value);
		}
	}

	const formula = Object.keys(dice)
		.map((dieKey) => {
			const dieName = dieKey as DieName;
			const explodeDice = dieName === 'Proficiency' && poolHasSuperCharacteristic ? 'X' : '';
			return `${dice[dieName]}${DieType[dieName].FORMULA}${explodeDice}`;
		})
		.join('+');

	return {
		formula: formula === '' ? '0' : formula,
		usesSuperCharacteristic: poolHasSuperCharacteristic && !!dice['Proficiency'],
		dice,
		symbols,
	};
}

// Convert the symbols object into the old format to make the GenesysRoller understand it.
// A refactor of said class should get rid of this method.
function convertToOldSymbolsFormat(symbols: PartialRecord<SymbolName, number>) {
	return Object.entries(symbols).reduce(
		(accum, [symbolName, symbolAmount]) => {
			accum[GenesysSymbol[symbolName as SymbolName].GLYPH] = symbolAmount;
			return accum;
		},
		{} as Record<string, number>,
	);
}

async function rollPool() {
	const { formula, symbols } = compileDicePool();

	const oldFormatSymbols = convertToOldSymbolsFormat(symbols);
	const baseRollData = {
		actor: toRaw(context.actor),
		characteristic: selectedCharacteristic.value,
		skillId: selectedSkill.value?.id ?? '-',
		formula,
		symbols: oldFormatSymbols,
	};

	switch (context.rollType) {
		case RollType.Simple:
			await GenesysRoller.skillRoll(baseRollData);
			break;

		case RollType.Attack:
			await GenesysRoller.attackRoll({
				...baseRollData,
				weapon: (context.rollData as AttackRollData).weapon,
			});
			break;

		case RollType.Initiative:
			(context.rollData as InitiativeRollData).resolvePromise({
				roll: new Roll(formula, { symbols: oldFormatSymbols }),
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
		if (secondDicePool.dice[diceKey as DieName] !== diceAmount) {
			return false;
		}
	}

	if (firstDicePool.usesSuperCharacteristic !== secondDicePool.usesSuperCharacteristic) {
		return false;
	}

	// Advantages and threats do not impact the chance to succeed so we ignore them.
	const firstPoolNetSuccesses = (firstDicePool.symbols.Success ?? 0) + (firstDicePool.symbols.Triumph ?? 0) - (firstDicePool.symbols.Failure ?? 0) - (firstDicePool.symbols.Despair ?? 0);
	const secondPoolNetSuccesses = (secondDicePool.symbols.Success ?? 0) + (secondDicePool.symbols.Triumph ?? 0) - (secondDicePool.symbols.Failure ?? 0) - (secondDicePool.symbols.Despair ?? 0);

	return firstPoolNetSuccesses === secondPoolNetSuccesses;
}

async function approximateProbability() {
	if (!USE_CHANCE_TO_SUCCEED) {
		return;
	}

	const { formula, usesSuperCharacteristic, dice, symbols } = compileDicePool();

	const previousDicePool = currentDicePool;
	currentDicePool = {
		dice: dice,
		symbols: symbols,
		usesSuperCharacteristic,
	};

	// Slight optimization for a pool without dice.
	if (!Object.keys(dice).length) {
		const totalSuccesses = (symbols.Success ?? 0) + (symbols.Triumph ?? 0);
		const totalFailures = (symbols.Failure ?? 0) + (symbols.Despair ?? 0);
		const deterministicResult = totalSuccesses > totalFailures ? 100 : 0;
		probabilityOfSuccess.value = deterministicResult.toFixed(2);
		return;
	}

	// No need to run this process again if nothing of importance has changed.
	if (hasSameChanceToSucceed(previousDicePool, currentDicePool)) {
		return;
	}

	let chanceToSucceed = 0;
	if (USE_CHANCE_TO_SUCCEED_BY_PERMUTATION) {
		const worker = game.workers.get(CALCULATE_CHANCE_WORKER_NAME);
		if (!worker) {
			probabilityOfSuccess.value = undefined;
			return;
		}

		chanceToSucceed = (await worker.executeFunction('calculateChanceForDicePool', {
			dicePool: dice,
			extraSymbols: symbols,
			criteriaType: 'SUCCESS',
		})) as number;
	} else {
		const simulation = await Promise.all(
			[...Array(CHANCE_TO_SUCCEED_BY_SIMULATION_NUM_ROLLS)].map(async () => {
				const roll = new Roll(formula, { symbols: convertToOldSymbolsFormat(symbols) });
				const result = await roll.evaluate({ async: true });
				return GenesysRoller.parseRollResults(result);
			}),
		);
		const successfulRolls = simulation.filter((roll) => roll.netSuccess > 0);
		chanceToSucceed = successfulRolls.length / simulation.length;
	}

	probabilityOfSuccess.value = (Math.round(chanceToSucceed * 10000) / 100).toFixed(2);
}
</script>

<template>
	<div class="genesys dice-prompt">
		<!-- Header Text -->
		<header>
			<span class="hint"><Localized label="Genesys.DicePrompt.Hint" /></span>
		</header>

		<!-- Dice Pool Preview -->
		<div class="preview">
			<!-- Positive Pool -->
			<div class="positive">
				<div v-for="(dieName, index) in positiveDice" :key="index" @click="removeDie(dieName, index)" :class="`die die-${dieName}`">{{ DieType[dieName].GLYPH }}</div>
				<div v-for="(symbolName, index) in positiveSymbols" :key="index" @click="removeSymbol(symbolName, index)" class="symbol">{{ GenesysSymbol[symbolName].GLYPH }}</div>
			</div>

			<!-- Negative Pool -->
			<div class="negative">
				<div v-for="(dieName, index) in negativeDice" :key="index" @click="removeDie(dieName, index)" :class="`die die-${dieName}`">{{ DieType[dieName].GLYPH }}</div>
				<div v-for="(symbolName, index) in negativeSymbols" :key="index" @click="removeSymbol(symbolName, index)" class="symbol">{{ GenesysSymbol[symbolName].GLYPH }}</div>
			</div>

			<!-- Dice Box -->
			<div class="dice-box">
				<!-- Add Positive Dice -->
				<a @click="addDie('Ability')" data-die="Ability">A<i class="fas fa-plus"></i></a>
				<a @click="addDie('Proficiency')" data-die="Proficiency">P<i class="fas fa-plus"></i></a>
				<a @click="addDie('Boost')" data-die="Boost">B<i class="fas fa-plus"></i></a>

				<!-- Upgrade/Downgrade Positive Dice -->
				<a @click="upgradeDie('positive')" data-die="Ability">A<i class="fas fa-arrow-up"></i></a>
				<a @click="downgradeDie('positive')" data-die="Proficiency">P<i class="fas fa-arrow-down"></i></a>
				<span />

				<!-- Add Negative Dice -->
				<a @click="addDie('Difficulty')" data-die="Difficulty">D<i class="fas fa-plus"></i></a>
				<a @click="addDie('Challenge')" data-die="Challenge">C<i class="fas fa-plus"></i></a>
				<a @click="addDie('Setback')" data-die="Setback">S<i class="fas fa-plus"></i></a>

				<!-- Upgrade/Downgrade Negative Dice -->
				<a @click="upgradeDie('negative')" data-die="Difficulty">D<i class="fas fa-arrow-up"></i></a>
				<a @click="downgradeDie('negative')" data-die="Challenge">C<i class="fas fa-arrow-down"></i></a>
				<span />

				<!-- Add Positive Symbols -->
				<a @click="addSymbol('Advantage')">a<i class="fas fa-plus"></i></a>
				<a @click="addSymbol('Success')">s<i class="fas fa-plus"></i></a>
				<a @click="addSymbol('Triumph')">t<i class="fas fa-plus"></i></a>

				<!-- Add Negative Symbols -->
				<a @click="addSymbol('Threat')">h<i class="fas fa-plus"></i></a>
				<a @click="addSymbol('Failure')">f<i class="fas fa-plus"></i></a>
				<a @click="addSymbol('Despair')">d<i class="fas fa-plus"></i></a>
			</div>
		</div>

		<div v-if="context.actor" class="characteristic-skill-row">
			<!-- Characteristic Selection -->
			<select name="characteristic" :value="selectedCharacteristic ?? '-'" :disabled="selectedSkill && !USE_UNCOUPLED_SKILLS" @change="onCharacteristicChange">
				<option value="-">—</option>
				<option v-for="[charLabel, charValue] in Object.entries(Characteristic)" :key="charValue" :value="charValue"><Localized :label="`Genesys.Characteristics.${charLabel}`" /></option>
			</select>

			<!-- Skill Selection -->
			<select name="skill" :value="selectedSkill?.id ?? '-'" @change="onSkillChange">
				<option value="-">—</option>
				<option v-for="skill in availableSkills" :key="skill.id" :value="skill.id">{{ skill.name }} (<Localized :label="`Genesys.CharacteristicAbbr.${skill.systemData.characteristic.capitalize()}`" />)</option>
			</select>
		</div>

		<div v-else-if="USE_SUPER_CHARACTERISTICS" class="super-characteristic-row">
			<input type="checkbox" v-model="useSuperCharacteristic" />
			<label><Localized label="Genesys.DicePrompt.UseSuperCharacteristic" /></label>
		</div>

		<div v-if="USE_CHANCE_TO_SUCCEED" class="chance-to-succeed">
			<label>
				<i class="fas fa-circle-info" :data-tooltip="`Genesys.DicePrompt.ChanceToSucceedBy${USE_CHANCE_TO_SUCCEED_BY_PERMUTATION ? 'Permutation' : 'Simulation'}Disclaimer`"></i>
				{{ '\xa0' }}
				<Localized label="Genesys.DicePrompt.ChanceToSucceed" />
			</label>

			<i v-if="!probabilityOfSuccess" class="fas fa-spinner fa-spin"></i>
			<span v-else>{{ probabilityOfSuccess }}%</span>
		</div>

		<!-- Roll Button -->
		<button class="roll-button" @click.prevent="rollPool"><Localized label="Genesys.DicePrompt.Roll" /></button>
	</div>
</template>

<style lang="scss">
@use '@scss/mixins/backgrounds.scss';

.app-dice-prompt {
	min-width: 500px;
	min-height: 300px;

	.window-content {
		@include backgrounds.crossboxes();
	}
}
</style>

<style lang="scss" scoped>
@use '@scss/vars/colors.scss';
@use '@scss/vars/sheet.scss';

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
			font-size: 1rem;
			// color: colors.$dark-blue;
		}
	}

	.preview {
		grid-column: 1 / span all;
		grid-row: 2 / span 1;
	}

	.characteristic-skill-row {
		display: contents;
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

	.super-characteristic-row {
		grid-row: 3 / span 1;
		grid-column: 1 / span all;

		& > * {
			vertical-align: middle;
		}
	}

	.chance-to-succeed {
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

				&[data-die='Ability'] {
					color: colors.$die-ability;
				}

				&[data-die='Proficiency'] {
					color: colors.$die-proficiency;
				}

				&[data-die='Boost'] {
					color: colors.$die-boost;
				}

				&[data-die='Difficulty'] {
					-webkit-text-stroke: 0.5px white;
					text-stroke: 0.5px white;
					color: colors.$die-difficulty;

					i {
						-webkit-text-stroke: 0 transparent;
						text-stroke: 0 transparent;
					}
				}

				&[data-die='Challenge'] {
					-webkit-text-stroke: 0.5px white;
					text-stroke: 0.5px white;
					color: colors.$die-challenge;

					i {
						-webkit-text-stroke: 0 transparent;
						text-stroke: 0 transparent;
					}
				}

				&[data-die='Setback'] {
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
				text-shadow:
					0 0 0 #fff,
					0 0 1px #fff,
					0 0 2px #e60073,
					0 0 3px #e60073,
					0 0 4px #e60073,
					0 0 5px #e60073,
					0 0 6px #e60073;
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
			&.die-Ability {
				color: colors.$die-ability;
			}

			&.die-Difficulty {
				color: colors.$die-difficulty;
			}

			// Proficiency Die
			&.die-Proficiency {
				color: colors.$die-proficiency;
			}

			&.die-Challenge {
				color: colors.$die-challenge;
			}

			// Boost Die
			&.die-Boost {
				color: colors.$die-boost;
			}

			&.die-Setback {
				color: colors.$die-setback;
			}
		}
	}
}
</style>
