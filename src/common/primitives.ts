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
 * Enumerator identifying the macro stage an individual
 * payment may be in.  There are three ending stage
 * results: scheduled, completed and failed.
 */
export enum PaymentStage {
	/**
	 * Payment processing for the associated
	 * distribution has not yet started.
	 */
	NotStarted = 0,
	/**
	 * Processing this distribution is in progress.
	 * Additional sub-steps are identified by the
	 * PaymentStep enumeration.
	 */
	Processing = 1,
	/**
	 * The process completed with the scheduled step.
	 * The distribution has been scheduled with the
	 * network and requires additional signatures
	 * before transfers can be made.
	 */
	Scheduled = 2,
	/**
	 * The process completed successfully, and token
	 * transfers have been completed.
	 */
	Completed = 3,
	/**
	 * The process finished, but with an unrecoverable
	 * error.  Details of the error can be found by
	 * investigating the individual error codes produced
	 * by the network receipts attached to the distribution
	 * record.  Also, the PaymentStep enumeration indicates
	 * in which sub-step the process failed.
	 */
	Failed = 4,
}
/**
 * Enumerator identifying the individual steps carried
 * out during active processing of a distribution record.
 */
export enum PaymentStep {
	/**
	 * Payment processing for the associated
	 * distribution has not yet started.
	 */
	NotStarted = 0,
	/**
	 * Currently attempting to schedule a new
	 * pending transaction with the network for
	 * the distribution payment.
	 */
	Scheduling = 1,
	/**
	 * When scheduling the payment, it was
	 * determined it already existed.  Currently
	 * attempting to add signatures to the scheduled
	 * pending distribution payment.
	 */
	Countersigning = 2,
	/**
	 * The payment was either scheduled or countersigned,
	 * but the final disposition (were there enough
	 * signatures for it to complete the payment) is unknown.
	 * The algorithm is asking the network for a receipt
	 * to see if the payment has been completed (or failed),
	 * or if it still requires additional signatures
	 * (in which case no receipt will be found).
	 */
	Confirming = 3,
	/**
	 * The algorithm has completed processing of the payment
	 * record, the final disposition will be set in the
	 * PaymentStage value, and will be one of scheduled
	 * (requires additional signatures before completion),
	 * completed (transfer payment executed successfully
	 * and tokens were transferred) or failed (sufficient
	 * signatures were provided, but the transfer failed
	 * for other reasons).
	 */
	Finished = 4,
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
/**
 * Interface describing the shape of data returned by processing
 * algorithms in progress for updating user components.
 */
export interface DistributionResult {
	/**
	 * Distribution index position in the array of payments,
	 * used to correlate intermediate results.
	 */
	index: number;
	/**
	 * The account number in shard.realm.num form.
	 */
	account: string;
	/**
	 * The amount of distribution in string form.
	 */
	amount: string;
	/**
	 * An enumeration indicating the overall stage of the
	 * payment (not started, processing, completed).
	 */
	stage: PaymentStage;
	/**
	 * An enumeration indicating the individual step in
	 * the processing pipeline the payment is currently
	 * in (only valid when the stage is processing).
	 */
	step: PaymentStep;
	/**
	 * The scheduling transaction in string form, if known.
	 */
	schedulingTx?: string;
	/**
	 * The transaction ID that will perform (or has performed)
	 * the actual transfer of tokens for the distribution in
	 * string form, if known.
	 */
	scheduledTx?: string;
	/**
	 * The scheduled transaction ID in string form, if known.
	 */
	scheduleId?: string;
}
