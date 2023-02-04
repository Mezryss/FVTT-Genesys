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

const FONT_SCALE = {
	db: 1.5, // Boost Die
	da: 0.8, // Ability Die
	dp: 1.2, // Proficiency Die
	ds: 1.25, // Setback Die
	di: 0.8, // Difficulty Die
	dc: 1.2, // Challenge Die
};

const TYPES = {
	Boost: { denom: 'db', labels: BoostDie.FACES },
	Ability: { denom: 'da', labels: AbilityDie.FACES },
	Proficiency: { denom: 'dp', labels: ProficiencyDie.FACES },
	Setback: { denom: 'ds', labels: SetbackDie.FACES },
	Difficulty: { denom: 'di', labels: DifficultyDie.FACES },
	Challenge: { denom: 'dc', labels: ChallengeDie.FACES },
};

function makeStandardColorset(name: string, color: string, foreground?: string, outline?: string): ColorSet {
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

function makeCustomizableColorSet(name: string): ColorSet {
	return {
		name: `genesys-cust-${name.toLowerCase()}`,
		description: `Genesys.DiceColors.${name}`,
		category: 'Genesys.DiceCat.Custom',
		font: 'Genesys Symbols',
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

	// Dice Color Sets
	dice3d.addColorset(makeStandardColorset('Boost', '#72cddc'), 'default');
	dice3d.addColorset(makeStandardColorset('Ability', '#41ad49'), 'default');
	dice3d.addColorset(makeStandardColorset('Proficiency', '#ffe800'), 'default');
	dice3d.addColorset(makeStandardColorset('Setback', '#000000', '#ffffff'), 'default');
	dice3d.addColorset(makeStandardColorset('Difficulty', '#6c2a84', '#ffffff', '#000000'), 'default');
	dice3d.addColorset(makeStandardColorset('Challenge', '#7d1821', '#ffffff', '#000000'), 'default');

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

	console.log('Genesys | Dice So Nice! initialization complete.');
});
