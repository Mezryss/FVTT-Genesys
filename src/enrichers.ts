/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file TextEditor enrichment methods
 */

const DICE_COLOR_TO_SYMBOL: Record<string, string> = {
	G: 'A', // Ability
	Y: 'P', // Proficiency
	B: 'B', // Boost
	P: 'D', // Difficulty
	R: 'C', // Challenge
	K: 'S', // Setback
};

export function register() {
	CONFIG.TextEditor.enrichers = [
		...CONFIG.TextEditor.enrichers,

		/**
		 * Enricher to easily add Genesys dice into the document.
		 *
		 * Dice string accept any of the following characters (case-insensitive):
		 *  A: Ability Die
		 *  P: Proficiency Die
		 *  B: Boost Die
		 *  D or I: Difficulty Die
		 *  C: Challenge Die
		 *  S: Setback Die
		 */
		{
			pattern: /@dic?e\[(col(or)?s?,(?<colors>[GYBPRK]+)|(?<dice>[APBDICS]+))]/gim,
			enricher: async (match, _) => {
				const container = document.createElement('span');
				container.className = 'font-genesys-symbols';

				const colors = match.groups?.['colors']?.toUpperCase();
				let dice = match.groups?.['dice']?.toUpperCase();
				if (!colors && !dice) {
					return null;
				}

				if (colors) {
					dice = colors
						.split('')
						.map((c) => DICE_COLOR_TO_SYMBOL[c] ?? '')
						.join('');
				}

				// Past this point it's safe to assume dice exists.
				dice = dice!;

				for (let die of dice.split('')) {
					// Account for both possible annotations for difficulty dice.
					if (die === 'I') {
						die = 'D';
					}

					const i = document.createElement('i');
					i.className = `die die-${die}`;
					i.innerText = die;

					container.appendChild(i);
				}

				return container;
			},
		},

		/**
		 * Enricher to easily add Genesys symbols into the document.
		 */
		{
			pattern: /@sym(bols?)?\[(?<symbols>\w+)]/gim,
			enricher: async (match, _) => {
				const span = document.createElement('span');
				span.className = 'font-genesys-symbols nolig';

				span.innerText = match.groups?.['symbols']?.toLowerCase() ?? '';

				return span;
			},
		},

		/**
		 * Enricher to add skill check links in the document.
		 */
		{
			pattern: /@skill-check\[(?<skill>.+),(?<difficulty>\d)]/gim,
			enricher: async (match, _) => {
				const skill = match.groups?.['skill'];
				const difficultyString = <string | undefined>match.groups?.['difficulty'];
				if (!skill) {
					return null;
				}

				const difficulty = parseInt(difficultyString ?? '2');
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
					default:
						difficultyName = 'Impossible';
				}

				const container = document.createElement('a');
				container.style.fontWeight = 'bold';
				container.dataset.skillCheck = skill;
				container.dataset.difficulty = difficulty.toString();

				container.innerHTML =
					'<i class="far fa-dice-d10"></i> ' +
					game.i18n.format('Genesys.Enrichers.Difficulty', {
						difficulty: difficultyName,
						symbols: `<span class="die die-D">${new Array(difficulty).fill('D').join('')}</span>`,
						skill,
					});

				return container;
			},
		},
	];
}
