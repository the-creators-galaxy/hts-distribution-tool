import type { AccountId } from '@hashgraph/sdk';
/**
 * Structure representing a Hedera Node by paring
 * the url and wallet address.
 */
export interface Gateway {
	/**
	 * The Hedera Node's HAPI gRPC address url.
	 */
	url: string;
	/**
	 * The crypto wallet address associated with
	 * the Hedera Node.
	 */
	node: AccountId;
}
