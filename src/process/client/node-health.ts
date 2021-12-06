/**
 * An enumeration typically returned by the `CalaxyClient`
 * along side transaction and query results.  It indicates
 * the perceived health of the node the client is connected to.
 */
export enum NodeHealth {
	/**
	 * Indicates the request made to the connected hedera
	 * node completed without any perceived slowdown or
	 * significant throttling.
	 */
	Healthy = 0,
	/**
	 * Indicates the client perceived some throttling
	 * or slowdown with the connected nodes processing
	 * of the request.
	 */
	Throttled = 1,
	/**
	 * Indicates the client experienced significant slowdown
	 * or connection issues (such as gRPC errors) or even
	 * was unable to reach the hedera node to initiate processing.
	 * The hedera node should not be relied upon for the time being
	 * to process any additional requests.
	 */
	Unhealthy = 2,
}
