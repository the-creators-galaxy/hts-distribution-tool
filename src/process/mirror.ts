import { request, Agent } from 'https';
import { displayEpochString } from '../common/convert';
import { NetworkId } from '../common/primitives';
import { getNetworkId } from './distribution';
/**
 * A common http agent configured with `keepalive` to true, this attempts
 * to reduce the I/O burden on the mirror node, increasing the reliability
 * of connection.
 */
const agent = new Agent({ keepAlive: true });
/**
 * Retrieves the details of the specified transaction, will wait a period
 * of time for the mirror node to sync if necessary.
 *
 * @param accountId the account id in shard.realm.num format.
 * @param seconds the transaction starting seconds.
 * @param nanos the transaction starting nanos.
 *
 * @returns an object literal structure representing the details
 * of the transaction as returned by the remote mirror node.
 */
export async function getTransactionInfo(accountId: string, seconds: number, nanos: number, scheduled = false, nonce = 0): Promise<any> {
	const network = getNetworkId() === NetworkId.Test ? 'Testnet' : 'Mainnet';
	const txId = { accountId, seconds, nanos, scheduled, nonce };
	const transactionId = `${accountId}-${seconds.toFixed(0)}-${nanos.toFixed(0).padStart(9, '0')}`;
	const scheduledFlag = scheduled ? 'true' : 'false';
	const options = {
		hostname: getMirrorHostname(),
		path: `/api/v1/transactions/${transactionId}?nonce=${nonce}&scheduled=${scheduledFlag}`,
		method: 'GET',
		agent,
	};
	try {
		const data = await executeRequestWithRetry(options);
		const parsed = JSON.parse(data.toString('ascii'));
		const record = parsed.transactions ? parsed.transactions.find((t) => t.transaction_id === transactionId) : null;
		if (record) {
			return {
				txId,
				...record,
				network,
				raw: parsed,
			};
		} else {
			return { txId, error: 'Transaction not found.', network, raw: parsed };
		}
	} catch (err) {
		const error = err.message || err.toString();
		return { txId, error, network };
	}
}
/**
 * Retrieves the details of the specified account from a mirror node,
 * will wait a period of time for the mirror node to sync if necessary.
 *
 * @param accountId the account id in shard.realm.num format.
 *
 * @returns an object literal structure representing the details
 * of the account as returned by the remote mirror node.
 */
export async function getAccountInfo(accountId: string): Promise<any> {
	const network = getNetworkId() === NetworkId.Test ? 'Testnet' : 'Mainnet';
	const options = {
		hostname: getMirrorHostname(),
		path: `/api/v1/balances?account.id=${accountId}`,
		method: 'GET',
		agent,
	};
	try {
		const data = await executeRequestWithRetry(options);
		const parsed = JSON.parse(data.toString('ascii'));
		const timestamp = parsed.timestamp ? displayEpochString(parsed.timestamp) : null;
		const record = parsed.balances ? parsed.balances.find((b) => b.account === accountId) : null;
		if (record) {
			return {
				accountId,
				balance: record.balance,
				tokens: record.tokens || [],
				timestamp,
				network,
				raw: parsed,
			};
		} else {
			return { accountId, error: 'Account information not found.', network, timestamp, raw: parsed };
		}
	} catch (err) {
		const error = err.message || err.toString();
		return { accountId, error, network };
	}
}
/**
 * Retrieves the details of the specified scheduled transaction from
 * a mirror node, will wait a period of time for the mirror node to
 * sync if necessary.
 *
 * @param scheduleId the schedule id in shard.realm.num format.
 *
 * @returns an object literal structure representing the details
 * of the schedule as returned by the remote mirror node.
 */
export async function getScheduleInfo(scheduleId: string): Promise<any> {
	const network = getNetworkId() === NetworkId.Test ? 'Testnet' : 'Mainnet';
	const options = {
		hostname: getMirrorHostname(),
		path: `/api/v1/schedules/${scheduleId}`,
		method: 'GET',
		agent,
	};
	try {
		const data = await executeRequestWithRetry(options);
		const parsed = JSON.parse(data.toString('ascii'));
		const timestamp = parsed.consensus_timestamp ? displayEpochString(parsed.consensus_timestamp) : null;
		const signingKeys = (parsed.signatures || []).map((s) => s.public_key_prefix).filter((s) => !!s);
		if (timestamp) {
			return {
				scheduleId,
				createdById: parsed.creator_account_id,
				payerId: parsed.payer_account_id,
				deleted: parsed.deleted,
				executed: parsed.executed_timestamp ? displayEpochString(parsed.executed_timestamp) : null,
				signingKeys,
				timestamp,
				network,
				raw: parsed,
			};
		} else {
			return { scheduleId, error: 'Schedule information not found.', network, timestamp, raw: parsed };
		}
	} catch (err) {
		const error = err.message || err.toString();
		return { scheduleId, error, network };
	}
}
/**
 * Internal helper function that performs the actual REST API call to
 * the mirror node.  It assumes input values are 'correct' such that
 * it will retry the request upon any failure for set number of tries
 * before raising an error.
 *
 * @param options The http request options of the request.
 *
 * @returns A buffer object containing the data returned from the request,
 * or an error is thrown for non 200 responses.
 */
async function executeRequestWithRetry(options): Promise<Buffer> {
	let code;
	let data;
	for (let i = 0; i < 30; i++) {
		({ code, data } = await executeRequest(options));
		if (code === 200) {
			return data;
		} else if (code === 404) {
			await new Promise((resolve) => setTimeout(resolve, 7000));
		}
	}
	throw new Error(`Received error code: ${code}`);
}
/**
 * Low level helper function implementing the call to the REST API.
 *
 * @param options HTTP options sent in from calling code.
 *
 * @returns An object containing the HTTP code returned (typically 200)
 * and the data from the body of the returned message.
 */
function executeRequest(options): Promise<{ code: number; data: Buffer }> {
	const data = [];
	return new Promise((resolve, reject) => {
		const req = request(options, (res) => {
			res.on('data', (chunk) => {
				data.push(chunk);
			});
			res.on('end', () => resolve({ code: res.statusCode, data: Buffer.concat(data) }));
		});
		req.on('error', (e) => reject(e));
		req.end();
	});
}
/**
 * Low level helper function returining the proper mirrror node
 * address based upon the current distribution configuration.
 *
 * @returns the hostname of the mirror node to query (either the
 * testnet or mainnet mirror node hostname).
 */
function getMirrorHostname() {
	return getNetworkId() === NetworkId.Test ? 'testnet.mirrornode.hedera.com' : 'mainnet-public.mirrornode.hedera.com';
}
