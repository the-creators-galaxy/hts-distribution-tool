/**
 * An internal interface representing the agreed upon format of
 * messages over the IPC channel facilitating the user interface
 * thread invoking methods executing in the nodejs process module.
 */
export interface IpcAsyncMessageRequest {
	/**
	 * ID of the invocation request, should be unique per request
	 * and is the ID returned from the system when the method
	 * invocation is complete.
	 */
	id: string;
	/**
	 * The name of the remote method to call, must be in the
	 * white-list of possible methods to invoke.
	 */
	method: string;
	/**
	 * The arguments to pass to the method being invoked in
	 * the node process.
	 */
	args: any;
	/**
	 * Boolean argument indicating that the calling code included
	 * a callback method in the original invocation and wishes to
	 * receive progress messages from the method while it is
	 * processing data.
	 */
	progress: boolean;
}
/**
 * An internal interface representing the agreed upon format of
 * messages over the IPC channel representing responses from code
 * executing in the nodejs process that were initiated by the UI thread.
 */
export interface IpcAsyncMessageResponse {
	/**
	 * If included, represents an intermediate progress message,
	 * this will only appear for methods that include a progress
	 * callback method in their signature.
	 */
	progress?: any;
	/**
	 * A successful completion of the method invocation, the UI
	 * mapping algorithm casts this into a Promise resolve in the
	 * user interface thread.
	 */
	value?: any;
	/**
	 * A failed completion of the method invocation, the UI mapping
	 * algorithm casts this into a Promise reject in the user
	 * interface thread.
	 */
	reason?: any;
}
