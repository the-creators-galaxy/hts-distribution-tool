import * as fs from 'fs';
import { Worker } from 'worker_threads';
import { stringify } from 'csv-stringify';
import {
	AccountBalanceQuery,
	AccountId,
	PrivateKey,
	ScheduleCreateTransaction,
	ScheduleSignTransaction,
	Status,
	StatusError,
	TokenId,
	TransactionId,
	TransactionReceipt,
	TransferTransaction,
} from '@hashgraph/sdk';
import type AccountBalance from '@hashgraph/sdk/lib/account/AccountBalance';
import { BigNumber } from 'bignumber.js';
import { CsvDataSummary, CsvParseError, DistributionPlanSummary, NetworkId, Signatory, TreasuryInfo } from '../common/primitives';
import { CalaxyClient } from './client/client';
import { runClientsConcurrently } from './client/concurrent';
import { NodeHealth } from './client/node-health';
import type { QryResponse } from './client/qry-response';
import { TryGetTransactionReceiptQuery } from './client/try-get-transaction-receipt';
import type { TxResponse } from './client/tx-response';
import { Distribution, loadAndParseCsvDistributionFile } from './csv';
/**
 * Enumerates the various in-flight states of distribution
 * processing for an individual payment.
 */
enum PaymentStage {
	/**
	 * Processing has not yet started for this payment.
	 */
	NotStarted,
	/**
	 * Scheduling a partially signed payment transaction
	 */
	Scheduling,
	/**
	 * Adding additional signatures to a partially signed
	 * scheduled transaction
	 */
	Countersigning,
	/**
	 * Querying the network to see if the partially signed
	 * scheduled transaction has enough signatures and has
	 * been completed.
	 */
	Confirming,
	/**
	 * The node processing this payment instnace appears to
	 * be unhealthy and the process for this payment will
	 * need to be restared.
	 */
	Unhealthy,
	/**
	 * The processing of this individual payment failed for
	 * some reason.
	 */
	Failed,
	/**
	 * The processing of this individual payment is finised,
	 * the disposition of the payment is completed, waiting
	 * for additional signatures or permanently failed.
	 */
	Finished,
}
/**
 * Internal interface structure representing a payment record
 * during processing.  It holds detailed information concerning
 * each step of the process.
 */
interface PaymentRecord extends Distribution {
	/**
	 * The index number of the record (matches the original
	 * index value in the array).  Usefull for coordinating
	 * individual partial updates in the user interface.
	 */
	index: number;
	/**
	 * The amount of the transfer denominated in the smallest
	 * token amount.
	 */
	amountInTinyToken?: BigNumber;
	/**
	 * Flag indicating that the payment is actively being
	 * processed by the system.
	 */
	inProgress?: boolean;
	/**
	 * A interpreted string representation of the current
	 * status of the payment, derived from receipts and status
	 * of various network transaction requests.
	 */
	status: string;
	/**
	 * The latest result of the scheduling request made by the
	 * application to the hedera network.  Under certain
	 * circumstances (such as the client node being unhealthy)
	 * this result may be retried one or more times.
	 */
	schedulingResult?: TxResponse;
	/**
	 * The latest result of the countersigning request made by
	 * the application to the hedera network.  Depending on
	 * status codes returned for the scheduling request, this
	 * value may be undefined because countersigning is not
	 * needed for this payment (the scheduling payment was the
	 * first to create the scheduled transaction).  Also, under
	 * certain circumstances (such as the client node being
	 * unhealthy) this result may be retried one or more times.
	 */
	countersigningResult?: TxResponse;
	/**
	 * If available, the details regarding the scheduled
	 * transaction if it has already received a sufficient
	 * number of signatures to complete.  It is not an error
	 * for this value to be missing or to possibly have error
	 * codes.  It is possible the transaction receipt could
	 * fail for some reason outside the control of the
	 * distribution tool (such as a receive-signature-required
	 * flag, a condition not checked by the tool prior to
	 * attempting to send payment).
	 */
	confirmationResult?: QryResponse<TransactionReceipt>;
}
/**
 * The full path to the original distribution CSV file.
 */
let csvFilename: string;
/**
 * The raw number of rows observed in the CSV file (UI feedback).
 */
let csvRows: number;
/**
 * The raw maximum number of columns observed in the CSV file (UI feedback).
 */
let csvColumns: number;
/**
 * The maximum number of decimals observed in the distribution CSV file
 * for all of the distributions.  This is to be cross-referenced with
 * the token info to ensure valid decimal places in the CSV file.
 */
let csvDecimals: number;
/**
 * The raw [row][column] data as string values obtained from the
 * distribution CSV file (so the user can cross-reference parsing
 * errors if necessary).
 */
let csvRawData: string[][];
/**
 * The list of CSV parsing errors the loading algorithm identified
 * when loading the CSV file.  This can be both parsing errors or
 * unmet expectations for account file format or transfer amount.
 */
let csvErrors: CsvParseError[];
/**
 * The curated list of potential distributions to process that were
 * successfully extracted from the CSV file.  Invalid entries will
 * not be visible here, but there is no guarantee in this list that
 * the accounts exist nor that they are associated with the token
 * to be distributed.
 */
let distributions: Distribution[];
/**
 * The @hashgraph/sdk Network ID to target.
 */
let networkId: NetworkId;
/**
 * The address of the distribution token (0.0.x).
 */
let tokenId: TokenId;
/**
 * The address of the distribution token’s treasury account (0.0.x).
 */
let tokenTreasuryId: AccountId;
/**
 * The address of the crypto account that will be charged for all
 * transaction fees (as the payer/operator) for submitting,
 * countersigning and collecting information for all processed
 * distributions, EXCEPT, it is not necessarily the account that
 * pays for the execution of the (scheduled) distribution itself.
 */
let submitPayerId: AccountId;
/**
 * The address of the crypto account identified as the payer of the
 * (scheduled) distribution transfer itself.  This MUST be the same
 * account id across all application invocations for a given
 * distribution run, however only one party in the coordinated effort
 * need include the private key(s) associated with this account.
 * It can be the treasury account if it holds sufficient hBars to
 * pay the transaction fees.
 */
let transferPayerId: AccountId;
/**
 * A list of @hashgraph/sdk private key class, contains the list of
 * private keys used to for scheduling and countersigning distribution
 * payment transactions.  Must include the necessary key(s) to satisfy
 * the `submitPayerId` crypto account at a minimum.
 */
let signatories: PrivateKey[];
/**
 * A list of errors produced while performing a preliminary check on
 * token and crypto account information entered by the user.
 */
let tokenInfoErrors: string[];
/**
 * A list of blocking errors identified while checking token
 * associations and crypto balances that would prevent a successful
 * processing of the distributions.  If any exist, the user interface
 * should not allow the user to proceed with processing.
 */
let preGenerationErrors: string[];
/**
 * A list of potential errors identified while checking token
 * associations and crypto balances that would interfere with
 * a fully successful processing of the entire list of distributions.
 * The user interface should allow the user to acknowledge and ignore
 * these errors if they choose to do so.
 */
let preGenerationWarnings: string[];
/**
 * The number of decimals for the token as returned by querying the
 * treasury’s balance of tokens.  Used to cross check with the decimals
 * indicated in the original CSV file to ensure there is not a conflict.
 */
let tokenDecimals: number;
/**
 * The balance of tokens (in the smallest denomination) in the treasury
 * retrieved from the network.
 */
let tokenTreasuryBalance: BigNumber;
/**
 * The summation of the total value of tokens to be distributed in the
 * pending distribution run.  Used to cross-reference with the treasury
 * balance.
 */
let totalTransfers: BigNumber;
/**
 * A list of unrecoverable errors raised during the processing of
 * the distribution plan.  May indicate that one or more distributions
 * failed and may require manual troubleshooting.
 */
let executionGenerationErrors: string[];
/**
 * The list of distribution payments processed during the distribution
 * run.  Includes receipts and/or error messages for each payment.
 * The number of payments should match the valid number of distributions.
 */
let payments: PaymentRecord[];
/**
 * Loads and parses the distribution CSV file, placing the results in the
 * appropriate module level variables for further processing and display.
 *
 * @param filename The full path to the distribution CSV file.
 */
export async function loadDistributionFile(filename: string): Promise<void> {
	({
		filename: csvFilename,
		rows: csvRows,
		columns: csvColumns,
		decimals: csvDecimals,
		transfers: distributions,
		data: csvRawData,
		errors: csvErrors,
	} = await loadAndParseCsvDistributionFile(filename));
}
/**
 * Retrieve distribution CSV parsing results.
 *
 * @returns summary of the parsed contents of the distribution CSV file
 * in a IPC marshaling friendly form.
 */
export function getDistributionFileSummary(): Promise<CsvDataSummary> {
	return Promise.resolve({
		filename: csvFilename,
		rows: csvRows,
		columns: csvColumns,
		decimals: csvDecimals,
		transfers: distributions.map((distribution) => {
			return {
				account: distribution.account.toString(),
				amount: distribution.amount.toString(),
			};
		}),
		data: csvRawData,
		errors: csvErrors,
	});
}
/**
 * Retrieves the treasury and crypto account information entered by the user.
 *
 * @returns the user entered details for the treasury and related input
 * parameters in an IPC marshaling friendly form.
 */
export function getTreasuryInformation(): Promise<TreasuryInfo> {
	return Promise.resolve({
		networkId,
		token: tokenId?.toString(),
		submitPayer: submitPayerId?.toString(),
		transferPayer: transferPayerId?.toString(),
		tokenTreasury: tokenTreasuryId?.toString(),
		signatories: (signatories || []).map((pKey) => {
			return {
				privateKey: '302e020100300506032b657004220420' + Buffer.from(pKey.toBytes()).toString('hex'),
				publicKey: '302a300506032b6570032100' + Buffer.from(pKey.publicKey.toBytes()).toString('hex'),
			};
		}),
	});
}
/**
 * Internal helper function returning the currently selected
 * network ID.  This is utilized by user interface components
 * generating urls to the proper DLT explorers such as dragonglass.
 *
 * @returns the currently selected network ID
 */
export function getNetworkId(): NetworkId {
	return networkId;
}
/**
 * Receives the treasury and crypto account information entered by the user.  Will not
 * throw an exception but will add any validation errors to the `tokenInfoErrors` array.
 *
 * @param info a treasury info object containing the information entered by the user.
 *
 * @returns a promise that is fulfilled when processing is complete, need by the IPC
 * architecture supporting the user interface thread.
 */
export function setTreasuryInformation(info: TreasuryInfo): Promise<void> {
	tokenInfoErrors = [];
	networkId = info.networkId;
	tokenId = tryParseTokenId(info.token, 'Token ID');
	submitPayerId = tryParseAccountId(info.submitPayer, 'Submit Payer ID');
	transferPayerId = tryParseAccountId(info.transferPayer, 'Transfer Payer ID');
	tokenTreasuryId = tryParseAccountId(info.tokenTreasury, 'Token Treasury ID');
	signatories = tryParsePrivateKeys(info.signatories);
	return Promise.resolve();

	function tryParseAccountId(value: string, description: string) {
		try {
			return AccountId.fromString(value);
		} catch (err) {
			tokenInfoErrors.push(`Invalid ${description}: ${err.message || err.toString()}`);
			return null;
		}
	}

	function tryParseTokenId(value: string, description: string) {
		try {
			return TokenId.fromString(value);
		} catch (err) {
			tokenInfoErrors.push(`Invalid ${description}: ${err.message || err.toString()}`);
			return null;
		}
	}

	function tryParsePrivateKeys(values: Signatory[]) {
		let result = [];
		for (var signatory of values) {
			try {
				result.push(PrivateKey.fromString(signatory.privateKey));
			} catch (err) {
				tokenInfoErrors.push(`Invalid Private Key: ${err.message || err.toString()}`);
				return null;
			}
		}
		return result;
	}
}
/**
 * Validates all inputs and attempts to generate a distribution plan
 * (list of distributions to create).  This includes checking balances
 * and token associations of target accounts utilizing free network queries.
 * It clears out previous errors and warnings and adds new ones as appropriate.
 *
 * @param progress Callback method that is called to report intermediate
 * progress back to the UI.
 *
 * @returns a computed distribution plan for display in the user interface,
 * including errors and warnings if they were found. This object is created
 * in an IPC marshaling friendly format.
 */
export async function generateDistributionPlan(progress: (any) => void): Promise<DistributionPlanSummary> {
	// Reset any previously generated plan.
	preGenerationErrors = [];
	preGenerationWarnings = [];
	totalTransfers = new BigNumber(0);
	tokenTreasuryBalance = new BigNumber(0);
	tokenDecimals = 0;
	distributions = distributions.map(({ account, amount }) => {
		return { account, amount };
	});

	const clients = await getReachableClientList();
	try {
		if (checkPrerequisites() && (await confirmAccountsExist())) {
			verifyTreasuryTokenBalance();
		}
	} catch (err) {
		preGenerationErrors.push(err.message || err.toString());
	}
	return {
		errors: preGenerationErrors,
		warnings: preGenerationWarnings,
		treasuryBalance: tokenTreasuryBalance.shiftedBy(-tokenDecimals).toString(),
		decimals: tokenDecimals,
		totalTransfers: totalTransfers.shiftedBy(-tokenDecimals).toString(),
		transfers: distributions
			.filter((distribution) => !!distribution.amountInTinyToken)
			.map((distribution) => {
				return {
					account: distribution.account.toString(),
					amount: distribution.amountInTinyToken.shiftedBy(-tokenDecimals).toString(),
				};
			}),
	};
	/**
	 * Checks for any errors related to previous steps in the import process,
	 * such as an invalid distribution CSV file or missing token information.
	 *
	 * @returns true if there are no errors preventing proceeding to validate
	 * accounts against the hedera network, false if we had other blocking errors.
	 */
	function checkPrerequisites(): boolean {
		progress(`Checking prerequisites ...`);
		if (csvErrors.length > 0 || tokenInfoErrors.length > 0) {
			preGenerationErrors.push('There are errors in the CSV Distribution file and/or Token Details, please correct before continuing.');
			return false;
		}
		if (clients.length === 0) {
			preGenerationErrors.push('Unable to reach any network nodes at this time.');
			return false;
		}
		return true;
	}
	/**
	 * Queries the hedera network to confirm the accounts identified in this
	 * distribution exist and are associated with the token where necessary.
	 *
	 * @returns True if no errors are found, false if enough errors
	 * were encountered to warrant short-circuiting the remainder
	 * of the validation checks.
	 */
	async function confirmAccountsExist(): Promise<boolean> {
		let checkedBalanceCount = 0;
		progress(`Verifying treasury and paying accounts ...`);
		const subitBalances = await getSourceAccountBalances(submitPayerId, 'Submit Payer Account');
		const transferBalances = await getSourceAccountBalances(transferPayerId, 'Transfer Payer Account');
		const treasuryBalances = await getSourceAccountBalances(tokenTreasuryId, 'Treasury Account');
		if (!subitBalances || !transferBalances || !treasuryBalances) {
			// No point in spending the time verifying recipients yet.
			return false;
		}
		const treasuryTokenBalanceAsLong = treasuryBalances.tokens.get(tokenId);
		if (!treasuryTokenBalanceAsLong) {
			preGenerationErrors.push(`Treasury Account ${tokenTreasuryId.toString()} does not hold the token ${tokenId.toString()}.`);
			return false;
		} else {
			tokenTreasuryBalance = new BigNumber(treasuryTokenBalanceAsLong.toString());
			tokenDecimals = treasuryBalances.tokenDecimals.get(tokenId);
		}
		distributions
			.filter((distribution) => tokenTreasuryId.equals(distribution.account))
			.forEach((distribution) => {
				preGenerationErrors.push(`Distribution account ${distribution.account} is the same address as the treasury.`);
			});
		await runClientsConcurrently(clients, distributions, getReceivingAccountBalance);
		progress('Done Retrieving Accounts Information.');
		return true;
		/**
		 * Queries the balances of all the identified accounts to ensure that they exist
		 * and receiving accounts are associated with the token.  Depending on the size
		 * of the distribution list, this may take some time.  Reports back intermediate
		 * progress for each distribution account examined. Multiple invocations of this
		 * method are run concurrently over multiple hedera node clients.  Annotates the
		 * record with the balance results.
		 *
		 * @param client The hedera network node client to use to make the query.
		 * @param distribution The individual distribution record to update.
		 * @returns A promise indicating the perceived health of the remote hedera node.
		 * Healthy indicates no throttling, if there appeared to be throttling,
		 * Throttling is returned.  If there are problematic performance issues, Unhealthy
		 * is returned, the calling coordinator will stop using the associated remote
		 * node for a period of time and rely on other more healthy nodes.
		 */
		async function getReceivingAccountBalance(client: CalaxyClient, distribution: Distribution): Promise<NodeHealth> {
			const { response, nodeHealth, error } = await client.executeQuery(() =>
				Promise.resolve(new AccountBalanceQuery().setAccountId(distribution.account)),
			);
			if (nodeHealth !== NodeHealth.Unhealthy) {
				if (error) {
					if (error instanceof StatusError && error.status === Status.InvalidAccountId) {
						preGenerationWarnings.push(`Receiving account at ${distribution.account.toString()} does not exist.`);
					} else {
						preGenerationWarnings.push(
							`${distribution.account.toString()} will be excluded from the distribution, Unable to verify it exists: ${
								error.message || error.toString()
							}`,
						);
					}
				} else {
					distribution.balances = response;
				}
				checkedBalanceCount = checkedBalanceCount + 1;
				progress(`Checking ${checkedBalanceCount} of ${distributions.length} distribution accounts.`);
			}
			return nodeHealth;
		}
		/**
		 * Retrieves the balances of the identified accounts.
		 *
		 * @param accountId Crypto account to query.
		 * @param description Description of the account for error reporting purposes (if required).
		 * @returns The account balance information queried from the hedera network.
		 */
		async function getSourceAccountBalances(accountId: AccountId, description: string): Promise<AccountBalance> {
			const { response, error } = await clients[0].executeQuery(() => Promise.resolve(new AccountBalanceQuery().setAccountId(accountId)));
			if (error) {
				if (error instanceof StatusError && error.status === Status.InvalidAccountId) {
					preGenerationErrors.push(`${description} at ${accountId.toString()} does not exist.`);
				} else {
					preGenerationErrors.push(`Unable to verify ${description} at ${accountId.toString()}: ${error.message || error.toString()}`);
				}
				return null;
			} else {
				return response;
			}
		}
	}
	/**
	 * Computes the sum of distribution payments for this run and compares the
	 * value with the treasury’s token balance.  If the treasury’s balance is
	 * insufficient to pay the sum of distributions, an error is added to the
	 * `preGenerationErrors` array.
	 */
	function verifyTreasuryTokenBalance() {
		progress(`Reviewing Distribution Amounts ...`);
		for (const distribution of distributions) {
			if (distribution.balances) {
				const tokenBalance = distribution.balances.tokens.get(tokenId);
				if (tokenBalance === null) {
					preGenerationWarnings.push(
						`Account ${distribution.account.toString()} does not appear to be associated with this token, if the account has not enabled auto-association, this distribuiton can fail.`,
					);
				}
				if (distribution.amount.decimalPlaces() > tokenDecimals) {
					preGenerationErrors.push(
						`Distribution account ${distribution.account.toString()} amount decimal places exceed token decimal places of ${tokenDecimals}.`,
					);
				} else {
					distribution.amountInTinyToken = distribution.amount.shiftedBy(tokenDecimals);
					totalTransfers = totalTransfers.plus(distribution.amountInTinyToken);
				}
			}
		}
		if (tokenTreasuryBalance.isLessThan(totalTransfers)) {
			preGenerationErrors.push(
				`Treasury Account ${tokenTreasuryId.toString()} does not hold a sufficient balance of ${tokenId.toString()} to complete the distribution.`,
			);
		}
		if (!distributions.find((d) => !!d.amountInTinyToken)) {
			preGenerationErrors.push(`Could not find any accounts in the list that are associated with token ${tokenId.toString()}.`);
		}
	}
}
/**
 * Process a planned distribution in its entirety, creating the necessary scheduled
 * payments on the hedera network and/or signing matching pre-existing scheduled
 * payments, potentially causing final execution of the scheduled distribution payments.
 *
 * This method runs many requests concurrently attempting to leverage as many active
 * healthy hedera nodes as possible to shorten the time of processing to increase
 * the chance of overall success when coordinating with other parties.
 *
 * @param progress A callback method receiving updates to individual distribution
 * payments as they are processed.
 *
 * @returns A finalized list of distribution payment status as this instance of the
 * app sees them and a list of any errors that may indicate one or more distribution
 * payments failed.
 */
export async function executeDistributionPlan(progress: (any) => void): Promise<any> {
	let schedulingInProgress = true;
	let paymentMonitor = null;
	let unknownCompletionStatus = [];
	executionGenerationErrors = [];
	payments = distributions
		.filter((distribution) => !!distribution.amountInTinyToken)
		.map((distribution, index) => {
			return {
				...distribution,
				index,
				status: 'Not Started',
			};
		});
	const summaryWorker = new Worker('./public/build/distribution-worker.js', {
		workerData: { payments: payments.map(castDistributionInfo) },
	});
	summaryWorker.on('message', progress);
	const clients = await getReachableClientList();
	if (clients.length === 0) {
		executionGenerationErrors.push('The Network Nodes appear to be too busy to process distributions at this time.');
	} else if (csvErrors.length > 0 || tokenInfoErrors.length > 0 || preGenerationErrors.length > 0) {
		executionGenerationErrors.push('There are errors with distribution plan that prevent execution.');
	} else {
		monitorPaymentsForCompletion();
		await runClientsConcurrently(clients, payments, processPayment);
	}
	clearTimeout(paymentMonitor);
	schedulingInProgress = false;
	await summaryWorker.terminate();
	return {
		errors: executionGenerationErrors,
		payments: payments.map(castDistributionInfo),
	};
	/**
	 * Process an individual distribution payment using a given hedera node.
	 * Multiple instances of this method are executed concurrently spanning
	 * multiple payment records and hedera nodes.  Each individual payment
	 * may be processed differently due to timing issues and actions of
	 * distribution attempts made by other treasury key holders.  The payment
	 * record is updated appropriately with receipts and errors.  The method
	 * also emits progress updates to the enclosed progress callback reference.
	 *
	 * @param client A single hedera node client for submitting transaction requests.
	 * @param payment The payment record information, this method adds properties to
	 * this object instance as processing progresses.
	 * @returns The perceived health of the client network node.  If processing
	 *  proceeded without network issues, this should be `Healthy`,  if
	 * processing succeeded but noticed throttling related response codes,
	 * `Throttled` should be returned.  If serious throttling or dropping of
	 * connections occurred `Unhealthy` should be returned and the calling
	 * orchestrator will not re-use this client node for a period of time.
	 */
	async function processPayment(client: CalaxyClient, payment: PaymentRecord): Promise<NodeHealth> {
		payment.inProgress = true;
		let paymentStage = PaymentStage.Scheduling;
		while (paymentStage !== PaymentStage.Finished) {
			updatePaymentStatusDescription();
			switch (paymentStage) {
				case PaymentStage.Scheduling:
					paymentStage = await schedulePayment();
					break;
				case PaymentStage.Countersigning:
					paymentStage = await countersignPayment();
					break;
				case PaymentStage.Confirming:
					paymentStage = await confirmPayment();
					break;
				case PaymentStage.Unhealthy:
					// Break out, leave inProgress=true
					// because it will be picked up by
					// the next healthy client.
					return NodeHealth.Unhealthy;
				case PaymentStage.Failed:
					paymentStage = PaymentStage.Finished;
					break;
			}
		}
		payment.inProgress = false;
		updatePaymentStatusDescription();
		return (
			payment.confirmationResult?.nodeHealth || payment.countersigningResult?.nodeHealth || payment.schedulingResult?.nodeHealth || NodeHealth.Healthy
		);
		/**
		 * Attempts to schedule a payment for this distribution on the hedera network.
		 *
		 * @returns The next action that should occur to the record, this depends on
		 * the codes returned from this attempt, it may be to countersign the payment
		 * if the schedule was already created, or to just look for an executed receipt.
		 * (or log an error if necessary).
		 */
		async function schedulePayment(): Promise<PaymentStage> {
			if (payment.schedulingResult?.receipt) {
				// this might be a re-do due to a dead node,
				// we don't want to submit duplicate transactions
				// if we know they were already executed with a
				// successful response code.
				switch (payment.schedulingResult.receipt.status) {
					case Status.Success:
						return PaymentStage.Confirming;
					case Status.IdenticalScheduleAlreadyCreated:
						return PaymentStage.Countersigning;
				}
			}
			const { receipt, nodeHealth, error } = (payment.schedulingResult = await client.executeTransaction(async (nodeIds) => {
				const transactionToSchedule = new TransferTransaction()
					.addTokenTransfer(tokenId, tokenTreasuryId, -payment.amountInTinyToken)
					.addTokenTransfer(tokenId, payment.account, +payment.amountInTinyToken);
				const transaction = new ScheduleCreateTransaction()
					.setPayerAccountId(transferPayerId)
					.setScheduledTransaction(transactionToSchedule)
					.setTransactionId(TransactionId.generate(submitPayerId))
					.setNodeAccountIds(nodeIds)
					.freeze();
				for (const signatory of signatories) {
					await transaction.sign(signatory);
				}
				return transaction;
			}));
			if (nodeHealth === NodeHealth.Unhealthy) {
				return PaymentStage.Unhealthy;
			} else if (receipt) {
				switch (receipt.status) {
					case Status.Success:
						return PaymentStage.Confirming;
					case Status.IdenticalScheduleAlreadyCreated:
						return PaymentStage.Countersigning;
					default:
						executionGenerationErrors.push(
							`Payment no. ${payment.index} to ${payment.account.toString()} scheduling failed with code ${receipt.status.toString()}.`,
						);
						return PaymentStage.Failed;
				}
			} else if (error) {
				if (error instanceof StatusError) {
					if (error.status === Status.DuplicateTransaction) {
						return PaymentStage.Scheduling;
					}
					executionGenerationErrors.push(
						`Payment no. ${payment.index} to ${payment.account.toString()} scheduling failed with code ${error.status.toString()}.`,
					);
					return PaymentStage.Failed;
				}
			}
			executionGenerationErrors.push(`Payment no. ${payment.index} to ${payment.account.toString()} scheduling failed for an unknown reason.`);
			return PaymentStage.Failed;
		}
		/**
		 * Attempts to counter sign a pre-existing scheduled payment for this
		 * distribution on the hedera network.
		 *
		 * @returns The next action that should occur to the record, this depends on
		 * the codes returned from this attempt, it could be to look for an executed
		 * receipt. (or log an error if necessary).
		 */
		async function countersignPayment(): Promise<PaymentStage> {
			if (payment.countersigningResult?.receipt) {
				// this might be a re-do due to a dead node,
				// we don't want to submit duplicate transactions
				// if we know they were already executed with a
				// successful response code.
				switch (payment.countersigningResult.receipt.status) {
					case Status.Success:
					case Status.ScheduleAlreadyExecuted:
					case Status.NoNewValidSignatures:
						return PaymentStage.Confirming;
					case Status.InvalidScheduleId:
						// Let's start over, something went
						// terribly wrong on the network.
						payment.schedulingResult = undefined;
						payment.countersigningResult = undefined;
						return PaymentStage.Scheduling;
				}
			}
			const { receipt, nodeHealth, error } = (payment.countersigningResult = await client.executeTransaction(async (nodeIds) => {
				const transaction = new ScheduleSignTransaction()
					.setScheduleId(payment.schedulingResult.receipt.scheduleId)
					.setTransactionId(TransactionId.generate(submitPayerId))
					.setNodeAccountIds(nodeIds)
					.freeze();
				for (const signatory of signatories) {
					await transaction.sign(signatory);
				}
				return transaction;
			}));
			if (nodeHealth === NodeHealth.Unhealthy) {
				return PaymentStage.Unhealthy;
			} else if (receipt) {
				switch (receipt.status) {
					case Status.Success:
					case Status.NoNewValidSignatures:
					case Status.ScheduleAlreadyExecuted:
						return PaymentStage.Confirming;
					case Status.InvalidScheduleId:
						// Let's start over, something went
						// terribly wrong on the network.
						payment.schedulingResult = undefined;
						payment.countersigningResult = undefined;
						return PaymentStage.Scheduling;
					default:
						executionGenerationErrors.push(
							`Payment no. ${payment.index} to ${payment.account.toString()} countersigning failed with code ${receipt.status.toString()}.`,
						);
						return PaymentStage.Failed;
				}
			} else if (error) {
				if (error instanceof StatusError) {
					if (error.status === Status.DuplicateTransaction) {
						return PaymentStage.Countersigning;
					}
					executionGenerationErrors.push(
						`Payment no. ${payment.index} to ${payment.account.toString()} countersigning failed with code ${error.status.toString()}.`,
					);
					return PaymentStage.Failed;
				}
			}
			executionGenerationErrors.push(`Payment no. ${payment.index} to ${payment.account.toString()} countersigning failed for an unknown reason.`);
			return PaymentStage.Failed;
		}
		/**
		 * Attempts to retrieve an executed receipt for the scheduled distribution,
		 * this receipt may not yet exist in the network, if it does not it will
		 * add the payment to a list to check later.
		 *
		 * @returns The next action that should occur to the record, this depends
		 * on the codes returned from this attempt, it could be to mark the
		 * process as complete or log an error if necessary.
		 */
		async function confirmPayment(): Promise<PaymentStage> {
			if (payment.confirmationResult?.response) {
				// this might be a re-do due to a dead node,
				// we don't want to submit duplicate queries
				// if we know they were already executed with a
				// successful response code.
				return PaymentStage.Finished;
			}
			const scheduledTxId = payment.schedulingResult.receipt.scheduledTransactionId;
			const { response, nodeHealth, error } = (payment.confirmationResult = await client.executeQuery((nodeIds) =>
				Promise.resolve(new TryGetTransactionReceiptQuery().setTransactionId(scheduledTxId).setNodeAccountIds(nodeIds)),
			));
			if (nodeHealth === NodeHealth.Unhealthy) {
				return PaymentStage.Unhealthy;
			} else if (response) {
				return PaymentStage.Finished;
			} else if (error) {
				if (error instanceof StatusError) {
					if (error.status === Status.ReceiptNotFound) {
						unknownCompletionStatus.push(payment);
						return PaymentStage.Finished;
					}
					executionGenerationErrors.push(
						`Payment no. ${payment.index} to ${payment.account.toString()} confirmation request failed with code ${error.status.toString()}.`,
					);
					return PaymentStage.Failed;
				}
			}
			executionGenerationErrors.push(
				`Payment no. ${payment.index} to ${payment.account.toString()} confirmation request failed for an unknown reason.`,
			);
			return PaymentStage.Failed;
		}
		/**
		 * Helper function that examines the current state of a payment record
		 * and determines a user-friendly text describing the current state of
		 * the process.  It then invokes the callback method indicating the
		 * updated status.
		 */
		function updatePaymentStatusDescription() {
			payment.status = statusToDescription();
			summaryWorker.postMessage({ payment: castDistributionInfo(payment) });
			function statusToDescription() {
				if (payment.confirmationResult) {
					const status = payment.confirmationResult.response?.status || (payment.confirmationResult.error as StatusError)?.status;
					switch (status) {
						case Status.Success:
							return 'Status: Distribution Completed';
						case undefined:
						case null:
						case Status.ReceiptNotFound:
							// Skip Status
							break;
						default:
							return `Status: ${status.toString()}`;
					}
				}
				if (payment.countersigningResult) {
					const status = payment.countersigningResult.receipt?.status || (payment.countersigningResult.error as StatusError)?.status;
					switch (status) {
						case Status.Success:
							return `Countersigning: Accepted by Network`;
						case Status.NoNewValidSignatures:
							return `Countersigning: Already Signed with these Key(s)`;
						case Status.ScheduleAlreadyExecuted:
							return `Countersigning: Already Completed`;
						case Status.DuplicateTransaction:
							return `Countersigning: Retrying Due to Tx Conflict`;
						case undefined:
						case null:
							return `Countersigning Failed: ${categorizeErrorMessage(payment.countersigningResult.error)}`;
						default:
							return `Countersigning Failed: ${status.toString()}`;
					}
				}
				if (payment.schedulingResult) {
					const status = payment.schedulingResult.receipt?.status || (payment.schedulingResult.error as StatusError)?.status;
					switch (status) {
						case Status.Success:
							return `Scheduling: Awaiting Add'l Signatures`;
						case Status.IdenticalScheduleAlreadyCreated:
							return `Scheduling: Distribution Already Started`;
						case Status.DuplicateTransaction:
							return `Scheduling: Retrying Due to Tx Conflict`;
						case undefined:
						case null:
							return `Scheduling Failed: ${categorizeErrorMessage(payment.schedulingResult.error)}`;
						default:
							return `Scheduling Failed: ${status.toString()}`;
					}
				}
				if (payment.inProgress) {
					return 'Scheduling';
				}
				return 'Not Started';
			}
			/**
			 * Catch-all method attempts to provide user-friendly descriptions of
			 * error conditions and codes.
			 * @param error the error object to examine.
			 * @returns a more user freindly description of the error.
			 */
			function categorizeErrorMessage(error) {
				if (error) {
					const message = error.message || error.toString();
					if (message.includes('RST_STREAM')) {
						return 'Network Node Reset the gRPC Connection';
					} else if (message.includes('UNAVAILABLE')) {
						return 'Network Node is not Responsibe';
					} else if (message.includes('TRANSACTION_EXPIRED')) {
						return 'Network Node is Throttled';
					}
					return error.message || error.constructor.name;
				}
				return 'Error without Exception';
			}
		}
	}
	/**
	 * Helper function that wakes up periodically and attempts to retrieve
	 * receipts for distribution payments which have not yet been confirmed
	 * to have been executed by asking for the receipt.
	 */
	async function monitorPaymentsForCompletion() {
		let nextRound = [];
		if (schedulingInProgress) {
			const inputs = unknownCompletionStatus;
			unknownCompletionStatus = [];
			await runClientsConcurrently(clients, inputs, checkPaymentForCompletion);
			for (const payment of nextRound) {
				unknownCompletionStatus.push(payment);
			}
			paymentMonitor = setTimeout(() => monitorPaymentsForCompletion(), 60000).unref();
		}
		/**
		 * Attempts to retrieve a receipt for a scheduled and potentially completed
		 * distribution payment.  Multiple instances of this method are invoked for
		 * various hedera nodes and payment records concurrently.
		 * @param client A single hedera node client for submitting transaction requests.
		 * @param payment The payment record information, this method adds properties to
		 * this object instance as processing progresses.
		 * @returns The perceived health of the client network node.  If processing
		 * proceeded without network issues, this should be `Healthy`,  if
		 * processing succeeded but noticed throttling related response codes,
		 * `Throttled` should be returned.  If serious throttling or dropping of
		 * connections occurred `Unhealthy` should be returned and the calling
		 * orchestrator will not re-use this client node for a period of time.
		 */
		async function checkPaymentForCompletion(client: CalaxyClient, payment: PaymentRecord): Promise<NodeHealth> {
			const scheduledTxId = payment.schedulingResult.receipt.scheduledTransactionId;
			const { response, nodeHealth } = (payment.confirmationResult = await client.executeQuery((nodeIds) =>
				Promise.resolve(new TryGetTransactionReceiptQuery().setTransactionId(scheduledTxId).setNodeAccountIds(nodeIds)),
			));
			if (response) {
				payment.status = response.status === Status.Success ? 'Status: Distribution Completed' : `Status: ${response.status.toString()}`;
				summaryWorker.postMessage({ payment: castDistributionInfo(payment) });
			} else {
				nextRound.push(payment);
			}
			return nodeHealth;
		}
	}
}
/**
 * Retrieves the final status of the latest distribution plan execution.
 *
 * @returns A finalized list of distribution payment status as this instance of the
 * app sees them and a list of any errors that may indicate one or more distribution
 * payments failed.
 */
export function getDistributionResults(): Promise<any> {
	return Promise.resolve({
		errors: executionGenerationErrors,
		payments: payments.map(castDistributionInfo),
	});
}
/**
 * Writes the final detailed results of a distribution plan
 * execution to an output CSV file.
 *
 * @param filePath full path to the output file to write to.
 * @returns promise that will resolve when writing the results
 * to the file has completed, or rejection if there is an error.
 */
export function saveDistributionResultsFile(filePath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const outputStream = fs.createWriteStream(filePath);
		outputStream.on('finish', resolve);
		outputStream.on('error', reject);
		const stringifier = stringify({ delimiter: ',' });
		stringifier.pipe(outputStream);
		stringifier.write([
			'Account',
			'Amount',
			'Distribution Id',
			'Scheduling Tx Id',
			'Scheduling Tx Status',
			'Countersigning Tx Id',
			'Countersigning Tx Status',
			'Scheduled Payment Tx Id',
			'Scheduled Payment Tx Status',
			'Status Description',
		]);
		for (const payment of payments) {
			const confirmationStatus = payment.confirmationResult?.response?.status || (payment.confirmationResult?.error as StatusError)?.status;
			const countersignStatus = payment.countersigningResult?.receipt?.status || (payment.countersigningResult?.error as StatusError)?.status;
			const schedulingStatus = payment.schedulingResult?.receipt?.status || (payment.schedulingResult?.error as StatusError)?.status;
			stringifier.write([
				payment.account.toString(),
				payment.amountInTinyToken.shiftedBy(-tokenDecimals).toString(),
				payment.schedulingResult?.receipt?.scheduleId?.toString() || 'n/a',
				payment.schedulingResult?.transactionId?.toString() || 'n/a',
				schedulingStatus?.toString() || 'n/a',
				payment.countersigningResult?.transactionId?.toString() || 'n/a',
				countersignStatus?.toString() || 'n/a',
				payment.schedulingResult?.receipt?.scheduledTransactionId?.toString() || 'n/a',
				confirmationStatus?.toString() || 'n/a',
				payment.status,
			]);
		}
		stringifier.end();
	});
}

/**
 * Returns the distribution module internal memory
 * state to uninitialized.
 */
export function resetDistribution(): void {
	csvFilename = undefined;
	csvRows = undefined;
	csvColumns = undefined;
	csvDecimals = undefined;
	csvRawData = undefined;
	csvErrors = undefined;
	distributions = undefined;
	networkId = undefined;
	tokenId = undefined;
	tokenTreasuryId = undefined;
	submitPayerId = undefined;
	transferPayerId = undefined;
	signatories = undefined;
	tokenInfoErrors = undefined;
	preGenerationErrors = undefined;
	preGenerationWarnings = undefined;
	tokenDecimals = undefined;
	tokenTreasuryBalance = undefined;
	totalTransfers = undefined;
	executionGenerationErrors = undefined;
	payments = undefined;
}
/**
 * Helper function that projects the detailed distribution payment
 * object into a form that can be marshaled over IPC to the user interface.
 * @param info The original payment record information.
 * @returns An IPC friendly projection of the payment record information.
 */
function castDistributionInfo(info: PaymentRecord) {
	return {
		index: info.index,
		account: info.account.toString(),
		amount: info.amountInTinyToken.shiftedBy(-tokenDecimals).toString(),
		status: info.status,
		schedulingTx: info.schedulingResult?.transactionId?.toString(),
		scheduledTx: info.schedulingResult?.receipt?.scheduledTransactionId?.toString(),
		scheduleId: info.schedulingResult?.receipt?.scheduleId?.toString(),
		paymentStatus: info.confirmationResult?.response?.status?.toString(),
		inProgress: !!info.inProgress,
	};
}
/**
 * Helper function that retrieves a list of `CalaxyClient` nodes that are
 * presently appear to be reachable and responsive.  The algorithm attempts
 * to pick nodes that return within 250ms, if 2/3 of the network is not
 * responsive enough, it will retry with a longer wait period, up to a test
 * limit of 3 seconds.  It is possible that no nodes respond in a reasonable
 * time resulting in an empty array.
 *
 * @returns the list of the fastest responding hedera nodes for the selected
 * network, or an empty array if no nodes respond in the alloted timeout of
 * three seconds.
 */
async function getReachableClientList(): Promise<CalaxyClient[]> {
	let clients: CalaxyClient[] = [];
	const candidates = networkId === NetworkId.Main ? CalaxyClient.forMainnet() : CalaxyClient.forTestnet();
	const targetCount = Math.max((2 * candidates.length) / 3, 1);
	for (let i = 1; i < 13 && clients.length < targetCount; i++) {
		clients = await CalaxyClient.filterByPing(candidates, i * 250);
	}
	return clients;
}
