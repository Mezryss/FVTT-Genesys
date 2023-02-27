export {};

declare global {
	namespace ProseMirror {
		class Schema {}

		class Plugin {}

		class ProseMirrorPlugin {
			schema: Schema;
			static build(schema: Schema, options: object): Plugin;
		}

		class ProseMirrorMenu extends ProseMirrorPlugin {}
		class ProseMirrorKeyMaps extends ProseMirrorPlugin {}

		const defaultSchema: Schema;
		const dom: {
			parseHTMLString(htmlString: string, schema?: Schema): Node;
			serializeString: (doc: Node, { schema, spaces }?: { schema?: Schema; spaces?: string | number }) => string;
		};
	}
}
