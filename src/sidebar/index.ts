import GenesysActorDirectory from '@/sidebar/GenesysActorDirectory';
import GenesysItemDirectory from '@/sidebar/GenesysItemDirectory';

export function register() {
	CONFIG.ui.actors = GenesysActorDirectory;
	CONFIG.ui.items = GenesysItemDirectory;
}
