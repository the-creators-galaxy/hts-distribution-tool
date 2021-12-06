import {
	AccountId,
	Client,
	PrecheckStatusError,
	ReceiptStatusError,
	Status,
	Transaction,
	TransactionResponse,
	Query,
	AccountBalanceQuery,
} from '@hashgraph/sdk';
import { NodeHealth } from './node-health';
import type { Gateway } from './gateway';
import type { QryResponse } from './qry-response';
import type { TxResponse } from './tx-response';
/**
 * A Hedera Node client connected to a single Hedera Node.
 * It accepts the same suite of hedera transaction and query
 * requests as the @hashgraph/sdk client and returns the same
 * result objects in addition to other metadata.  The client
 * provides information regarding the perceived performance of
 * the remote hedera node, but does not provide fallback or
 * switching to different nodes as an option.  It is left to
 * methods utilizing this client to orchestrate such decisions.
 */
export class CalaxyClient {
	/**
	 * The amount of time the client will wait for a transaction
	 * response from a remote hedera node.  It is set at 200s which
	 * is just beyond the limit of a paying transaction’s time to live.
	 * If a response does not come back the node in this amount of
	 * time, the client will assume the node has become unhealthy
	 * and return the appropriate code along with an error message.
	 */
	private readonly _defaultTransactionTimeout = 200000;
	/**
	 * The amount of time the client will wait for a query response
	 * from a remote hedera node.  It is set at 30s which is considered
	 * a reasonable amount of time for a single node to respond to
	 * a non-consensus request.  If a response does not come back the
	 * node in this amount of time, the client will assume the node has
	 * become unhealthy and return the appropriate code along with an
	 * error message.
	 */
	private readonly _defaultQueryTimeout = 30000;
	/**
	 * The HAPI endpoint address and associated crypto
	 * wallet for the hedera node.
	 */
	private readonly _gateway: Gateway;
	/**
	 * Constructs an array of `CalaxyClient` objects, one for each
	 * known testnet node as known by the @hashgraph/sdk library.
	 *
	 * @returns Array of `CalaxyClient` instances, one for each
	 * Hedera Node in the testnet network.
	 */
	public static forTestnet(): CalaxyClient[] {
		return CalaxyClient.forNetwork(Client.forTestnet().network);
	}
	/**
	 * Constructs an array of `CalaxyClient` objects, one for each
	 * known mainnet node as known by the @hashgraph/sdk library.
	 *
	 * @returns Array of `CalaxyClient` instances, one for each
	 * Hedera Node in the mainnet network.
	 */
	public static forMainnet(): CalaxyClient[] {
		return CalaxyClient.forNetwork(Client.forMainnet().network);
	}
	/**
	 * Constructs an array of `CalaxyClient` objects, one for each of
	 * the network nodes identified by included @hashgraph/sdk network object.
	 *
	 * @param network Object mapping urls to Account IDs representing a
	 * network (this is the format used by the @hashgraph/sdk).
	 * @returns Array of `CalaxyClient` instances, one for each
	 * Hedera Node in the identified network.
	 */
	public static forNetwork(network: {
		[key: string]: string | AccountId;
	}): CalaxyClient[] {
		var clients = [];
		for (let [url, nodeValue] of Object.entries(network)) {
			const node =
				nodeValue instanceof AccountId
					? nodeValue
					: AccountId.fromString(nodeValue);
			clients.push(new CalaxyClient({ url, node }));
		}
		return clients;
	}
	/**
	 * Filters a list of `CalaxyClient` objects, returning a new list of
	 * client objects that are currently responsive to a `ping` request.
	 * This is useful for filtering out unresponsive or unhealthy hedera
	 * nodes before starting a large batch process requiring the use of
	 * all available healthy nodes.
	 *
	 * @param clients The list of client objects to check.
	 * @param timeoutInMs The allowed timeout in milliseconds.
	 * Clients not responding within this time frame will be filtered
	 * out of the resulting list.
	 * @returns A list of `CalaxyClient` object instances that responded
	 * without error to the ping request within the required timeout period.
	 */
	public static async filterByPing(
		clients: CalaxyClient[],
		timeoutInMs: number,
	): Promise<CalaxyClient[]> {
		let tasks = [];
		let liveNodes = [];
		for (const client of clients) {
			tasks.push(
				runTaskOrTimeout(timeoutInMs, async () => {
					try {
						const ping = await client.executeQuery(() =>
							Promise.resolve(
								new AccountBalanceQuery()
									.setAccountId(client._gateway.node)
									.setNodeAccountIds([client._gateway.node]),
							),
						);
						if (ping.response && ping.nodeHealth !== NodeHealth.Unhealthy) {
							liveNodes.push(client);
						}
					} catch (err) {
						// We really don't need to know why this ping request
						// failed, but that the node is not available if there
						// was any sort of exception thrown.
					}
				}),
			);
		}
		await Promise.all(tasks);
		// Note: we copy the array here because a slow
		// responding node could still mutate the
		// original `liveNodes` array after this method
		// has completed.  We do not want that node to
		// magically appear in the returned list.
		return liveNodes.slice();
	}
	/**
	 * Main constructor, requires a gateway identifying a remote Hedera Node.
	 *
	 * @param gateway A gateway object paring an HAPI gRPC endpoint for the
	 * Hedera Node with its associated crypto wallet address.
	 */
	constructor(gateway: Gateway) {
		this._gateway = gateway;
	}
	/**
	 * Attempts to submit a transaction to the associated Hedera Node and
	 * waits for a receipt.  It requires a callback factory method that
	 * creates and signs the transaction request.  It is possible that,
	 * when the hedera node is throttling input, this method will be
	 * called one or more times to re-create and re-sign the transaction
	 * because the auto-generated transaction ID time to live has expired
	 * before the network will have accepted the request.
	 *
	 * @param factory Factory method callback that creates and signs the
	 * transaction request.  This method may be called more than once must
	 * be able to re-create and re-sign when the node is throttling input.
	 * It also should apply the `setNodeAccountIds` method to the
	 * transaction to ensure proper processing of the request by the
	 * underlying @hashgraph/sdk client implementation.
	 * @returns The Hedera Network Transaction response with metadata.
	 * It will always include the transaction ID and a node health
	 * indication.  The receipt will be included if it was obtainable
	 * (regardless of the response code status, including error codes)
	 * otherwise the error property will be populated instead.
	 */
	public async executeTransaction(
		factory: (nodeIds: AccountId[]) => Promise<Transaction>,
	): Promise<TxResponse> {
		const result: TxResponse = { nodeHealth: NodeHealth.Healthy };
		let precheck: TransactionResponse | null = null;
		const client = Client.forNetwork({
			[this._gateway.url]: this._gateway.node,
		});
		while (!precheck && !result.error) {
			if (
				!(await runTaskOrTimeout(this._defaultTransactionTimeout, async () => {
					try {
						const transaction = await factory([this._gateway.node]);
						const tenativePrecheck = await transaction.execute(client);
						if (!precheck) {
							precheck = tenativePrecheck;
						}
					} catch (err) {
						if (!precheck) {
							if (err instanceof PrecheckStatusError) {
								if (
									err.status === Status.Busy ||
									err.status === Status.TransactionExpired
								) {
									result.nodeHealth = NodeHealth.Throttled;
								} else {
									result.error = err;
								}
							} else if (err instanceof Error) {
								result.nodeHealth = NodeHealth.Unhealthy;
								result.error = err;
							} else {
								result.error = Error(JSON.stringify(err));
							}
						}
					}
				}))
			) {
				result.nodeHealth = NodeHealth.Unhealthy;
				result.error = new Error(
					'Transaction failed with a timeout during precheck.',
				);
			}
		}
		if (precheck) {
			result.transactionId = precheck.transactionId;
			while (!result.receipt && !result.error) {
				if (
					!(await runTaskOrTimeout(
						this._defaultTransactionTimeout,
						async () => {
							try {
								const tenativeReceipt = await precheck.getReceipt(client);
								if (!result.receipt && !result.error) {
									result.receipt = tenativeReceipt;
								}
							} catch (err) {
								if (!result.receipt && !result.error) {
									if (err instanceof ReceiptStatusError) {
										if (
											err.transactionReceipt.status === Status.Unknown ||
											err.transactionReceipt.status ===
												Status.TransactionExpired ||
											err.transactionReceipt.status === Status.ReceiptNotFound
										) {
											result.nodeHealth = NodeHealth.Unhealthy;
											result.error = err;
										} else if (err.transactionReceipt.status === Status.Busy) {
											// Will probably end with receipt not found, but retry anyway.
											result.nodeHealth = NodeHealth.Throttled;
										} else {
											result.receipt = err.transactionReceipt;
										}
									} else if (err instanceof Error) {
										result.nodeHealth = NodeHealth.Unhealthy;
										result.error = err;
									} else {
										result.nodeHealth = NodeHealth.Unhealthy;
										result.error = Error(JSON.stringify(err));
									}
								}
							}
						},
					))
				) {
					result.nodeHealth = NodeHealth.Unhealthy;
					result.error = new Error(
						'Transaction failed with a timeout while retrieving receipt.',
					);
				}
			}
		}
		client.close();
		return result;
	}
	/**
	 * Attempts to submit a query request to the associated Hedera Node and
	 * waits for a response.  It requires a callback factory method that
	 * creates and signs the query request.  It is possible that, when the
	 * hedera node is throttling input, this method will be called one or
	 * more times to re-create and re-sign the query because the payment
	 * transaction ID time to live has expired before the network will have
	 * accepted the request.
	 * @param factory Factory method callback that creates and potentially
	 * signs the query reautes.  This method may be called more than once
	 * and must be able to re-create and re-sign when the node is
	 * throttling input.  It also should apply the `setNodeAccountIds`
	 * method to the request to ensure proper processing by the underlying
	 * @hashgraph/sdk client implementation.
	 * @returns The Hedera Network Query response with metadata.  It will
	 * include a health indication and the request information in the
	 * `response` field if it was obtainable.  If not, the `error` property
	 * contains an explanation for why the request failed.  The type of
	 * `response` is dependent upon the type of query requested.
	 */
	public async executeQuery<T>(
		factory: (nodeIds: AccountId[]) => Promise<Query<T>>,
	): Promise<QryResponse<T>> {
		const result: QryResponse<T> = { nodeHealth: NodeHealth.Healthy };
		const client = Client.forNetwork({
			[this._gateway.url]: this._gateway.node,
		});
		while (!result.response && !result.error) {
			if (
				!(await runTaskOrTimeout(this._defaultQueryTimeout, async () => {
					try {
						const query = await factory([this._gateway.node]);
						const tenativeResponse = await query.execute(client);
						if (!result.response && !result.error) {
							result.response = tenativeResponse;
						}
					} catch (err) {
						if (!result.response && !result.error) {
							if (err instanceof PrecheckStatusError) {
								if (
									err.status === Status.Busy ||
									err.status === Status.TransactionExpired
								) {
									result.nodeHealth = NodeHealth.Throttled;
								} else {
									result.error = err;
								}
							} else if (err instanceof Error) {
								result.nodeHealth = NodeHealth.Unhealthy;
								result.error = err;
							} else {
								result.nodeHealth = NodeHealth.Unhealthy;
								result.error = Error(JSON.stringify(err));
							}
						}
					}
				}))
			) {
				result.nodeHealth = NodeHealth.Unhealthy;
				result.error = new Error('Query failed with a timeout.');
			}
		}
		client.close();
		return result;
	}
}
/**
 * Module level helper function that provides a sudo-timeout feature to
 * clients calling the hedera network.  The method will return true when
 * the response from the `taskRunner` resolves, if it resolves first,
 * otherwise if the timeout is reached the method will resolve to `false`.
 * This DOES NOT prevent or cancel the task from completing, calling code
 * should keep this mind when implementing the callback and what
 * side-affects it may result in.
 *
 * @param miliseconds The timeout value in milliseconds.
 * @param taskRunner The callback task method to invoke.
 *
 * @returns `true` if the taskRunner completed before the timeout,
 * `false` if id did not.
 */
function runTaskOrTimeout(
	miliseconds: number,
	taskRunner: () => Promise<void>,
): Promise<boolean> {
	return new Promise((resolve, reject) => {
		let completed = false;
		let handle = setTimeout(resolveByTimeout, miliseconds);
		taskRunner().then(resolveByTask, rejectByTask);
		function resolveByTask() {
			if (completed) return;
			completed = true;
			clearTimeout(handle);
			resolve(true);
		}
		function rejectByTask(error) {
			if (completed) return;
			completed = true;
			clearTimeout(handle);
			reject(error);
		}
		function resolveByTimeout() {
			if (completed) return;
			completed = true;
			clearTimeout(handle);
			resolve(false);
		}
	});
}
