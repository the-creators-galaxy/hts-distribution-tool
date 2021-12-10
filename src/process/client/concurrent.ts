import type { CalaxyClient } from './client';
import { NodeHealth } from './node-health';
/**
 * Orchestrates multiple concurrent requests spanning multiple
 * work items and Hedera Nodes.  Provides services to monitor
 * node throttling and subsequent back-off of concurrent requests
 * and identification and avoidance of failing hedera nodes.
 *
 * @param clients An array of `CalaxyClient` connections to
 * Hedera Nodes.  Each client should connect to one node interface.
 * @param inputs An array of inputs or objects to process.
 * These will be passed one-at-a-time to a `taskRunner` invocation.
 * @param taskRunner Processes a request in the context of one input
 * and one client.  If the method returns `Healthy` or `Throttled`,
 * the orchestrator will assume input was processed successfully,
 * if `Unhealthy` or if it returns an exception/promise rejection,
 * the orchestrator will assume input was not processed and will
 * re-queue for processing paired with a different client instance.
 */
export async function runClientsConcurrently<T>(
	clients: CalaxyClient[],
	inputs: T[],
	taskRunner: (client: CalaxyClient, input: T) => Promise<NodeHealth>,
): Promise<void> {
	if (clients.length === 0) {
		throw new Error('No Network Clients available to process transactions.');
	}
	const maxTasksPerClient = Math.min(Math.max(1, 500 / clients.length), 50);
	inputs = inputs.slice().reverse();
	// It is possible for all the nodes at some point become unstable
	// enough the dequeue from the active list, if this happens we
	// restart with the full list of clients we received in the beginning.
	while (inputs.length > 0) {
		await Promise.all(clients.map((client) => runClientTaskLoop(client)));
	}
	/**
	 * Orchestrates a concurrent processing loop for the context of one
	 * `CalaxyClient` instance.  The loop will add concurrent tasks up
	 * and to the point processes start returning `Throttled` if any one
	 * process returns `Unhealthy` the loop will shutdown and refrain
	 * from queueing any more processing for this particular node.
	 * It be started again unless all nodes fail and the whole process
	 * re-starts in an attempt to finish any unprocessed inputs.
	 *
	 * @param client Single `CalaxyClient` instance connected to a Hedera Node
	 * @returns A promise that resolves when all inputs have been processed
	 * or the connected node becomes `Unhealthy`.
	 */
	function runClientTaskLoop(client): Promise<void> {
		const tasks = new Set<Promise<void>>();
		let currentlyThrottled = false;
		let flagedAsUnhealthy = false;
		let resolveTaskLoopPromise: () => void;
		return new Promise<void>((resolve) => {
			if (inputs.length > 0) {
				resolveTaskLoopPromise = resolve;
				runOneTask();
			} else {
				resolve();
			}
		});
		/**
		 * Helper function that invokes the task runner for a
		 * given input in the enclosing context of a single client.
		 * Helps manage the list of concurrent invocation tasks and
		 * removes itself from the list when completed.
		 * Updates the healthy/throttled/unhealthy tracking flags
		 * of the enclosing method.
		 */
		function runOneTask() {
			const input = inputs.pop();
			const task = taskRunner(client, input)
				.then(
					(nodeHealth) => {
						switch (nodeHealth) {
							case NodeHealth.Healthy:
								currentlyThrottled = false;
								break;
							case NodeHealth.Throttled:
								currentlyThrottled = true;
								break;
							case NodeHealth.Unhealthy:
								inputs.push(input);
								flagedAsUnhealthy = true;
								break;
						}
					},
					(_) => {
						inputs.push(input);
						flagedAsUnhealthy = true;
					},
				)
				.then((_) => onTaskCompleted(task));
			tasks.add(task);
		}
		/**
		 * Helper function that executes after each task
		 * completion in the context of a single client.
		 * It examines health status of the latest requests
		 * and decides if the method should add more tasks,
		 * continue with the same number of concurrent tasks
		 * or shutdown the thread loop.  It is also responsible
		 * for identifying when all inputs are consumed and
		 * signaling the enclosing method to resolve the promise
		 * indicating completion of the entire task loop.
		 *
		 * @param task the task (Promise<NodeHealth>) that
		 * just completed.
		 */
		function onTaskCompleted(task: Promise<void>) {
			tasks.delete(task);
			if (flagedAsUnhealthy) {
				if (tasks.size === 0) {
					// Try to restart the loop on the hedera node with
					// one task if there are still a number of tasks
					// remaining to process. BUT move the restart to
					// the end of the time slice in case we have a
					// healthy node that can pick up this recently
					// failed task instead.  If there are not many tasks
					// left, just let this thread die.  If all the threads
					// die and there are still tasks, they will all be
					// restarted because of the while loop above.
					setTimeout(function () {
						if (inputs.length > clients.length) {
							flagedAsUnhealthy = false;
							currentlyThrottled = false;
							runOneTask();
						} else {
							resolveTaskLoopPromise();
						}
					}, 10);
				}
			} else if (inputs.length > 0) {
				if (currentlyThrottled) {
					if (tasks.size === 0) {
						runOneTask();
					}
				} else if (inputs.length > 1 && tasks.size < maxTasksPerClient) {
					runOneTask();
					runOneTask();
				} else {
					runOneTask();
				}
			} else if (tasks.size === 0) {
				resolveTaskLoopPromise();
			}
		}
	}
}
