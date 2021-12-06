import type { TransactionId, TransactionReceipt } from '@hashgraph/sdk';
import type { NodeHealth } from './node-health';
/**
 * Hedera Network Transaction response with metadata.
 * This is object returned from the `CalaxyClient` when
 * invoking a transaction on the Hedera Network thru the
 * client.  It will always include the transaction ID
 * and a node health indication.  The receipt will be
 * included if it was obtainable (regardless of
 * response code status) otherwise the error property
 * will be populated instead.
 */
export interface TxResponse {
	/**
	 * The transaction id the request was submitted with.
	 */
	transactionId?: TransactionId;
	/**
	 * The transaction receipt returned from Hedera Network,
	 * regardless of attached response code.  (The client
	 * does not throw an exception for status codes other
	 * than `SUCCESS ` and may return the receipt having
	 * error status codes)
	 */
	receipt?: TransactionReceipt;
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
	 * If the request failed and did not produce a receipt,
	 * this property will contain an error object containing
	 * additional information regarding the fault.
	 */
	error?: Error;
}
