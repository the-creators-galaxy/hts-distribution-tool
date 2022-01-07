/**
 * Enumerator identifying the network to connect
 * to for processing.
 */
export enum NetworkId {
	/**
	 * The Main Hedera Network
	 */
	Main = 1,
	/**
	 * The Hedera TESTNET Network
	 */
	Test = 2,
}
/**
 * Object containing Hex Encoded String representations of
 * an ED25519 private key with its corresponding public key
 * (typically for display purposes).
 */
export interface Signatory {
	/**
	 * Private ED25519 ANS.1 Hex value.
	 */
	privateKey: string;
	/**
	 * Public ED25519 ANS.1 Hex value matching
	 * the private key value.
	 */
	publicKey: string;
}
/**
 * Provides information regarding a distribution csv
 * parsing error, including line number, column and
 * description.
 */
export interface CsvParseError {
	/**
	 * Line number where the error was encountered.
	 */
	line: number;
	/**
	 * Column number where the error was encountered.
	 */
	column: number;
	/**
	 * Brief description of the parsing error.
	 */
	description: string;
}
/**
 * The results obtained from parsing a distribution CSV file,
 * including detailed parsed results, raw data and errors.
 */
export interface CsvDataSummary {
	/**
	 * The full path to the distribution CSV file.
	 */
	filename: string;
	/**
	 * The raw number of rows observed in the CSV file.
	 */
	rows: number;
	/**
	 * The raw maximum number of columns observed in the CSV file.
	 */
	columns: number;
	/**
	 * The maximum number of decimals observed in the distribution CSV file
	 * for all of the distributions.  This is to be cross-referenced with
	 * the token info to ensure valid decimal places in the CSV file.
	 */
	decimals: number;
	/**
	 * The curated list of potential distributions to process that were
	 * successfully extracted from the CSV file.  Invalid entries will
	 * not be visible here, but there is no guarantee in this list that
	 * the accounts exist nor that they are associated with the token
	 * to be distributed.
	 */
	transfers: { account: string; amount: string }[];
	/**
	 * The raw [row][column] data as string values obtained from the
	 * distribution CSV file (so the user can cross-reference parsing
	 * errors if necessary).
	 */
	data: string[][];
	/**
	 * The list of CSV parsing errors the loading algorithm identified
	 * when loading the CSV file.  This can be both parsing errors or
	 * unmet expectations for account file format or transfer amount.
	 */
	errors: CsvParseError[];
}
/**
 * Treasury and other crypto account information entered by the user.
 */
export interface TreasuryInfo {
	/**
	 * The @hashgraph/sdk Network ID to target.
	 */
	networkId: NetworkId;
	/**
	 * The address of the distribution token (0.0.x).
	 */
	token: string;
	/**
	 * The address of the crypto account that will be charged for all
	 * transaction fees (as the payer/operator) for submitting,
	 * countersigning and collecting information for all processed
	 * distributions, EXCEPT, it is not necessarily the account that
	 * pays for the execution of the (scheduled) distribution itself.
	 */
	submitPayer: string;
	/**
	 * Contains the list of Hex encoded private keys typically related
	 * to the account paying the network fees for scheduling the transfer
	 * transaction and/or paying the fees to coutersign an existing scheduled
	 * transaction.  The submit payer can be the same account as the tranfer
	 * payer, but it is not required to be so.
	 */
	submitPayerSignatories: Signatory[];
	/**
	 * The address of the crypto account identified as the payer of the
	 * (scheduled) distribution transfer itself.  This MUST be the same
	 * account id across all application invocations for a given
	 * distribution run, however only one party in the coordinated effort
	 * need include the private key(s) associated with this account.
	 * It can be the treasury account if it holds sufficient hBars to
	 * pay the transaction fees.
	 */
	transferPayer: string;
	/**
	 * Contains the list of Hex encoded private keys typically related to
	 * the account that pays the network fees charged for the transaction
	 * transfering tokens from the treasury.  The transfer payer can be the
	 * same account as the treasury or the submit payer, but it does not
	 * need to be.
	 */
	transferPayerSignatories: Signatory[];
	/**
	 * The address of the distribution token’s treasury account (0.0.x).
	 */
	tokenTreasury: string;
	/**
	 * Contains the list of Hex encoded private keys typically related to
	 * the treasury for authorizing the transfer of tokens from the treasury
	 * to other cypto accounts.  If this plan instance is intended to only
	 * 'schedule' the transfer transactions, this list can be empty.
	 */
	treasurySignatories: Signatory[];
}
/**
 * A summary of the distribution plan to be processed upon approval by the user.
 */
export interface DistributionPlanSummary {
	/**
	 * A list of configuration errors that prevent the plan from being
	 * processed by the application.
	 */
	errors: string[];
	/**
	 * A list of configuration or state errors that may prevent the plan
	 * from being fully processed successfully and may result in some
	 * distribution transactions failing.
	 */
	warnings: string[];
	/**
	 * The current balance of tokens held by the treasury.
	 */
	treasuryBalance: string;
	/**
	 * The number of token decimal places identified by the network.
	 */
	decimals: number;
	/**
	 * The number of tokens that will be transferred from the treasury
	 * upon commencement of this distribution.
	 */
	totalTransfers: string;
	/**
	 * A detailed list of the crypto accounts receiving tokens as a
	 * part of this distribution.
	 */
	transfers: { account: string; amount: string }[];
}
