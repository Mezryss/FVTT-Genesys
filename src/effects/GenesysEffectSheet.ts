/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file ActiveEffect configuration sheet
 */

import './GenesysEffectSheet.scss';

export default class GenesysEffectSheet extends ActiveEffectConfig {
	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			classes: ['genesys', 'sheet'],
			width: 500,
			height: 400,
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'description',
				},
			],
		};
	}

	override get template(): string {
		return 'systems/genesys/templates/sheets/effect-config.hbs';
	}

	override activateListeners(html: JQuery) {
		super.activateListeners(html);

		if (this.isEditable) {
			// Foundry v10 and v11 bind this functionality differently so instead we override that behavior with our own.
			html.find('img[data-edit]').off('click');
			html.find('img[data-edit]').on('click', this._onEditImage.bind(this));
		}
	}

	protected async _onEditImage(event: Event) {
		const fp = new FilePicker({
			type: 'image',
			current: this.object.icon,
			callback: async (path: string) => {
				(<HTMLImageElement>event.currentTarget).src = path;
				await this._onSubmit(event, { preventClose: true });
			},
			top: (this.position.top ?? 0) + 40,
			left: (this.position.left ?? 0) + 10,
		});

		return await fp.browse();
	}
}
