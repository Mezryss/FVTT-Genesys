/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file TextEditor enrichment methods
 */
import { GenesysDice } from '@/dice';
import { GenesysPoolModifications, PoolModGlyphPattern } from '@/dice/types/GenesysPoolModifications';

const DICE_COLOR_TO_GLYPH = Object.fromEntries(
	Object.values(GenesysDice).map((die) => {
		return [die.COLOR, die.GLYPH];
	}),
);

export function register() {
	/**
	 * Enricher to easily add Genesys dice into the document.
	 *
	 * The string accepts any of the following characters, ignoring case sensitivity.
	 *    Ability Die => normal: A, color: G
	 *    Proficiency Die => normal: P, color: Y
	 *    Boost Die => normal: B, color: B
	 *    Difficulty Die => normal: D or I, color: P
	 *    Challenge Die => normal: C, color: R
	 *    Setback Die => normal: S, color: K
	 */
	CONFIG.TextEditor.enrichers.push({
		pattern: /@dic?e\[(col(or)?s?,(?<colors>[GYBPRK]+)|(?<dice>[APBDICS]+))]/gim,
		enricher: async (match, _) => {
			let dice = match.groups?.['dice']?.toUpperCase().split('');

			const colors = match.groups?.['colors']?.toUpperCase().split('');
			if (colors) {
				dice = colors.map((c) => DICE_COLOR_TO_GLYPH[c] ?? '');
			}

			if (!dice || dice.length === 0) {
				return null;
			}

			const container = document.createElement('span');
			container.className = 'font-genesys-symbols';

			for (let die of dice) {
				// Account for both possible annotations for difficulty dice.
				if (die === 'I') {
					die = 'D';
				}

				const newI = document.createElement('i');
				newI.className = `die die-${die}`;
				newI.innerText = die;

				container.appendChild(newI);
			}

			return container;
		},
	});

	/**
	 * Enricher to easily add Genesys symbols into the document.
	 */
	CONFIG.TextEditor.enrichers.push({
		pattern: /@sym(bols?)?\[(?<symbols>[asthfd123]+)]/gim,
		enricher: async (match, _) => {
			const newSpan = document.createElement('span');
			newSpan.className = `font-genesys-symbols nolig ${CONFIG.genesys.settings.useMagicalGirlSymbols ? 'mg' : ''}`;
			newSpan.innerText = match.groups?.['symbols']?.toLowerCase() ?? '';

			return newSpan;
		},
	});

	/**
	 * Enricher to add opposed skill check links in the document.
	 */
	CONFIG.TextEditor.enrichers.push({
		pattern: /@(skill-)?check\[(?<skill1>[^|\]]+?)\|(?<skill2>[^|\]]+?)]/gim,
		enricher: async (match, _) => {
			const skill1 = match.groups?.['skill1'];
			const skill2 = match.groups?.['skill2'];
			if (!skill1 || !skill2) {
				return null;
			}

			const container = document.createElement('a');
			container.style.fontWeight = 'bold';

			container.innerHTML =
				'<i class="far fa-dice-d10"></i> ' +
				game.i18n.format('Genesys.Enrichers.Opposed', {
					skill1: skill1,
					skill2: skill2,
				});

			return container;
		},
	});

	/**
	 * Enricher to add skill check links in the document.
	 */
	CONFIG.TextEditor.enrichers.push({
		pattern: /@(skill-)?check\[(?<skill>[^,\]|]+?)(,(?<difficulty>\d+)(\^(?<upgrades>\d+))?)?]/gim,
		enricher: async (match, _) => {
			const skill = match.groups?.['skill'];
			if (!skill) {
				return null;
			}

			let difficulty = parseInt(match.groups?.['difficulty'] ?? '2', 10);
			const upgrades = Math.min(parseInt(match.groups?.['upgrades'] ?? '0', 10), difficulty);

			let difficultyName: string;
			switch (difficulty) {
				case 0:
					difficultyName = 'Simple';
					break;
				case 1:
					difficultyName = 'Easy';
					break;
				case 2:
					difficultyName = 'Average';
					break;
				case 3:
					difficultyName = 'Hard';
					break;
				case 4:
					difficultyName = 'Daunting';
					break;
				case 5:
					difficultyName = 'Formidable';
					break;
				default:
					difficultyName = 'Impossible';
					difficulty = 5;
			}
			difficultyName = game.i18n.localize(`Genesys.Difficulty.${difficultyName}`);

			const difficultyIcons = '<span class="die die-C">C</span>'.repeat(upgrades) + '<span class="die die-D">D</span>'.repeat(difficulty - upgrades);

			const container = document.createElement('a');
			container.style.fontWeight = 'bold';
			container.dataset.skillCheck = skill;
			container.dataset.difficulty = 'C'.repeat(upgrades) + 'D'.repeat(difficulty - upgrades);

			container.innerHTML =
				'<i class="far fa-dice-d10"></i> ' +
				game.i18n.format('Genesys.Enrichers.Difficulty', {
					difficulty: difficultyName,
					symbols: difficultyIcons || '—',
					skill,
				});

			return container;
		},
	});

	/**
	 * Enricher to add pool modifications icons into a document.
	 */
	CONFIG.TextEditor.enrichers.push({
		pattern: new RegExp(`@pool(-mod(ifications?)?)?\\[(?<mods>${PoolModGlyphPattern.source}+)]`, 'gim'),
		enricher: async (match, _) => {
			const mods: string[] = match.groups?.['mods']?.match(PoolModGlyphPattern) ?? [];

			const container = document.createElement('span');
			container.className = 'font-genesys-symbols pool-modifications';

			for (const mod of mods) {
				const newIDie = document.createElement('i');
				newIDie.className = GenesysPoolModifications[mod].icon.baseType === 'dice' ? `die die-${GenesysPoolModifications[mod].icon.baseName}` : 'symbol';
				newIDie.innerText = GenesysPoolModifications[mod].icon.baseGlyph;

				const newIOperator = document.createElement('i');
				newIOperator.className = `fas ${GenesysPoolModifications[mod].icon.operator}`;

				container.appendChild(newIDie);
				container.appendChild(newIOperator);
			}

			return container;
		},
	});
}
