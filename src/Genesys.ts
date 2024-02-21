/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file System Entry Point
 */

import { register as registerConfig, ready as readyConfigs } from '@/config';
import { register as registerCombat } from '@/combat';
import { register as registerDice } from '@/dice';
import { register as registerEnrichers } from '@/enrichers';
import { register as registerFonts } from '@/fonts';
import { register as registerHandlebarsHelpers } from '@/handlebars';
import { NAMESPACE as SETTINGS_NAMESPACE, register as registerSettings } from '@/settings';
import { KEY_ALPHA_VERSION } from '@/settings/alpha';

import { register as registerStoryPointTracker } from '@/app/StoryPointTracker';
import { register as registerActors, AdversaryTypes } from '@/actor';
import { register as registerEffects } from '@/effects';
import { register as registerItems, CharacterCreationItemTypes, EquipmentItemTypes } from '@/item';
import { register as registerVehicles } from '@/actor/data/VehicleDataModel';
import DicePrompt, { registerWorker } from '@/app/DicePrompt';

import GenesysActor from '@/actor/GenesysActor';
import { migrate_UseUuidForVehicles } from '@/migrations/1-use-uuid-for-vehicle';

import './scss/index.scss';

async function doAlphaNotice() {
	if (!game.user.isGM) {
		return;
	}

	// Get the last-acknowledged Alpha version notice.
	const lastAlpha = game.settings.get(SETTINGS_NAMESPACE, KEY_ALPHA_VERSION) as string;

	const [lastMajor, lastMinor, lastRevision] = lastAlpha.split('.').map((v) => parseInt(v));
	const [currMajor, currMinor, currRevision] = game.system.version.split('.').map((v) => parseInt(v));

	if (lastMajor >= currMajor && lastMinor >= currMinor && lastRevision >= currRevision) {
		return;
	}

	const enrichedMessage = await TextEditor.enrichHTML(
		/*html*/ `
	<h3 style="font-family: 'Bebas Neue', sans-serif">Genesys Alpha ${game.system.version}</h3>
	<p>
		Hello! Thank you for giving the Genesys system a try! Please note that this system is currently in an alpha state; it is ready for some early playtesting and experimentation, but there are many features that are yet unimplemented and may be bugs!
	</p>
	<div style="text-align: center">@symbol[satfhd]</div>
	<h4 style="font-family: 'Bebas Neue', sans-serif">Bug Fixes & Updates</h4>
	<ul style="margin-top: 0">
        <li><a href="https://github.com/Mezryss/FVTT-Genesys/pull/136">PR #136</a> & <a href="https://github.com/Mezryss/FVTT-Genesys/pull/144">PR #144</a>: Bugfix - Minion skills and Combat tabs reflect changes immediately</li>
        <li><a href="https://github.com/Mezryss/FVTT-Genesys/pull/139">PR #139</a>: Localization - Corrections for the french translation (@ZolOnTheNet)</li>
        <li><a href="https://github.com/Mezryss/FVTT-Genesys/pull/143">PR #143</a>: Styling - Pad the motivation and notes editors</li>
	</ul>
	<h4 style="font-family: 'Bebas Neue', sans-serif">Roadmap</h4>
	<ul style="margin-top: 0">
        <li><strong>0.3:</strong> CRB: Attachments optional rule</li>
        <li><strong>0.4:</strong> CRB: Magic optional rule</li>
        <li><strong>1.0:</strong> Core Rulebook Compatibility</li>
		<li><strong>1.1:</strong> Expanded Player's Guide Compatibility</li>
		<li><strong>1.2:</strong> First-Party Setting Books Compatibility</li>
		<li><strong>1.3:</strong> Community Feature Focus</li>
		<li><strong>1.4:</strong> Automation Focus</li>
	</ul>
	<div style="text-align: center">@dice[apbdcs]</div>
	<h4 style="font-family: 'Bebas Neue', sans-serif">Useful Links</h4>
	<ul style="margin-top: 0">
		<li><a href="https://github.com/Mezryss/FVTT-Genesys/wiki">Project Wiki</a></li>
		<li><a href="https://github.com/Mezryss/FVTT-Genesys">Project Source Code</a></li>
		<li><a href="https://github.com/Mezryss/FVTT-Genesys/discussions">Discuss The System</a></li>
		<li><a href="https://github.com/Mezryss/FVTT-Genesys/issues">Report Bugs &amp; Suggest Features</a></li>
		<li><a href="https://github.com/Mezryss/FVTT-Genesys/blob/main/LICENSE">Licensed under the MIT License</a></li>
	</ul>
	`,
		{ async: true },
	);

	await ChatMessage.create({
		user: game.user.id,
		content: enrichedMessage,
		type: CONST.CHAT_MESSAGE_TYPES.OTHER,
	});

	await game.settings.set(SETTINGS_NAMESPACE, KEY_ALPHA_VERSION, game.system.version);
}

Hooks.once('init', async () => {
	console.debug('Genesys | Initializing...');

	// System Documents
	registerActors();
	registerEffects();
	registerItems();

	// Misc. modules with one-time registrations
	registerCombat();
	registerEnrichers();
	registerFonts();
	registerDice();
	registerHandlebarsHelpers();
	registerSettings();
	registerConfig();

	console.debug('Genesys | Initialization Complete.');
});

Hooks.once('ready', async () => {
	registerStoryPointTracker();
	await doAlphaNotice();

	readyConfigs();

	await migrate_UseUuidForVehicles();

	registerVehicles();
	registerWorker();
});

function constructOptGroup(select: HTMLSelectElement, groupLabel: string, optValues?: string[]): HTMLOptGroupElement {
	const options = select.querySelectorAll<HTMLOptionElement>(':scope > option');
	const optgroup = document.createElement('optgroup');

	optgroup.label = groupLabel;
	optgroup.append(...Array.from(options).filter((option) => !optValues || optValues.includes(option.value)));

	return optgroup;
}

Hooks.on('renderDialog', (_dialog: Dialog, html: JQuery<HTMLElement>, _data: object) => {
	const container = html[0];

	// Cheks if it's the item creation dialog and categorize the options from the dropdown
	if (container.classList.contains('dialog-item-create')) {
		const select = container.querySelector<HTMLSelectElement>('select[name=type]');

		if (select) {
			select.append(
				constructOptGroup(select, game.i18n.localize('Genesys.DialogGroups.Item.CharacterCreation'), CharacterCreationItemTypes),
				constructOptGroup(select, game.i18n.localize('Genesys.DialogGroups.Item.Equipment'), EquipmentItemTypes),
				constructOptGroup(select, game.i18n.localize('Genesys.DialogGroups.Item.Other')),
			);
			select.querySelector('option')!.selected = true;
		}

		// Cheks if it's the actor creation dialog and categorize the options from the dropdown
	} else if (container.classList.contains('dialog-actor-create')) {
		const select = container.querySelector<HTMLSelectElement>('select[name=type]');

		if (select) {
			select.append(constructOptGroup(select, game.i18n.localize('Genesys.DialogGroups.Actor.Adversary'), AdversaryTypes), constructOptGroup(select, game.i18n.localize('Genesys.DialogGroups.Actor.Other')));
			select.querySelector('option')!.selected = true;
		}
	}
});

Hooks.on('renderSidebarTab', (sidebar: SidebarTab, html: JQuery<HTMLElement>, _data: object) => {
	if (sidebar.tabName !== 'chat') {
		return;
	}

	const diceIcon = html.find('#chat-controls > .chat-control-icon');
	diceIcon.on('click', async (_event) => {
		const controlledTokens = canvas.tokens.controlled;

		let targetActor;
		if (controlledTokens.length > 1) {
			ui.notifications.error(game.i18n.localize('Genesys.Notifications.SelectNoneOrOneTokenForAction'));
			return;
		} else if (controlledTokens.length === 1) {
			if (controlledTokens[0].actor?.type === 'vehicle') {
				ui.notifications.error(game.i18n.localize('Genesys.Notifications.InvalidTokenTypeForAction'));
				return;
			} else {
				targetActor = (controlledTokens[0].actor ?? undefined) as GenesysActor | undefined;
			}
		}

		await DicePrompt.promptForRoll(targetActor, '');
	});
});
