export {};

declare global {
	interface AsyncWorkerOptions {
		debug: boolean;
		loadPrimitives: boolean;
		scripts: string[];
	}

	class AsyncWorker extends Worker {
		constructor(name: string, config?: AsyncWorkerOptions);
		executeFunction(functionName: string, args: any[], transfer: any[]): Promise<unknown>;
	}
}
