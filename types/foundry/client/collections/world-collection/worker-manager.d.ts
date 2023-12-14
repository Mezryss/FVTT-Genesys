/**
 * The Collection of Web Workers which exist within the active World.
 * This Collection is accessible within the Game object as game.workers.
 */
declare class WorkerManager extends Map<string, AsyncWorker> {
	createWorker(name: string, config?: AsyncWorkerOptions): AsyncWorker;
}
