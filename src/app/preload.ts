import { contextBridge, ipcRenderer } from 'electron';
import type { IpcAsyncMessageResponse } from '../common/ipc';

let nonce = 0;
/**
 * Implements the orchestration of remote method invocations from the user
 * interface thread to the nodejs process via electron’s IPC interface.
 * All method calls are routed thru this implementation with a custom message
 * format and id structure that is predictable on both ends of the IPC channel.
 * Methods within the nodejs process are also whitelisted for security
 * purposes reducing the chance of abuse by an unforeseen threat from the
 * user interface code.
 *
 * This method is exposed on the global window object as `window.ipc.invoke`
 * while this address is not directly leveraged by UI components it nonetheless
 * exists in the environment.  This code lives in the preload.ts file because
 * it is the only location in the lifecycle of an electron app that has
 * temporary access to setup the IPC channel infrastructure.
 *
 * @param method The name of the registered/whitelisted
 * nodejs process method to invoke.
 * @param args The arguments to pass to the function, these must be IPC
 * marshalable friendly primitives and/or JSON serializable structures.
 * The last argument may be a callback, in which case the method will
 * establish a listener to receive intermediate progress values emitted
 * from the invoked method in the nodejs process.
 * @returns A promise that resolves or rejects when the nodejs process
 * method completes.  The values returned from the method will be passed
 * to the completion methods of the promise.
 */
function invoke(method: string, ...args: any[]): Promise<any> {
	let result: Promise<any>;
	nonce = nonce + 1;
	const id = `ipc-invoke-async-response-${nonce}`;
	if (args && args.length > 0 && typeof args[args.length - 1] === 'function') {
		// If the calling method adds a "callback" method as the last
		// argument, this call will be setup with functionality to
		// receive intermediate progress results over the channel, and
		// dispatch to the provided callback method.  Once receiving a
		// reason or value data field over the channel, it assumes the
		// method has completed and will shudown channel listeners and
		// resolve or reject the promise.
		const callback = args.pop();
		result = new Promise((resolve, reject) => {
			ipcRenderer.on(id, (_, response: IpcAsyncMessageResponse) => {
				if (response.progress) {
					callback(response.progress);
				} else if (response.reason) {
					ipcRenderer.removeAllListeners(id);
					reject(response.reason);
				} else {
					ipcRenderer.removeAllListeners(id);
					resolve(response.value);
				}
			});
		});
		ipcRenderer.send('ipc-invoke-async', { id, method, args, progress: true });
	} else {
		// If the calling method does not add a "callback" method as the
		// last argument, the algorithm will only listen for one response
		// over the return chanel and resolve or reject the promise as appropriate.
		result = new Promise((resolve, reject) => {
			ipcRenderer.once(id, (_, response: IpcAsyncMessageResponse) => {
				if (response.reason) {
					reject(response.reason);
				} else {
					resolve(response.value);
				}
			});
		});
		ipcRenderer.send('ipc-invoke-async', { id, method, args, progress: false });
	}
	return result;
}
// Expose this method on the user interface’s
// context as `window.ipc.invoke`.  It should not
// be used directly, instead UI components should
// import the the `invoke` method from the
// `common/ipc` module.
contextBridge.exposeInMainWorld('ipc', { invoke });
