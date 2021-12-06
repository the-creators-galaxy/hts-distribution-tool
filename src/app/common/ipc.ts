/**
 * Required by the typescript compiler for type safety.
 * The invocation method was attached to the user
 * interface process by the electron preload script at
 * `window.ipc.invoke`.  This is not used directly, user
 * interface components will utilize the module level
 * exported method below for invoking methods that
 * execute inside the nodejs process space.
 */
declare global {
	interface Window {
		ipc: {
			invoke: (method: string, ...args: any[]) => Promise<any>;
		};
	}
}
/**
 * Invokes a white-listed method that is registered in the nodejs
 * process space.  This includes methods that interact with the
 * native operating system and submitting transactions to the
 * hedera network via a gRPC connection.  These are operations
 * that typically can’t be run within the process space of the
 * user interface thread.
 *
 * @param method Name of the method to invoke, if it is
 * registered/whitelisted an error will be returned.
 * @param args The arguments to pass to the function, these must be IPC
 * marshalable friendly primitives and/or JSON serializable structures.
 * The last argument may be a callback, in which case the method will
 * establish a listener to receive intermediate progress values emitted
 * from the invoked method in the nodejs process.
 * @returns A promise that resolves or rejects when the nodejs process
 * method completes.  The values returned from the method will be passed
 * to the completion methods of the promise.
 */
export function invoke(method: string, ...args: any[]): Promise<any> {
	return window.ipc.invoke(method, ...args);
}
