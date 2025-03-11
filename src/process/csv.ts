import { createReadStream, existsSync } from 'fs';
import { parse } from 'csv-parse';
import { AccountId } from '@hashgraph/sdk';
import { BigNumber } from 'bignumber.js';
import type { CsvParseError } from '../common/primitives';
/**
 * Represents a distribution request, including some balance metadata if it can be found.
 */
export interface Distribution {
	/**
	 * The crypto account receiving the distribution.
	 */
	account: AccountId;
	/**
	 * The requested amount in token large denomination.
	 */
	amount: BigNumber;
	/**
	 * The requested amount in the smallest token denomination.
	 */
	amountInTinyToken?: BigNumber;
	/**
	 * The current account balance for the crypto account
	 * retrieved from the hedera network.
	 */
	tokenBalance?: Number;
}
/**
 * Summary results from parsing the original distribution CSV file.
 */
export interface CsvParseData {
	/**
	 * The full path to the original distribution CSV file.
	 */
	filename: string;
	/**
	 * Number of rows observed in distribution csv file.
	 */
	rows: number;
	/**
	 * Number of columns observed in the distribution csv file.
	 */
	columns: number;
	/**
	 * The maximum number of decimals observed in the distribution
	 * CSV file for all of the distributions.  This is to be
	 * cross-referenced with the token info to ensure valid decimal
	 * places in the CSV file.
	 */
	decimals: number;
	/**
	 * The curated list of potential distributions to process that were
	 * successfully extracted from the CSV file.  Invalid entries will
	 * not be visible here, but there is no guarantee in this list that
	 * the accounts exist nor that they are associated with the token
	 * to be distributed.
	 */
	transfers: Distribution[];
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
 * Loads, parses and validates the contents of a distribution CSV file.
 *
 * @param filename Full path to the distribution file to load.
 * @returns Summary results from loading and parsing the file,
 * including errors.
 */
export async function loadAndParseCsvDistributionFile(filename: string): Promise<CsvParseData> {
	let data = [];
	let columns = 2;
	let rows = 0;
	let transfers = [];
	let errors = [];
	let decimals = 0;
	if (!existsSync(filename)) {
		errors.push({ description: `File '${filename}' not found.` });
	} else {
		try {
			const parser = createReadStream(filename).pipe(
				parse({
					bom: true,
					trim: true,
					relax_column_count: true,
					onRecord: (items, info) => {
						rows = rows + 1;
						if (info.error && info.error.code !== 'CSV_RECORD_INCONSISTENT_FIELDS_LENGTH') {
							errors.push({
								line: rows,
								column: 0,
								description: info.error.message,
							});
							return items;
						}
						while (items.length > 0 && items[items.length - 1] === '') {
							items.pop();
						}
						if (items.length === 0) {
							return items;
						}
						if (items[0].length > 0 && items[0][0] == '#') {
							return [items.join(' ').trim()];
						}
						if (items.length < 2) {
							errors.push({
								line: rows,
								column: 1,
								description: 'Expected to find Crypto Address in column 1 and distribution amount in column 2.',
							});
							return items;
						}
						columns = Math.max(columns, items.length);
						const column0 = items[0];
						if (column0 === null || column0 === undefined || column0.trim() === '') {
							errors.push({
								line: rows,
								column: 1,
								description: `Account Id is missing.`,
							});
							return items;
						}
						if (!/^\d+\.\d+\.\d+$/.test(column0)) {
							errors.push({
								line: rows,
								column: 1,
								description: `Unable to parse Account ID: ${column0} is not a valid address id.`,
							});
							return items;
						}
						let account: AccountId;
						try {
							account = AccountId.fromString(column0);
						} catch (err) {
							errors.push({
								line: rows,
								column: 1,
								description: `Unable to parse Account ID: ${(err as Error).message || err}`,
							});
							return items;
						}
						let amount: BigNumber;
						try {
							amount = new BigNumber(items[1], 10);
							if (amount.isNaN()) {
								errors.push({
									line: rows,
									column: 2,
									description: `Unable to parse '${items[1]}' as an amount of distribution.`,
								});
								return items;
							} else if (amount.isNegative() || amount.isZero()) {
								errors.push({
									line: rows,
									column: 2,
									description: `Amount of distribution must be a value greater than zero.`,
								});
								return items;
							}
							decimals = Math.max(amount.decimalPlaces(), decimals);
						} catch (err) {
							errors.push({
								line: rows,
								column: 2,
								description: `Unable to parse amount of distribution: ${(err as Error).message || err}`,
							});
							return items;
						}
						transfers.push({ account, amount });
						return items;
					},
				}),
			);
			for await (const record of parser) {
				data.push(record);
			}
		} catch (error) {
			errors.push({ line: 0, column: 0, description: `${error}` });
		}
		transfers.sort(compareTransfers);
	}
	return { filename, rows, columns, decimals, transfers, data, errors };
}
/**
 * Helper compare function for sorting distribution transfers.
 * The order sorts by account number first, then transfer amount.
 *
 * @param xfer1 lhs transfer info
 * @param xfer2 rhs transfer info
 * @returns negative number if lhs < rhs, postitive number if lhs > rhs
 * otherwise zero.
 */
function compareTransfers(xfer1, xfer2) {
	return compareAddresses(xfer1.account, xfer2.account) || compareBigNumber(xfer1.amount, xfer2.amount);
}
/**
 * Helper compare function for sorting address id’s by shard, realm and number.
 *
 * @param account1 lhs account id
 * @param account2 rhs acocunt id
 * @returns negative number if lhs < rhs, postitive number if lhs > rhs
 * otherwise zero.
 */
function compareAddresses(account1: AccountId, account2: AccountId) {
	return account1.shard.compare(account2.shard) || account1.realm.compare(account2.realm) || account1.num.compare(account2.num);
}
/**
 * Helper compare function for sorting amount by value.
 *
 * @param num1 lhs amount value
 * @param num2 rhs amount value
 * @returns negative number if lhs < rhs, postitive number if lhs > rhs
 * otherwise zero.
 */
function compareBigNumber(num1: BigNumber, num2: BigNumber) {
	return num1.comparedTo(num2);
}
