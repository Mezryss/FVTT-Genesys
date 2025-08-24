/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Foundry application to track the current pools of story points.
 */

import { NAMESPACE as SETTINGS_NAMESPACE } from '@/settings';
import { KEY_STORY_POINTS, type StoryPointData } from '@/settings/storyPoints';
import { emit as socketEmit, SOCKET_NAME, SocketOperation, SocketPayload } from '@/socket';
import VueStoryPointTracker from '@/vue/apps/StoryPointTracker.vue';
import VueSheet from '@/vue/VueSheet';

export interface StoryPointTrackerContext {
	/**
	 * Number of Story Points available to players.
	 */
	playerPool: number;

	/**
	 * Number of Story Points available to the GM.
	 */
	gmPool: number;
}

/**
 * Singleton application used to track the current pools of Story Points.
 */
export default class StoryPointTracker extends VueSheet(Application) {
	static #instance?: StoryPointTracker;

	static get instance(): StoryPointTracker | undefined {
		return StoryPointTracker.#instance;
	}

	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			classes: ['genesys', 'story-point-tracker'],
			id: 'story-point-tracker',
			popOut: false,
			resizable: false,
			width: 'auto',
			preventSubmit: true,
		};
	}

	override async _renderInner(data: object, options: RenderOptions = {}) {
		return super._renderInner(data, {
			...options,
			classes: options.classes ?? ['genesys', 'story-point-tracker', ...(game.version.startsWith('13') ? ['move-to-left'] : [])],
		});
	}

	override get vueComponent() {
		return VueStoryPointTracker;
	}

	get storyPoints() {
		return <StoryPointData>game.settings.get(SETTINGS_NAMESPACE, KEY_STORY_POINTS);
	}

	override async getVueContext(): Promise<StoryPointTrackerContext> {
		const storyPoints = this.storyPoints;

		return {
			playerPool: storyPoints.player,
			gmPool: storyPoints.gm,
		};
	}

	constructor(options = {}) {
		if (StoryPointTracker.#instance) {
			throw new Error('Attempted to create multiple instances of the StoryPointTracker singleton.');
		}

		super(options);

		StoryPointTracker.#instance = this;
	}

	static forceRender() {
		StoryPointTracker.#instance?.render(true);
	}

	static async resetStoryPoints({ player, gm }: { player?: number; gm?: number } = {}) {
		// Players can only Spend story points, they cannot set them.
		if (!game.user.isGM) {
			return;
		}

		await game.settings.set(SETTINGS_NAMESPACE, KEY_STORY_POINTS, {
			player: player ?? game.users.filter((u) => !u.isGM && u.active).length,
			gm: gm ?? 1,
		});

		StoryPointTracker.forceRender();

		// Inform other connected clients to update the story point count.
		socketEmit(SocketOperation.UpdateStoryPointTracker);
	}

	/**
	 * Spends a Story Point for the current user.
	 */
	static async spendStoryPoint(targetPool: keyof StoryPointTrackerContext) {
		if (!StoryPointTracker.instance) {
			return;
		}

		const storyPoints = StoryPointTracker.instance.storyPoints;

		if ((targetPool === 'gmPool' && storyPoints.gm === 0) || (targetPool === 'playerPool' && storyPoints.player === 0)) {
			ui.notifications.warn(game.i18n.localize('Genesys.Notifications.NotEnoughStoryPoints'));
			return;
		}

		// Socket update
		if (game.user.isGM) {
			// 1. Update setting.
			await game.settings.set(SETTINGS_NAMESPACE, KEY_STORY_POINTS, {
				player: storyPoints.player + (targetPool === 'playerPool' ? -1 : 1),
				gm: storyPoints.gm + (targetPool === 'gmPool' ? -1 : 1),
			});

			// 2. Force local re-render
			StoryPointTracker.forceRender();

			// 3. Force players to re-render.
			socketEmit(SocketOperation.UpdateStoryPointTracker);
		} else if (targetPool === 'playerPool') {
			// Update other clients on story point spend.
			socketEmit(SocketOperation.PlayerSpendStoryPoint);
		} else {
			ui.notifications.error(game.i18n.localize('Genesys.Notifications.GenericError'));
			return;
		}

		// Add chat message
		const chatTemplate = await renderTemplate('systems/genesys/templates/chat/storypoint.hbs', { type: targetPool === 'gmPool' ? 'gm' : 'player' });
		await ChatMessage.create({
			user: game.user.id,
			speaker: {
				actor: game.user.character?.id,
			},
			content: chatTemplate,
			style: CONST.CHAT_MESSAGE_STYLES.OOC,
		});
	}
}

/**
 * Initialize the Story Point Tracker and establish a socket listener.
 */
export function register() {
	if (StoryPointTracker.instance) {
		return;
	}

	new StoryPointTracker();
	StoryPointTracker.forceRender();

	game.socket.on(SOCKET_NAME, async (payload: SocketPayload<any>) => {
		if (!StoryPointTracker.instance) {
			return;
		}

		switch (payload.operation) {
			/**
			 * Player has spent a story point.
			 */
			case SocketOperation.PlayerSpendStoryPoint:
				// Only GM clients should process the operation.
				if (!game.user.isGM) {
					return;
				}

				// 1. Update the story point settings.
				const storyPoints = StoryPointTracker.instance!.storyPoints;

				// Do nothing if there are no player points to actually spend.
				if (storyPoints.player === 0) {
					return;
				}

				await game.settings.set(SETTINGS_NAMESPACE, KEY_STORY_POINTS, {
					gm: storyPoints.gm + 1,
					player: storyPoints.player - 1,
				});

				// 2. Force re-render locally & tell other to re-render.
				StoryPointTracker.forceRender();
				socketEmit(SocketOperation.UpdateStoryPointTracker);

				break;

			/**
			 * Forcibly update the Story Point Tracker's values.
			 */
			case SocketOperation.UpdateStoryPointTracker:
				StoryPointTracker.forceRender();
				break;
		}
	});
}
