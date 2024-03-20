import { NAMESPACE } from '@/settings';
import { KEY_MIGRATION_VERSION } from '@/settings/alpha';
import { migrate_UseUuidForVehicles } from '@/migrations/1-use-uuid-for-vehicle';
import { migrate_ActorOnlyOnceInCrew } from '@/migrations/2-actors-once-in-vehicle';

export const enum MigrationStatus {
	SUCCESS,
	FAILURE,
}

const migrationScripts: Array<(migrationId: number) => Promise<MigrationStatus>> = [migrate_UseUuidForVehicles, migrate_ActorOnlyOnceInCrew];

export async function performMigrations(lastAlpha: string) {
	const totalMigrationScripts = migrationScripts.length;
	if (lastAlpha === '0.0.0') {
		await game.settings.set(NAMESPACE, KEY_MIGRATION_VERSION, totalMigrationScripts);
		migrationScripts.length = 0;
		return;
	}

	const currentMigrationVersion = game.settings.get<number>(NAMESPACE, KEY_MIGRATION_VERSION) ?? 0;
	if (currentMigrationVersion === totalMigrationScripts) {
		migrationScripts.length = 0;
		return;
	}

	const isGmHub = game.users.activeGM?.isSelf ?? (game.user.isGM && game.users.filter((user) => user.isGM && user.active).every((candidate) => candidate.id >= game.user.id));
	if (!isGmHub) {
		ui.notifications.error('Genesys.Migration.MustPerformMigration', { localize: true, permanent: true });
		return;
	}

	let lastMigrationRun = currentMigrationVersion;
	ui.notifications.warn(game.i18n.format('Genesys.Migration.StartingMigration', { amount: totalMigrationScripts - lastMigrationRun }), { permanent: true });

	for (; lastMigrationRun < totalMigrationScripts; lastMigrationRun++) {
		const migrationId = lastMigrationRun + 1;
		ui.notifications.warn(game.i18n.format('Genesys.Migration.StartingScriptMigration', { id: migrationId }), { permanent: true });

		let migrationScriptResponse: MigrationStatus;
		try {
			migrationScriptResponse = await migrationScripts[lastMigrationRun](migrationId);
		} catch (error) {
			migrationScriptResponse = MigrationStatus.FAILURE;
			console.error(error);
		}

		if (migrationScriptResponse === MigrationStatus.FAILURE) {
			ui.notifications.error(game.i18n.format('Genesys.Migration.StoppedScriptMigration', { id: migrationId }), { permanent: true });
			break;
		}

		ui.notifications.warn(game.i18n.format('Genesys.Migration.CompletedScriptMigration', { id: migrationId }), { permanent: true });
	}

	const runAmountMigrations = lastMigrationRun - currentMigrationVersion;
	if (runAmountMigrations > 0) {
		await game.settings.set(NAMESPACE, KEY_MIGRATION_VERSION, lastMigrationRun);
		ui.notifications.info('Genesys.Migration.MultipleSuccessfulMigration', { localize: true, permanent: true });
	}

	const remainingAmountMigrations = totalMigrationScripts - lastMigrationRun;
	if (remainingAmountMigrations > 0) {
		ui.notifications.error(game.i18n.format('Genesys.Migration.StoppedMigration', { amount: remainingAmountMigrations }), { permanent: true });
	} else {
		ui.notifications.info('Genesys.Migration.CompletedMigration', { localize: true, permanent: true });
	}

	migrationScripts.length = 0;
}
