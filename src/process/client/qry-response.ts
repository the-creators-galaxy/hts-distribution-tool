import type { NodeHealth } from './node-health';
/**
 * Hedera Network Query response with metadata.
 * This object is returned from the `CalaxyClient`
 * when querying the Hedera Network thru the client.
 * It will return a health indication and the
 * requested information in the `response` field if
 * it was obtainable.  If not, the `error` property
 * contains an explanation for why the request failed.
 */
export interface QryResponse<T> {
	/**
	 * The response returned from the network query,
	 * the type is dependent on the type of query.
	 */
	response?: T;
	/**
	 * An indication of the perceived health of the Hedera Node
	 * processing the request.  If the network responded quickly
	 * the property will indicate `Healthy`.  If the client
	 * observed throttling (such as the `BUSY` response),
	 * it will contain `Throttled`.  If the client observes
	 * significant throttling, gRPC errors and/or other
	 * problems, it will return `Unhealthy`.
	 */
	nodeHealth: NodeHealth;
	/**
	 * If the request failed and did not produce a response,
	 * this property will contain an error object containing
	 * additional information regarding the fault.
	 */
	error?: Error;
}
