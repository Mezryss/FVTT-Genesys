import GenesysTokenDocument from '@/token/GenesysTokenDocument';

export function register() {
	CONFIG.Token.documentClass = GenesysTokenDocument;
}
