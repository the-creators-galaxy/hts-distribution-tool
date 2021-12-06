import { ResponseCodeEnum } from '@hashgraph/proto';
import { TransactionReceiptQuery } from '@hashgraph/sdk';
/**
 * An altered version of the `TransactionReceiptQuery` that
 * does not retry the query if the network responds with
 * `RECEIPT_NOT_FOUND`.  The default implementation will
 * wait forever when this code is returned, which can be
 * problematic for retrieving receipts for not-yet-completed
 * scheduled transactions.
 */
export class TryGetTransactionReceiptQuery extends TransactionReceiptQuery {
	_shouldRetry(request: any, response: any) {
		const result = super._shouldRetry(request, response);
		if (result === 'Retry') {
			const { nodeTransactionPrecheckCode } = this._mapResponseHeader(response);
			if (nodeTransactionPrecheckCode === ResponseCodeEnum.RECEIPT_NOT_FOUND) {
				return 'Error';
			}
		}
		return result;
	}
}
