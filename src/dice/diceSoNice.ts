/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Dice So Nice! Dice registration.
 */

import BoostDie from '@/dice/types/BoostDie';
import AbilityDie from '@/dice/types/AbilityDie';
import ProficiencyDie from '@/dice/types/ProficiencyDie';
import SetbackDie from '@/dice/types/SetbackDie';
import DifficultyDie from '@/dice/types/DifficultyDie';
import ChallengeDie from '@/dice/types/ChallengeDie';

export {};

/**
 * Font scale used for the standard die faces.
 */
const FONT_SCALE = {
	db: 1.5, // Boost Die
	da: 0.8, // Ability Die
	dp: 1.2, // Proficiency Die
	ds: 1.25, // Setback Die
	di: 0.8, // Difficulty Die
	dc: 1.2, // Challenge Die
};

/**
 * Font scale used for the magical girl die faces.
 */
const FONT_SCALE_MG = {
	db: 1.5, // Boost Die
	da: 0.7, // Ability Die
	dp: 1.0, // Proficiency Die
	ds: 1.5, // Setback Die
	di: 0.8, // Difficulty Die
	dc: 1.0, // Challenge Die
};

const TYPES = {
	Boost: { denom: 'db', labels: BoostDie.FACES },
	Ability: { denom: 'da', labels: AbilityDie.FACES },
	Proficiency: { denom: 'dp', labels: ProficiencyDie.FACES },
	Setback: { denom: 'ds', labels: SetbackDie.FACES },
	Difficulty: { denom: 'di', labels: DifficultyDie.FACES },
	Challenge: { denom: 'dc', labels: ChallengeDie.FACES },
};

function makeStandardColorSet(name: string, color: string, foreground?: string, outline?: string): ColorSet {
	return {
		name: `genesys-${name.toLowerCase()}`,
		description: `Genesys.DiceColors.${name}`,
		category: 'Genesys.DiceCat.Normal',
		foreground: foreground ?? '#000000',
		background: color,
		outline,
		edge: color,
		font: 'Genesys Symbols',
		fontScale: FONT_SCALE,
	};
}

function makeMagicalColorSet(name: string, color: string, foreground?: string, outline?: string): ColorSet {
	return {
		...makeStandardColorSet(name, color, foreground, outline),
		name: `genesys-mg-${name.toLowerCase()}`,
		category: 'Genesys.DiceCat.MagicalGirl',
		font: 'Magical Girl Symbols',
		fontScale: FONT_SCALE_MG,
	};
}

function makeCustomizableColorSet(name: string): ColorSet {
	return {
		name: `genesys-cust-${name.toLowerCase()}`,
		description: `Genesys.DiceColors.${name}`,
		category: 'Genesys.DiceCat.Custom',
		fontScale: FONT_SCALE,
	};
}

Hooks.once('diceSoNiceReady', (dice3d: Dice3d) => {
	console.log('Genesys | Dice So Nice! Detected, initializing dice...');

	dice3d.addSystem(
		{
			id: 'genesys',
			name: 'Genesys.System.Name',
		},
		'preferred',
	);

	dice3d.addSystem(
		{
			id: 'genesys-mg',
			name: 'Genesys.DiceCat.MagicalGirl',
		},
		'default',
	);

	// Standard System Dice
	dice3d.addColorset(makeStandardColorSet('Boost', '#72cddc'), 'default');
	dice3d.addColorset(makeStandardColorSet('Ability', '#41ad49'), 'default');
	dice3d.addColorset(makeStandardColorSet('Proficiency', '#ffe800'), 'default');
	dice3d.addColorset(makeStandardColorSet('Setback', '#000000', '#ffffff'), 'default');
	dice3d.addColorset(makeStandardColorSet('Difficulty', '#6c2a84', '#ffffff', '#000000'), 'default');
	dice3d.addColorset(makeStandardColorSet('Challenge', '#7d1821', '#ffffff', '#000000'), 'default');

	// Magical Girl System Dice
	dice3d.addColorset(makeMagicalColorSet('Boost', '#72cddc', '#000000', '#72cddc'), 'default');
	dice3d.addColorset(makeMagicalColorSet('Ability', '#41ad49', '#000000', '#41ad49'), 'default');
	dice3d.addColorset(makeMagicalColorSet('Proficiency', '#ffe800', '#000000', '#ffe800'), 'default');
	dice3d.addColorset(makeMagicalColorSet('Setback', '#000000', '#ffffff', '#000000'), 'default');
	dice3d.addColorset(makeMagicalColorSet('Difficulty', '#6c2a84', '#ffffff', '#000000'), 'default');
	dice3d.addColorset(makeMagicalColorSet('Challenge', '#7d1821', '#ffffff', '#000000'), 'default');

	// Customizable System Dice
	(<(keyof typeof TYPES)[]>['Boost', 'Ability', 'Proficiency', 'Setback', 'Difficulty', 'Challenge']).forEach((die) => {
		dice3d.addColorset(makeCustomizableColorSet(die), 'default');
		dice3d.addDicePreset({
			type: TYPES[die].denom,
			labels: TYPES[die].labels,
			system: 'standard',
			colorset: `genesys-cust-${die.toLowerCase()}`,
		});
	});

	// Set up default color sets for the Genesys dice.
	dice3d.addDicePreset({
		type: 'db',
		labels: BoostDie.FACES,
		system: 'genesys',
		colorset: 'genesys-boost',
	});
	dice3d.addDicePreset({
		type: 'da',
		labels: AbilityDie.FACES,
		system: 'genesys',
		colorset: 'genesys-ability',
	});
	dice3d.addDicePreset({
		type: 'dp',
		labels: ProficiencyDie.FACES,
		system: 'genesys',
		colorset: 'genesys-proficiency',
	});
	dice3d.addDicePreset({
		type: 'ds',
		labels: SetbackDie.FACES,
		system: 'genesys',
		colorset: 'genesys-setback',
	});
	dice3d.addDicePreset({
		type: 'di',
		labels: DifficultyDie.FACES,
		system: 'genesys',
		colorset: 'genesys-difficulty',
	});
	dice3d.addDicePreset({
		type: 'dc',
		labels: ChallengeDie.FACES,
		system: 'genesys',
		colorset: 'genesys-challenge',
	});

	// Set up default color sets for the Magical Girl dice.
	dice3d.addDicePreset({
		type: 'db',
		labels: BoostDie.FACES,
		system: 'genesys-mg',
		colorset: 'genesys-mg-boost',
	});
	dice3d.addDicePreset({
		type: 'da',
		labels: AbilityDie.FACES,
		system: 'genesys-mg',
		colorset: 'genesys-mg-ability',
	});
	dice3d.addDicePreset({
		type: 'dp',
		labels: ProficiencyDie.FACES,
		system: 'genesys-mg',
		colorset: 'genesys-mg-proficiency',
	});
	dice3d.addDicePreset({
		type: 'ds',
		labels: SetbackDie.FACES,
		system: 'genesys-mg',
		colorset: 'genesys-mg-setback',
	});
	dice3d.addDicePreset({
		type: 'di',
		labels: DifficultyDie.FACES,
		system: 'genesys-mg',
		colorset: 'genesys-mg-difficulty',
	});
	dice3d.addDicePreset({
		type: 'dc',
		labels: ChallengeDie.FACES,
		system: 'genesys-mg',
		colorset: 'genesys-mg-challenge',
	});

	console.log('Genesys | Dice So Nice! initialization complete.');
});
