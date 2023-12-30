/**
 * This class represents a symbol that might appear on a die face.
 * @class
 */
class GenesysSymbol {
	#denomination;
	#opposes;
	#alsoIn;

	/**
	 * @param {Object} symbolData - An object with data necessary for creating a symbol.
	 * @param {string} symbolData.denomination - A character that represents the symbol.
	 * @param {GenesysSymbol=} symbolData.opposes - Another symbol that opposes this one.
	 * @param {GenesysSymbol=} symbolData.alsoIn - Another symbol that is also treated as this one.
	 */
	constructor({ denomination, opposes, alsoIn }) {
		this.#denomination = denomination;
		this.#opposes = opposes;
		this.#alsoIn = alsoIn;

		// Both symbols are each other's opposite.
		if (opposes) {
			opposes.#opposes = this;
		}
	}

	get denomination() {
		return this.#denomination;
	}

	get opposes() {
		return this.#opposes;
	}

	get alsoIn() {
		return this.#alsoIn;
	}
}

/**
 * An object containing all the possible symbols that can appear on a dice face.
 * @type Record<string, GenesysSymbol>
 */
const Symbols = {};
Symbols.Triumph = new GenesysSymbol({ denomination: 't' });
Symbols.Advantage = new GenesysSymbol({ denomination: 'a' });
Symbols.Success = new GenesysSymbol({ denomination: 's', alsoIn: Symbols.Triumph });

Symbols.Despair = new GenesysSymbol({ denomination: 'd' });
Symbols.Threat = new GenesysSymbol({ denomination: 'h', opposes: Symbols.Advantage });
Symbols.Failure = new GenesysSymbol({ denomination: 'f', opposes: Symbols.Success, alsoIn: Symbols.Despair });

// A map of symbol denominations to their instances.
const SymbolFromDenomination = new Map(Object.values(Symbols).map((symbol) => [symbol.denomination, symbol]));

/**
 * This class represents one of the faces of a die.
 * @class
 */
class GenesysDieFace {
	#symbols;

	/**
	 * @param {GenesysSymbol[]} symbols - A list of symbols on this die face.
	 */
	constructor(symbols) {
		this.#symbols = symbols;
	}

	toCompactString() {
		const symbols = {};
		this.#symbols.forEach((symbol) => {
			const charSymbol = symbol.denomination;
			symbols[charSymbol] = 1 + (symbols[charSymbol] ?? 0);
		});

		return Object.keys(symbols)
			.sort()
			.map((symbolDenom) => `${symbols[symbolDenom]}${symbolDenom}`)
			.join('');
	}
}

/**
 * This class represents a dice.
 * @class
 */
class GenesysDie {
	#denomination;
	#faces;

	/**
	 *
	 * @param {Object} dieData - An object with data necessary for creating a die.
	 * @param {string} dieData.denomination - A character that represents the die.
	 * @param {GenesysDieFace[]} dieData.faces - A list of faces on this die.
	 */
	constructor({ denomination, faces }) {
		this.#denomination = denomination;
		this.#faces = faces;
	}

	get denomination() {
		return this.#denomination;
	}

	get faces() {
		return this.#faces;
	}
}

/**
 * An object containing all the possible dice that can appear on a pool.
 * @type Record<string, GenesysDie>
 */
const Dice = {
	Boost: new GenesysDie({
		denomination: 'B',
		faces: [
			new GenesysDieFace([]),
			new GenesysDieFace([]),
			new GenesysDieFace([Symbols.Success]),
			new GenesysDieFace([Symbols.Success, Symbols.Advantage]),
			new GenesysDieFace([Symbols.Advantage, Symbols.Advantage]),
			new GenesysDieFace([Symbols.Advantage]),
		],
	}),
	Ability: new GenesysDie({
		denomination: 'A',
		faces: [
			new GenesysDieFace([]),
			new GenesysDieFace([Symbols.Success]),
			new GenesysDieFace([Symbols.Success]),
			new GenesysDieFace([Symbols.Success, Symbols.Success]),
			new GenesysDieFace([Symbols.Advantage]),
			new GenesysDieFace([Symbols.Advantage]),
			new GenesysDieFace([Symbols.Success, Symbols.Advantage]),
			new GenesysDieFace([Symbols.Advantage, Symbols.Advantage]),
		],
	}),
	Proficiency: new GenesysDie({
		denomination: 'P',
		faces: [
			new GenesysDieFace([]),
			new GenesysDieFace([Symbols.Success]),
			new GenesysDieFace([Symbols.Success]),
			new GenesysDieFace([Symbols.Success, Symbols.Success]),
			new GenesysDieFace([Symbols.Success, Symbols.Success]),
			new GenesysDieFace([Symbols.Advantage]),
			new GenesysDieFace([Symbols.Success, Symbols.Advantage]),
			new GenesysDieFace([Symbols.Success, Symbols.Advantage]),
			new GenesysDieFace([Symbols.Success, Symbols.Advantage]),
			new GenesysDieFace([Symbols.Advantage, Symbols.Advantage]),
			new GenesysDieFace([Symbols.Advantage, Symbols.Advantage]),
			new GenesysDieFace([Symbols.Triumph]),
		],
	}),

	Setback: new GenesysDie({
		denomination: 'S',
		faces: [new GenesysDieFace([]), new GenesysDieFace([]), new GenesysDieFace([Symbols.Failure]), new GenesysDieFace([Symbols.Failure]), new GenesysDieFace([Symbols.Threat]), new GenesysDieFace([Symbols.Threat])],
	}),
	Difficulty: new GenesysDie({
		denomination: 'D',
		faces: [
			new GenesysDieFace([]),
			new GenesysDieFace([Symbols.Failure]),
			new GenesysDieFace([Symbols.Failure, Symbols.Failure]),
			new GenesysDieFace([Symbols.Threat]),
			new GenesysDieFace([Symbols.Threat]),
			new GenesysDieFace([Symbols.Threat]),
			new GenesysDieFace([Symbols.Threat, Symbols.Threat]),
			new GenesysDieFace([Symbols.Failure, Symbols.Threat]),
		],
	}),
	Challenge: new GenesysDie({
		denomination: 'C',
		faces: [
			new GenesysDieFace([]),
			new GenesysDieFace([Symbols.Failure]),
			new GenesysDieFace([Symbols.Failure]),
			new GenesysDieFace([Symbols.Failure, Symbols.Failure]),
			new GenesysDieFace([Symbols.Failure, Symbols.Failure]),
			new GenesysDieFace([Symbols.Threat]),
			new GenesysDieFace([Symbols.Threat]),
			new GenesysDieFace([Symbols.Failure, Symbols.Threat]),
			new GenesysDieFace([Symbols.Failure, Symbols.Threat]),
			new GenesysDieFace([Symbols.Threat, Symbols.Threat]),
			new GenesysDieFace([Symbols.Threat, Symbols.Threat]),
			new GenesysDieFace([Symbols.Despair]),
		],
	}),
};

// A map of dice denominations to their instances.
const DiceFromDenomination = new Map(Object.values(Dice).map((dice) => [dice.denomination, dice]));

/**
 * This function is used to construct the key for a simple pool (one where there is only one type of
 * object present).
 * @param {{denomination: string}} obj - The type of object that's on the pool.
 * @param {number} amount - The number of objects of the provided type that are on the pool.
 * @returns {string} A key that represents the passed pool.
 */
function constructKeyFromSimplePool(obj, amount) {
	return `${amount}${obj.denomination}`;
}

/**
 * This function is used to construct the key for a mixed pool (one where there can be more than one
 * type of object present).
 * @param {Map<{denomination: string}, number>} objectsPool - A map that describes the pool.
 * @returns {string} A key that represents the passed pool.
 */
function constructKeyFromMixedPool(objectsPool) {
	const sortedPool = [...objectsPool].sort(([fObj], [sObj]) => denominationSorter(fObj, sObj));

	return sortedPool.map(([obj, amount]) => constructKeyFromSimplePool(obj, amount)).join('');
}

/**
 * A function used to sort objects by their `denomination` string field.
 * @param {{denomination: string}} first - The first object to compare.
 * @param {{denomination: string}} second - The second object to compare.
 * @returns {number} A number that signals the direction into which to sort the provided objects.
 */
function denominationSorter(first, second) {
	if (first.denomination > second.denomination) {
		return 1;
	}
	if (first.denomination < second.denomination) {
		return -1;
	}
	return 0;
}

/**
 * A singleton that creates all the possible permutations for a given dice pool. It caches these
 * results for subsequent calls.
 */
const Permutations = (function () {
	/**
	 * This object is a cache of all the permutations calculated for simple dice pools.
	 * @type Record<string, Record<string, number>>
	 */
	const cacheForSimple = {};

	/**
	 * This object is a cache of all the permutations calculated for mixed dice pools.
	 * @type Record<string, Record<string, number>>
	 */
	const cacheForMixed = {};

	/**
	 * This function is used to generate a mixed dice pool given a string representation of it.
	 * @param {string} poolString - The string representation of a dice pool.
	 * @returns {Map<GenesysDie, number>} A map that describes the given dice pool.
	 */
	function generateMixedPoolFromString(poolString) {
		const dicePool = new Map();
		const matchedDice = [...poolString.matchAll(/(\d+)(\w)/g)];

		for (const [, amount, denomination] of matchedDice) {
			dicePool.set(DiceFromDenomination.get(denomination), parseInt(amount, 10));
		}

		return dicePool;
	}

	/**
	 * This function takes two string representation of a collection of symbols and returns a new string
	 * that correctly combines both of them.
	 * @param {string} firstGroup - A string representation of a collection of symbols.
	 * @param {string} secondGroup - A string representation of a collection of symbols.
	 * @returns {string} A string representation that counts all the symbols on the provided collections.
	 */
	function mergeSymbolsString(firstGroup, secondGroup) {
		const symbols = {};
		const matchedSymbols = [...(firstGroup + secondGroup).matchAll(/(\d+)(\w)/g)];
		matchedSymbols.forEach(([, amount, denomination]) => {
			symbols[denomination] = parseInt(amount, 10) + (symbols[denomination] ?? 0);
		});

		return Object.keys(symbols)
			.sort()
			.map((symbolDenom) => `${symbols[symbolDenom]}${symbolDenom}`)
			.join('');
	}

	/**
	 * This function creates all the possible permutations for a pool of dice of only one type.
	 * @param {GenesysDie} dice - The type of dice that's on the pool.
	 * @param {number} amount - The number of dice of the provided type that are on the pool.
	 * @returns {Record<string, number>} All the permutations for the passed pool.
	 */
	function forSimplePool(dice, amount) {
		const poolKey = constructKeyFromSimplePool(dice, amount);

		if (cacheForSimple[poolKey]) {
			return cacheForSimple[poolKey];
		} else if (amount === 1) {
			// For only one dice just go through all the faces and aggregate those that are the same.
			cacheForSimple[poolKey] = dice.faces.reduce((accum, face) => {
				const permutation = face.toCompactString();
				accum[permutation] = 1 + (accum[permutation] ?? 0);
				return accum;
			}, {});

			return cacheForSimple[poolKey];
		} else if (amount > 1) {
			// For more than one dice find the permutations for half the pool and then combine them.
			const largeHalf = Math.ceil(amount / 2);
			const smallHalf = Math.floor(amount / 2);
			cacheForSimple[poolKey] = combinePermutations(forSimplePool(dice, largeHalf), forSimplePool(dice, smallHalf));

			return cacheForSimple[poolKey];
		}

		return {};
	}

	/**
	 * This function creates all the possible permutations for a pool of dice of mixed type.
	 * @param {Map<GenesysDie, number>} dicePool - The pool of dice with their types and amount.
	 * @returns {Record<string, number>} All the permutations for the passed pool.
	 */
	function forMixedPool(dicePool) {
		const poolKey = constructKeyFromMixedPool(dicePool);
		if (cacheForMixed[poolKey]) {
			return cacheForMixed[poolKey];
		}

		// Find the closest dice pool with their permutations already generated, and then use it as the base
		// to generate the current pool's permutations.
		let closestCachedPoolKey = '';
		let closestCachedPool = new Map([...dicePool.keys()].map((dice) => [dice, 0]));
		for (const cacheKey of Object.keys(cacheForMixed)) {
			const currentDicePool = generateMixedPoolFromString(cacheKey);
			if (
				dicePool.size >= currentDicePool.size &&
				[...currentDicePool.entries()].every(([dice, amount]) => {
					return dicePool.get(dice) >= amount && amount >= closestCachedPool.get(dice);
				})
			) {
				closestCachedPoolKey = cacheKey;
				closestCachedPool = currentDicePool;
			}
		}

		let partialPermutations = cacheForMixed[closestCachedPoolKey] ?? {};
		for (const [dice, amount] of dicePool) {
			const remainingDice = amount - (closestCachedPool.get(dice) ?? 0);
			partialPermutations = combinePermutations(partialPermutations, forSimplePool(dice, remainingDice));
		}

		cacheForMixed[poolKey] = partialPermutations;
		return partialPermutations;
	}

	/**
	 * This function takes two collections of permutations and combine them together into a new collection.
	 * @param {Record<string, number>} firstGroup - A collection of permutations.
	 * @param {Record<string, number>} secondGroup - A collection of permutations.
	 * @returns {Record<string, number>} A collection of permutations created by taking the cartesian product of
	 *      the passed collections.
	 */
	function combinePermutations(firstGroup, secondGroup) {
		const fgEntries = Object.entries(firstGroup);
		if (fgEntries.length === 0) {
			return secondGroup;
		}

		const sgEntries = Object.entries(secondGroup);
		if (sgEntries.length === 0) {
			return firstGroup;
		}

		const combined = {};
		for (const [fgPermutation, fgCount] of fgEntries) {
			for (const [sgPermutation, sgCount] of sgEntries) {
				const newPermutation = mergeSymbolsString(fgPermutation, sgPermutation);

				combined[newPermutation] = fgCount * sgCount + (combined[newPermutation] ?? 0);
			}
		}

		return combined;
	}

	return {
		forPool: forMixedPool,
	};
})();

/**
 * An object containing all the possible criteria that can be used.
 * @type Record<string, (evaluation: Map<GenesysSymbol, number>) => boolean>
 */
const Criteria = {
	SUCCESS: (evaluation) => {
		return evaluation.get(Symbols.Success) > 0;
	},
};

/**
 * This function takes in a string representation of a collection of symbols and returns it as a dictionary.
 * @param {string} symbolsString - A string that represents a collection of symbols.
 * @returns {Map<GenesysSymbol, number>} A dictionary of the symbols present on the provided string.
 */
function getAndGroupSymbols(symbolsString) {
	const symbols = new Map();
	const matchedSymbols = [...symbolsString.matchAll(/(\d+)(\w)/g)];

	for (const [, amount, denomination] of matchedSymbols) {
		symbols.set(SymbolFromDenomination.get(denomination), parseInt(amount, 10));
	}

	return symbols;
}

/**
 * This function takes in two collections of different symbols and evaluate their interaction.
 * @param {Map<GenesysSymbol, number>} symbols - A list of different symbol types and their amount.
 * @param {Map<GenesysSymbol, number>} extraSymbols - An additional list of symbols and their amount.
 * @returns {Map<GenesysSymbol, number>} A dictionary of symbols and their total amount after taking into account
 *      any interactions between them.
 */
function evaluateSymbols(symbols, extraSymbols) {
	const evaluation = new Map();

	for (const symbol of Object.values(Symbols)) {
		let total = 0;

		total += extraSymbols.get(symbol) ?? 0;
		total -= extraSymbols.get(symbol.opposes) ?? 0;
		total += extraSymbols.get(symbol.alsoIn) ?? 0;
		total -= extraSymbols.get(symbol.opposes?.alsoIn) ?? 0;

		total += symbols.get(symbol) ?? 0;
		total -= symbols.get(symbol.opposes) ?? 0;
		total += symbols.get(symbol.alsoIn) ?? 0;
		total -= symbols.get(symbol.opposes?.alsoIn) ?? 0;

		evaluation.set(symbol, total);
	}

	return evaluation;
}

/**
 * This function calculates the total number of permutations possible for a given dice pool.
 * @param {Map<GenesysDie, number>} dicePool - A pool of dice with their types and amount.
 * @returns {number} The total number of possible permutations.
 */
function calculateTotalPermutations(dicePool) {
	let totalPermutations = 1;
	for (const [dice, amount] of dicePool) {
		totalPermutations *= Math.pow(dice.faces.length, amount);
	}

	return totalPermutations;
}

/**
 * This function calculates the chance of meeting the provided criteria given the provided dice pool.
 * @param {Map<GenesysDie, number} dicePool - A pool of dice with their types and amount.
 * @param {Map<GenesysSymbol, number} extraSymbols - A collection of extra symbols to add to the result.
 * @param {(evaluation: Map<GenesysSymbol, number>) => boolean} criteria - A function that analyzes a
 *      permutation and determines if it meets a specific criteria.
 * @returns {number} The chance (as a ratio) of a dice pool to meet the provided criteria.
 */
function calculateChanceOf(dicePool, extraSymbols, criteria) {
	const totalPermutations = calculateTotalPermutations(dicePool);

	// If there is only 1 permutation then there are no dice on the pool. Simply evaluate any
	// extra symbols.
	if (totalPermutations === 1) {
		const evaluation = evaluateSymbols(new Map(), extraSymbols);
		return criteria(evaluation) ? 1 : 0;
	}

	const permutations = Permutations.forPool(dicePool);
	let meetCriteria = 0;

	for (const [permutation, count] of Object.entries(permutations)) {
		const symbols = getAndGroupSymbols(permutation);
		const evaluation = evaluateSymbols(symbols, extraSymbols);

		if (criteria(evaluation)) {
			meetCriteria += count;
		}
	}

	return meetCriteria / totalPermutations;
}

/**
 * This object is a cache of all the permutations calculated for mixed dice pools.
 * @type Record<string, number>
 */
const cacheForPool = {};

/**
 * This function proccessed the input and relays the data to the functions that calculate the chance of
 * meeting the specified criteria.
 * @param {Record<string, number>} dicePool - A pool of dice with their types and amount.
 * @param {Record<string, number>} extraSymbols - A collection of extra symbols to add to the result.
 * @param {string} criteriaType - The type of criteria to use when calculating the chance of achieving it.
 * @returns {Promise<number>} The chance (as a ratio) of a dice pool to meet the specified criteria.
 */
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars -- This is used by the Dice Prompt.
async function calculateChanceForDicePool({ dicePool, extraSymbols, criteriaType }) {
	const processedDicePool = Object.entries(dicePool ?? {}).reduce((accum, [denomination, amount]) => {
		const targetDice = Dice[denomination];
		const targetDiceAmount = parseInt(amount, 10);

		if (targetDice && targetDiceAmount > 0) {
			accum.set(targetDice, targetDiceAmount);
		}
		return accum;
	}, new Map());
	const dicePoolAsString = constructKeyFromMixedPool(processedDicePool);

	const processedExtraSymbols = Object.entries(extraSymbols ?? {}).reduce((accum, [denomination, amount]) => {
		const targetSymbol = Symbols[denomination];
		const targetSymbolAmount = parseInt(amount, 10);

		if (targetSymbol && targetSymbolAmount > 0) {
			accum.set(targetSymbol, targetSymbolAmount);
		}
		return accum;
	}, new Map());
	const extraSymbolsAsString = constructKeyFromMixedPool(processedExtraSymbols);

	const chosenCriteria = Criteria[criteriaType] ? criteriaType : 'SUCCESS';
	const requestKey = `${dicePoolAsString}|${extraSymbolsAsString}|${chosenCriteria}`;

	if (cacheForPool[requestKey]) {
		return cacheForPool[requestKey];
	}

	const chanceResult = calculateChanceOf(processedDicePool, processedExtraSymbols, Criteria[chosenCriteria]);
	cacheForPool[requestKey] = chanceResult;
	return chanceResult;
}
