/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file System Entry Point
 */

import { register as registerConfig, ready as readyConfigs } from '@/config';
import { register as registerCombat } from '@/combat';
import { register as registerSidebars } from '@/sidebar';
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
import GenesysCompendium from '@/sidebar/GenesysCompendium';
import { performMigrations } from '@/migrations/MigrationHelper';

import './scss/index.scss';

async function doAlphaNotice(lastAlpha: string) {
	if (!game.user.isGM) {
		return;
	}

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
        <li><a href="https://github.com/Mezryss/FVTT-Genesys/pull/145">PR #145</a>: FEATURE - Additional enhacenments and fixes to vehicle's sheets</li>
        <li><a href="https://github.com/Mezryss/FVTT-Genesys/pull/149">PR #149</a>: BUGFIX - Fix initiative message when rolling with symbols</li>
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
	// System Documents
	registerActors();
	registerEffects();
	registerItems();

	// Misc. modules with one-time registrations
	registerCombat();
	registerSidebars();
	registerEnrichers();
	registerFonts();
	registerDice();
	registerHandlebarsHelpers();
	registerSettings();
	registerConfig();
});

Hooks.once('ready', async () => {
	// Get the last-acknowledged Alpha version notice.
	const lastAlpha = game.settings.get<string>(SETTINGS_NAMESPACE, KEY_ALPHA_VERSION) ?? '0.0.0';

	await doAlphaNotice(lastAlpha);
	readyConfigs();

	await performMigrations(lastAlpha);

	registerStoryPointTracker();
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

Hooks.on('renderChatLog', (_sidebar: SidebarTab, html: JQuery<HTMLElement>, _data: object) => {
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

// Currently there is no way to specify the class for rendering a compendium collection application since it is
// hardcoded. However, we can cheat the system into using our own implementation by manually instanciating it and
// patching the compendium. Also, because we want to apply this even to newly created compendia we run this on every
// compendium directory bar rendering (it's triggered right after a new compendium is created). We went with this way
// of cheating the system in order to maintain compatibility with FVTTv10+ and to capture newly created compendia.
// For context, we want to perform this patch to allow sheets with drop areas to properly highlight when something is
// being dragged from a compendium.
const COMPENDIUM_PATCHING = {
	PATCHED: new Set<string>(),
	TYPES: ['Actor', 'Item'],
};
Hooks.on('renderCompendiumDirectory', (_sidebar: SidebarTab, _html: JQuery<HTMLElement>, _data: object) => {
	for (const pack of game.packs.values()) {
		if (!COMPENDIUM_PATCHING.PATCHED.has(pack.metadata.id)) {
			COMPENDIUM_PATCHING.PATCHED.add(pack.metadata.id);
			if (COMPENDIUM_PATCHING.TYPES.includes(pack.metadata.type)) {
				pack.apps.shift();
				pack.apps.push(new GenesysCompendium(pack));
			}
		}
	}
});
