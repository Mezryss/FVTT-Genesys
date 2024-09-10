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
import { GenesysDice } from '@/dice';
import { DieCategory } from '@/dice/types/GenesysDie';
import { GenesysSymbol } from '@/dice/types/GenesysSymbol';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';
import GenesysActor from '@/actor/GenesysActor';
import { GenesysPoolGradeOperation } from '@/dice/types/GenesysPoolGradeOperation';
import { GenesysPoolModifications, PoolModGlyphPattern } from '@/dice/types/GenesysPoolModifications';
import GenesysEffect from '@/effects/GenesysEffect';

type AlsoNone<T> = T | undefined;
type PartialRecord<K extends keyof any, T> = Partial<Record<K, T>>;

type DieName = keyof typeof GenesysDice;
type SymbolName = keyof typeof GenesysSymbol;
type DieGradeOperationName = keyof typeof GenesysPoolGradeOperation;
type SimplePoolEntity = DieName | SymbolName;
type PoolEntity = SimplePoolEntity | DieGradeOperationName;

type NonVehicleActorDataModel = CharacterDataModel | AdversaryDataModel;

type DicePool = {
	dice: PartialRecord<DieName, number>;
	symbols: PartialRecord<SymbolName, number>;
	usesSuperCharacteristic: boolean;
};

type DicePoolModifications = {
	baseDifficulty: string[];
	manualChanges: string[];
	effects: Array<{
		name: string;
		enabled: boolean;
		mods: string[];
	}>;
};

const VALID_ACTOR_TARGET_TYPES = ['character', 'minion', 'rival', 'nemesis'];
const SORT_ORDER: Record<SimplePoolEntity, number> = {
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
const USE_CHANCE_TO_SUCCEED_BY_PERMUTATION = CONFIG.genesys.settings.showChanceToSucceedFromPermutations;
const USE_CHANCE_TO_SUCCEED = USE_CHANCE_TO_SUCCEED_BY_PERMUTATION || CONFIG.genesys.settings.showChanceToSucceedFromSimulations.enabled;

const context = inject<DicePromptContext>(RootContext)!;

const currentDicePool = ref<DicePool>({
	dice: {},
	symbols: {},
	usesSuperCharacteristic: false,
});
const poolModifications = ref<DicePoolModifications>({
	baseDifficulty: [],
	manualChanges: [],
	effects: [],
});
const availableSkills = ref<GenesysItem<SkillDataModel>[]>([]);
const selectedSkill = ref<AlsoNone<GenesysItem<SkillDataModel>>>();
const selectedCharacteristic = ref<AlsoNone<Characteristic>>();
const probabilityOfSuccess = ref<AlsoNone<string>>();

const useSuperCharacteristic = ref(false);
const showPoolModifications = ref(!CONFIG.genesys.settings.startWithCollapsedPoolModifications);

let previousDicePool: DicePool = {
	dice: {},
	symbols: {},
	usesSuperCharacteristic: false,
};

onMounted(() => {
	const actor = toRaw(context.actor);

	poolModifications.value.baseDifficulty = context.difficulty.match(PoolModGlyphPattern)?.sort(sortPoolModifications) ?? [];
	availableSkills.value = actor
		? (actor.items.filter((item) => item.type === 'skill') as GenesysItem<SkillDataModel>[]).sort((f, s) => {
				const nameA = f.name.toLowerCase();
				const nameB = s.name.toLowerCase();
				return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
			})
		: [];
	selectedSkill.value = context.skillName ? (availableSkills.value.find((skill) => skill.name === context.skillName) as AlsoNone<GenesysItem<SkillDataModel>>) : undefined;
	selectedCharacteristic.value = selectedSkill.value?.systemData.characteristic ?? context.rollUnskilled;

	calculatePoolModificationsForSkill();
	buildDicePool();
});

// Helper function for sorting dice pool modifications. These are sorted according to the steps used for modifying a
// dice pool:
//  1- Adding dice
//  2- Upgrading dice
//  3- Downgrading dice
//  4- Removing dice
//  5- Adding symbols (this is not a formal step but adding it here is done for convenience since it doesn't interfere)
//  6- Removing symbols (see above)
function sortPoolModifications(left: string, right: string) {
	return GenesysPoolModifications[left].sort - GenesysPoolModifications[right].sort;
}

function applyDicePoolModifications(dicePool: DicePool, modifierTokens: string[]) {
	for (const modifierToken of modifierTokens) {
		if (modifierToken === '^' || modifierToken === '*') {
			const [baseDice, upgradeDice]: DieName[] = modifierToken === '^' ? ['Ability', 'Proficiency'] : ['Difficulty', 'Challenge'];
			if (dicePool.dice[baseDice]) {
				dicePool.dice[baseDice]!--;
				dicePool.dice[upgradeDice] = 1 + (dicePool.dice[upgradeDice] ?? 0);
			} else {
				dicePool.dice[baseDice] = 1 + (dicePool.dice[baseDice] ?? 0);
			}
		} else if (modifierToken === '_' || modifierToken === '~') {
			const [baseDice, downgradeDice]: DieName[] = modifierToken === '_' ? ['Proficiency', 'Ability'] : ['Challenge', 'Difficulty'];
			if (dicePool.dice[baseDice]) {
				dicePool.dice[baseDice]!--;
				dicePool.dice[downgradeDice] = 1 + (dicePool.dice[downgradeDice] ?? 0);
			}
		} else {
			// If we reach this branch then the glyph is for a dice or symbol.
			let targetEntity = modifierToken;
			let direction = 1;

			// If the glyph has two characters then the first one is signaling a removal.
			if (modifierToken.length === 2) {
				targetEntity = modifierToken[1];
				direction = -1;
			}

			// Check which sub pool we want to modify. Note that dice glyphs are always uppercase letters while symbols
			// use lowercase letters.
			const targetSubPool: PartialRecord<PoolEntity, number> = targetEntity === targetEntity.toUpperCase() ? dicePool.dice : dicePool.symbols;
			const entityName = GenesysPoolModifications[targetEntity].targetName;

			// Do not let the number of dice or symbols be a negative value.
			if (direction > 0 || targetSubPool[entityName]) {
				targetSubPool[entityName] = direction + (targetSubPool[entityName] ?? 0);
			}
		}
	}
}

function aggregatePoolModifications(effects: foundry.abstract.EmbeddedCollection<ActiveEffect>, changeKeys: string[], namePrefix: string) {
	return effects.reduce<DicePoolModifications['effects']>((modifications, effect) => {
		if (!effect.isSuppressed) {
			// Find all the changes inside this effect related to the passed criteria.
			const relevantChanges = effect.changes.reduce((accum, change) => {
				if (changeKeys.includes(change.key)) {
					accum.push(...(change.value.match(PoolModGlyphPattern)?.sort(sortPoolModifications) ?? []));
				}
				return accum;
			}, [] as string[]);

			if (relevantChanges.length > 0) {
				modifications.push({
					name: namePrefix + effect.name,
					enabled: CONFIG.genesys.settings.autoApplyPoolModifications,
					mods: relevantChanges.sort(sortPoolModifications),
				});
			}
		}
		return modifications;
	}, []);
}

function calculatePoolModificationsForSkill() {
	const actor = toRaw(context.actor);
	let relevantModifications: DicePoolModifications['effects'] = [];

	if (actor) {
		const selfChangeKeys = [`${GenesysEffect.DICE_POOL_MOD_KEY_PREFIX}${GenesysEffect.DICE_POOL_MOD_CHECK_TYPE}${GenesysEffect.DICE_POOL_MOD_SELF_SOURCE}.`];
		const targetChangeKeys = [`${GenesysEffect.DICE_POOL_MOD_KEY_PREFIX}${GenesysEffect.DICE_POOL_MOD_CHECK_TYPE}${GenesysEffect.DICE_POOL_MOD_TARGET_SOURCE}.`];

		if (selectedCharacteristic.value) {
			const charPoolModKey = `${GenesysEffect.DICE_POOL_MOD_KEY_PREFIX}${GenesysEffect.DICE_POOL_MOD_CHAR_TYPE}`;
			selfChangeKeys.push(`${charPoolModKey}${GenesysEffect.DICE_POOL_MOD_SELF_SOURCE}.${selectedCharacteristic.value}`);
			targetChangeKeys.push(`${charPoolModKey}${GenesysEffect.DICE_POOL_MOD_TARGET_SOURCE}.${selectedCharacteristic.value}`);
		}
		if (selectedSkill.value) {
			const skillPoolModKey = `${GenesysEffect.DICE_POOL_MOD_KEY_PREFIX}${GenesysEffect.DICE_POOL_MOD_SKILL_TYPE}`;
			selfChangeKeys.push(`${skillPoolModKey}${GenesysEffect.DICE_POOL_MOD_SELF_SOURCE}.${selectedSkill.value.name}`);
			targetChangeKeys.push(`${skillPoolModKey}${GenesysEffect.DICE_POOL_MOD_TARGET_SOURCE}.${selectedSkill.value.name}`);
		}

		relevantModifications.push(...aggregatePoolModifications(actor.effects, selfChangeKeys, game.i18n.localize('Genesys.DicePrompt.PoolModifications.SelfEffects')));

		if (game.user.targets.size === 1) {
			const [chosenTarget] = game.user.targets;
			if (VALID_ACTOR_TARGET_TYPES.includes(chosenTarget.actor?.type ?? '')) {
				relevantModifications.push(
					...aggregatePoolModifications((chosenTarget.actor?.effects ?? []) as foundry.abstract.EmbeddedCollection<ActiveEffect>, targetChangeKeys, game.i18n.localize('Genesys.DicePrompt.PoolModifications.TargetEffects')),
				);

				if (context.rollType === RollType.Attack) {
					const defenseType = (context.rollData as AttackRollData).weapon.systemData.range === 'engaged' ? 'melee' : 'ranged';
					relevantModifications.push({
						name: game.i18n.localize('Genesys.DicePrompt.PoolModifications.TargetEffects') + game.i18n.localize(`Genesys.Labels.${defenseType.capitalize()}Defense`),
						enabled: CONFIG.genesys.settings.autoApplyPoolModifications,
						mods: Array((chosenTarget.actor as GenesysActor<NonVehicleActorDataModel>).systemData.defense[defenseType]).fill(GenesysDice.Setback.GLYPH),
					});
				}
			}
		}
	}

	poolModifications.value.effects = relevantModifications;
}

function buildDicePool() {
	const actor = context.actor as AlsoNone<GenesysActor<NonVehicleActorDataModel>>;
	let proficiencyDice;
	let abilityDice;
	let usesSuperCharacteristic = USE_SUPER_CHARACTERISTICS;

	// Step 1: Applying Skills and Characteristics
	if (actor) {
		const characteristicValue = selectedCharacteristic.value ? actor.systemData.characteristics[selectedCharacteristic.value] : 0;
		let skillValue = selectedSkill.value?.systemData.rank ?? 0;

		if (actor.type === 'minion' && selectedSkill.value) {
			skillValue = Math.max(0, (actor.systemData as MinionDataModel).remainingMembers - 1);
		}

		proficiencyDice = Math.min(characteristicValue, skillValue);
		abilityDice = Math.max(characteristicValue, skillValue) - proficiencyDice;
		usesSuperCharacteristic &&= !!selectedCharacteristic.value && actor.systemData.superCharacteristics.has(selectedCharacteristic.value);
	} else {
		proficiencyDice = 0;
		abilityDice = 0;
		usesSuperCharacteristic &&= useSuperCharacteristic.value;
	}

	const dicePool = {
		dice: {
			Proficiency: proficiencyDice,
			Ability: abilityDice,
		},
		symbols: {},
		usesSuperCharacteristic,
	};
	const modifications = poolModifications.value;

	// Step 2: Applying Task Difficulty
	applyDicePoolModifications(dicePool, modifications.baseDifficulty);

	// Step 3: Modifying a Dice Pool
	const activeModifications = [...modifications.manualChanges];
	modifications.effects.forEach((effect) => {
		if (effect.enabled) {
			activeModifications.push(...effect.mods);
		}
	});

	// We sort the modifications so that they follow the proper sub-steps when applied to the dice pool.
	applyDicePoolModifications(dicePool, activeModifications.sort(sortPoolModifications));
	currentDicePool.value = dicePool;

	approximateProbability();
}

function compileDiceFormula() {
	const usesSuperCharacteristic = currentDicePool.value.usesSuperCharacteristic;
	const formula = Object.entries(currentDicePool.value.dice)
		.map(([dieKey, dieAmount]) => {
			const dieName = dieKey as DieName;
			const explodeDice = dieName === 'Proficiency' && usesSuperCharacteristic ? 'X' : '';
			return `${dieAmount}${GenesysDice[dieName].FORMULA}${explodeDice}`;
		})
		.join('+');

	return formula === '' ? '0' : formula;
}

// Convert the symbols object into the old format to make the GenesysRoller understand it.
// A refactor of said class should get rid of this method.
function compileSymbolsData() {
	return Object.entries(currentDicePool.value.symbols).reduce(
		(accum, [symbolName, symbolAmount]) => {
			accum[GenesysSymbol[symbolName as SymbolName].GLYPH] = symbolAmount;
			return accum;
		},
		{} as Record<string, number>,
	);
}

function hasSameChanceToSucceed(firstDicePool: DicePool, secondDicePool: DicePool) {
	// Dice always contribute to the success rate so any difference implies the pools have different probabilities.
	const diceTypes = new Set([...Object.keys(firstDicePool.dice), ...Object.keys(secondDicePool.dice)]);
	for (const diceType of diceTypes) {
		if ((firstDicePool.dice[diceType as DieName] ?? 0) !== (secondDicePool.dice[diceType as DieName] ?? 0)) {
			return false;
		}
	}

	// Even if the dice on both pools are the same a discrepancy in super-characteristics will yield different results.
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

	const dicePool = currentDicePool.value;
	const obsoleteDicePool = previousDicePool;
	previousDicePool = dicePool;

	// Slight optimization for a pool without dice.
	if (Object.values(dicePool.dice).reduce((accum, amount) => accum + amount) === 0) {
		const totalSuccesses = (dicePool.symbols.Success ?? 0) + (dicePool.symbols.Triumph ?? 0);
		const totalFailures = (dicePool.symbols.Failure ?? 0) + (dicePool.symbols.Despair ?? 0);
		const deterministicResult = totalSuccesses > totalFailures ? 100 : 0;
		probabilityOfSuccess.value = deterministicResult.toFixed(2);
		return;
	}

	// No need to run this process again if nothing of importance has changed.
	if (hasSameChanceToSucceed(obsoleteDicePool, dicePool)) {
		return;
	}

	let chanceToSucceed = 0;
	if (USE_CHANCE_TO_SUCCEED_BY_PERMUTATION) {
		const worker = game.workers.get(CALCULATE_CHANCE_WORKER_NAME);
		if (!worker) {
			probabilityOfSuccess.value = undefined;
			return;
		}

		const rawDicePool = toRaw(dicePool);
		chanceToSucceed = (await worker.executeFunction('calculateChanceForDicePool', [
			{
				dicePool: rawDicePool.dice,
				extraSymbols: rawDicePool.symbols,
				criteriaType: 'SUCCESS',
			},
		])) as number;
	} else {
		const formula = compileDiceFormula();
		const symbols = { symbols: compileSymbolsData() };
		const simulation = await Promise.all(
			[...Array(CHANCE_TO_SUCCEED_BY_SIMULATION_NUM_ROLLS)].map(async () => {
				const roll = new Roll(formula, symbols);
				const result = await roll.evaluate();
				return GenesysRoller.parseRollResults(result);
			}),
		);
		const successfulRolls = simulation.filter((roll) => roll.netSuccess > 0);
		chanceToSucceed = successfulRolls.length / simulation.length;
	}

	probabilityOfSuccess.value = (Math.round(chanceToSucceed * 10000) / 100).toFixed(2);
}

function onSkillChange(event: Event) {
	const selectedOption = event.currentTarget as HTMLSelectElement;
	selectedSkill.value = availableSkills.value.find((s) => s.id === selectedOption.value) as AlsoNone<GenesysItem<SkillDataModel>>;
	selectedCharacteristic.value = selectedSkill.value?.systemData.characteristic;

	calculatePoolModificationsForSkill();
	buildDicePool();
}

function onCharacteristicChange(event: Event) {
	const selectedOption = event.currentTarget as HTMLSelectElement;
	selectedCharacteristic.value = selectedOption.value !== '-' ? (selectedOption.value as Characteristic) : undefined;

	buildDicePool();
}

function getOrderedDice(category: DieCategory) {
	return Object.entries(currentDicePool.value.dice)
		.filter(([dieName]) => GenesysDice[dieName as DieName].CATEGORY === category)
		.sort(([left], [right]) => SORT_ORDER[left as DieName] - SORT_ORDER[right as DieName]);
}

function getOrderedSymbols(category: DieCategory) {
	return Object.entries(currentDicePool.value.symbols)
		.filter(([symbolName]) => GenesysSymbol[symbolName as SymbolName].CATEGORY === category)
		.sort(([left], [right]) => SORT_ORDER[left as SymbolName] - SORT_ORDER[right as SymbolName]);
}

function addDiceOperation(dieName: DieName, isRemoval: boolean = false) {
	poolModifications.value.manualChanges.push(`${isRemoval ? '-' : ''}${GenesysDice[dieName].GLYPH}`);
	poolModifications.value.manualChanges.sort(sortPoolModifications);
	buildDicePool();
}

function addSymbolOperation(symbolName: SymbolName, isRemoval: boolean = false) {
	poolModifications.value.manualChanges.push(`${isRemoval ? '-' : ''}${GenesysSymbol[symbolName].GLYPH}`);
	poolModifications.value.manualChanges.sort(sortPoolModifications);
	buildDicePool();
}

function addPoolOperation(operationName: DieGradeOperationName) {
	poolModifications.value.manualChanges.push(GenesysPoolGradeOperation[operationName].GLYPH);
	poolModifications.value.manualChanges.sort(sortPoolModifications);
	buildDicePool();
}

function removeManualChange(index: number) {
	poolModifications.value.manualChanges.splice(index, 1);
	buildDicePool();
}

async function rollPool() {
	const formula = compileDiceFormula();
	const symbols = compileSymbolsData();
	const baseRollData = {
		actor: toRaw(context.actor),
		characteristic: selectedCharacteristic.value,
		skillId: selectedSkill.value?.id ?? '-',
		formula,
		symbols,
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
				roll: new Roll(formula, { symbols }),
				skillName: selectedSkill.value?.name ?? 'Unskilled',
			});
			break;

		default:
			await GenesysRoller.skillRoll(baseRollData);
	}

	await context.app.close();
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
				<template v-for="[dieName, amount] in getOrderedDice('positive')" :key="dieName">
					<div v-for="index in amount" :key="`${dieName}-${index}`" @click="addDiceOperation(dieName as DieName, true)" :class="`die die-${dieName}`">
						{{ GenesysDice[dieName as DieName].GLYPH }}
					</div>
				</template>
				<template v-for="[symbolName, amount] in getOrderedSymbols('positive')" :key="symbolName">
					<div v-for="index in amount" :key="`${symbolName}-${index}`" @click="addSymbolOperation(symbolName as SymbolName, true)" class="symbol">
						{{ GenesysSymbol[symbolName as SymbolName].GLYPH }}
					</div>
				</template>
			</div>

			<!-- Negative Pool -->
			<div class="negative">
				<template v-for="[dieName, amount] in getOrderedDice('negative')" :key="dieName">
					<div v-for="index in amount" :key="`${dieName}-${index}`" @click="addDiceOperation(dieName as DieName, true)" :class="`die die-${dieName}`">
						{{ GenesysDice[dieName as DieName].GLYPH }}
					</div>
				</template>
				<template v-for="[symbolName, amount] in getOrderedSymbols('negative')" :key="symbolName">
					<div v-for="index in amount" :key="`${symbolName}-${index}`" @click="addSymbolOperation(symbolName as SymbolName, true)" class="symbol">
						{{ GenesysSymbol[symbolName as SymbolName].GLYPH }}
					</div>
				</template>
			</div>

			<!-- Dice Box -->
			<div class="dice-box">
				<!-- Add Positive Dice -->
				<a @click="addDiceOperation('Ability')" data-pool-entity="Ability">A<i class="fas fa-plus"></i></a>
				<a @click="addDiceOperation('Proficiency')" data-pool-entity="Proficiency">P<i class="fas fa-plus"></i></a>
				<a @click="addDiceOperation('Boost')" data-pool-entity="Boost">B<i class="fas fa-plus"></i></a>

				<!-- Upgrade/Downgrade Positive Dice -->
				<a @click="addPoolOperation('UpgradeAbility')" data-pool-entity="Ability">A<i class="fas fa-arrow-up"></i></a>
				<a @click="addPoolOperation('DowngradeAbility')" data-pool-entity="Proficiency">P<i class="fas fa-arrow-down"></i></a>
				<span />

				<!-- Add Negative Dice -->
				<a @click="addDiceOperation('Difficulty')" data-pool-entity="Difficulty">D<i class="fas fa-plus"></i></a>
				<a @click="addDiceOperation('Challenge')" data-pool-entity="Challenge">C<i class="fas fa-plus"></i></a>
				<a @click="addDiceOperation('Setback')" data-pool-entity="Setback">S<i class="fas fa-plus"></i></a>

				<!-- Upgrade/Downgrade Negative Dice -->
				<a @click="addPoolOperation('UpgradeDifficulty')" data-pool-entity="Difficulty">D<i class="fas fa-arrow-up"></i></a>
				<a @click="addPoolOperation('DowngradeDifficulty')" data-pool-entity="Challenge">C<i class="fas fa-arrow-down"></i></a>
				<span />

				<!-- Add Positive Symbols -->
				<a @click="addSymbolOperation('Advantage')">a<i class="fas fa-plus"></i></a>
				<a @click="addSymbolOperation('Success')">s<i class="fas fa-plus"></i></a>
				<a @click="addSymbolOperation('Triumph')">t<i class="fas fa-plus"></i></a>

				<!-- Add Negative Symbols -->
				<a @click="addSymbolOperation('Threat')">h<i class="fas fa-plus"></i></a>
				<a @click="addSymbolOperation('Failure')">f<i class="fas fa-plus"></i></a>
				<a @click="addSymbolOperation('Despair')">d<i class="fas fa-plus"></i></a>
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

		<div class="pool-modifications-title" @click="showPoolModifications = !showPoolModifications">
			<i :class="`fas fa-caret-${showPoolModifications ? 'down' : 'right'}`"></i>
			<span><Localized label="Genesys.DicePrompt.PoolModifications.Title" /></span>
		</div>

		<div :class="{ 'pool-modifications-expander': true, 'pool-modifications-expanded': showPoolModifications }">
			<div class="pool-modifications-container">
				<div>
					<span><Localized label="Genesys.DicePrompt.PoolModifications.DefaultDifficulty" /></span>
					<div>
						<a v-for="(modification, index) in poolModifications.baseDifficulty" :key="index" :data-pool-entity="GenesysPoolModifications[modification].icon.baseName">
							{{ GenesysPoolModifications[modification].icon.baseGlyph }}<i :class="`fas ${GenesysPoolModifications[modification].icon.operator}`"></i>
						</a>
					</div>
				</div>
				<div class="pool-modifications-manual">
					<span><Localized label="Genesys.DicePrompt.PoolModifications.ManualChanges" /></span>
					<div>
						<a v-for="(modification, index) in poolModifications.manualChanges" :key="index" @click="removeManualChange(index)" :data-pool-entity="GenesysPoolModifications[modification].icon.baseName">
							{{ GenesysPoolModifications[modification].icon.baseGlyph }}<i :class="`fas ${GenesysPoolModifications[modification].icon.operator}`"></i>
						</a>
					</div>
				</div>
				<div v-for="(effect, index) in poolModifications.effects" :key="index" class="pool-modifications-effects">
					<span>
						<input type="checkbox" v-model="effect.enabled" @change="buildDicePool()" />
						<label>{{ '\xa0' + effect.name }}</label>
					</span>
					<div>
						<a v-for="(modification, index) in effect.mods" :key="index" :data-pool-entity="GenesysPoolModifications[modification].icon.baseName">
							{{ GenesysPoolModifications[modification].icon.baseGlyph }}<i :class="`fas ${GenesysPoolModifications[modification].icon.operator}`"></i>
						</a>
					</div>
				</div>
			</div>
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
@use '@scss/mixins/reset.scss';

.dice-prompt {
	display: grid;
	grid-template-columns: 2fr 1fr 2fr;
	grid-template-rows: /* Header */ auto /* Dice Pool */ 1fr /* Skill & Characteristic */ auto;
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

	.pool-modifications-title {
		grid-column: 1 / span all;
		grid-row: 4 / span all;
		display: grid;
		grid-template-columns: 1rem 1fr;
		font-family: 'Bebas Neue', sans-serif;
		font-size: 1.2rem;
		margin-bottom: -0.5em;
	}

	.pool-modifications-expander {
		grid-column: 1 / span all;
		grid-row: 5 / span all;
		display: grid;
		grid-template-rows: 0fr;
		overflow: hidden;
		transition: grid-template-rows 1s;

		&.pool-modifications-expanded {
			grid-template-rows: 1fr;

			.pool-modifications-container {
				visibility: visible;
			}
		}
	}

	.pool-modifications-container {
		display: grid;
		font-family: 'Roboto', sans-serif;
		margin-left: 1rem;
		border-top: 1px dotted black;

		min-height: 0;
		transition: visibility 1s;
		visibility: hidden;

		& > div {
			display: grid;
			grid-template-columns: 2fr 1.2fr;
			border-bottom: 1px dotted black;
			min-height: 1.2rem;

			& > span {
				padding-right: 4px;
			}

			& > div {
				border-left: 1px dotted black;
				padding-left: 0.5rem;

				a {
					position: relative;
					top: 3px;
				}
			}
		}

		a {
			display: inline-flex;
			flex-direction: row;
			flex-wrap: nowrap;
			align-items: flex-start;
			font-family: 'Genesys Symbols', sans-serif;
			margin-right: 0.2rem;
			cursor: default;

			&[data-pool-entity] > i.fas {
				-webkit-text-stroke: 0 transparent;
				text-stroke: 0 transparent;
			}

			&[data-pool-entity='Ability'] {
				-webkit-text-stroke: 0.5px black;
				text-stroke: 0.5px black;
				color: colors.$die-ability;
			}

			&[data-pool-entity='Proficiency'] {
				-webkit-text-stroke: 0.5px black;
				text-stroke: 0.5px black;
				color: colors.$die-proficiency;
			}

			&[data-pool-entity='Boost'] {
				-webkit-text-stroke: 0.5px black;
				text-stroke: 0.5px black;
				color: colors.$die-boost;
			}

			&[data-pool-entity='Difficulty'] {
				-webkit-text-stroke: 0.5px black;
				text-stroke: 0.5px black;
				color: colors.$die-difficulty;
			}

			&[data-pool-entity='Challenge'] {
				-webkit-text-stroke: 0.5px black;
				text-stroke: 0.5px black;
				color: colors.$die-challenge;
			}

			&[data-pool-entity='Setback'] {
				-webkit-text-stroke: 0.5px black;
				text-stroke: 0.5px black;
				color: colors.$die-setback;
			}
		}

		i {
			color: black;
			position: relative;
			font-size: 0.5em;
			top: -0.25em;
		}

		.pool-modifications-manual {
			a {
				cursor: pointer;
			}
		}

		.pool-modifications-effects {
			@include reset.input;
			input {
				height: 1em;
			}
		}
	}

	.chance-to-succeed {
		grid-column: 1 / span 2;
		grid-row: 6 / span 1;
		margin-top: 1rem;

		label {
			margin-right: 1rem;
		}
	}

	.roll-button {
		grid-column: 3 / span 1;
		grid-row: 6 / span 1;
		margin-top: 1rem;
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

				&[data-pool-entity='Ability'] {
					color: colors.$die-ability;
				}

				&[data-pool-entity='Proficiency'] {
					color: colors.$die-proficiency;
				}

				&[data-pool-entity='Boost'] {
					color: colors.$die-boost;
				}

				&[data-pool-entity='Difficulty'] {
					-webkit-text-stroke: 0.5px white;
					text-stroke: 0.5px white;
					color: colors.$die-difficulty;

					i {
						-webkit-text-stroke: 0 transparent;
						text-stroke: 0 transparent;
					}
				}

				&[data-pool-entity='Challenge'] {
					-webkit-text-stroke: 0.5px white;
					text-stroke: 0.5px white;
					color: colors.$die-challenge;

					i {
						-webkit-text-stroke: 0 transparent;
						text-stroke: 0 transparent;
					}
				}

				&[data-pool-entity='Setback'] {
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
