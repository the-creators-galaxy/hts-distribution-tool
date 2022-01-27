import * as https from 'https';
import { AccountId, ScheduleId, TransactionId } from '@hashgraph/sdk';
import electron, { app, BrowserWindow, dialog } from 'electron';
import { homedir } from 'os';
import { NetworkId } from '../common/primitives';
import { getNetworkId } from './distribution';
/**
 * Displays a native file open dialog box for “csv” files to the user.
 * If the user selects a file (that must already exist) the method returns
 * the full path to the file, otherwise null.
 *
 * @returns The full path to the user selected file, or null if the user
 * canceled the file open process.
 */
export async function queryUserForCsvFile(): Promise<string> {
	const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
		title: 'Open Distribution CSV File',
		defaultPath: homedir(),
		filters: [
			{ name: 'CSV', extensions: ['csv'] },
			{ name: 'All Files', extensions: ['*'] },
		],
		properties: ['openFile'],
	});
	return !result.canceled && result.filePaths.length == 1 ? result.filePaths[0] : null;
}
/**
 * Displays a native file save dialog for the output “csv” file to the user.
 * If the user chooses to save a file (with prompt for overwrite if applicable)
 * the method returns the full path to the file, otherwise null.
 *
 * @returns The full path to the file to save, or null if the user
 * canceled the file save process.
 */
export async function queryUserForOutputFile(): Promise<string> {
	const result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
		title: 'Save Distribution Results CSV File',
		defaultPath: homedir(),
		filters: [
			{ name: 'CSV', extensions: ['csv'] },
			{ name: 'All Files', extensions: ['*'] },
		],
		properties: ['showOverwriteConfirmation'],
	});
	return !result.canceled ? result.filePath : null;
}
/**
 * Gets current application version string returned from
 * the electron app object, this typically matches what is found
 * in the package.json file.
 *
 * @returns the current application version string.
 */
export async function getAppVersion(): Promise<string> {
	return Promise.resolve(app.getVersion());
}
/**
 * Launches the operating system's default browser with
 * a URL crafted to display information for the targeted
 * account or schedule ID.   Current Implementation points
 * to Kabuto Hashgraph Explorer V.2.
 *
 * @param accountId string representation of the account or
 * schedule ID to explore.
 */
export async function openAddressExplorer(accountId: string) {
	try {
		const account = AccountId.fromString(accountId);
		const url =
			getNetworkId() === NetworkId.Test
				? `https://v2.explorer.kabuto.sh/id/${account.toString()}?network=testnet`
				: `https://v2.explorer.kabuto.sh/id/${account.toString()}`;
		electron.shell.openExternal(url);
	} catch (err) {
		throw new Error('Invalid Account Id');
	}
}
/**
 * Launches the operating system's default browser with a URL crafted
 * to display information for the identified transaction.  Currenetly only
 * works with non-scheduled and non-nonce transaction IDs.  Implementation
 * points to Kabuto Hashgraph Explorer V.2.
 *
 * @param transactionId the transaction id in the standard id@sec.nano format.
 */
export async function openTransactionExplorer(transactionId: string) {
	try {
		const transaction = TransactionId.fromString(transactionId);
		const url =
			getNetworkId() === NetworkId.Test
				? `https://v2.explorer.kabuto.sh/transaction/${transaction.toString()}?network=testnet`
				: `https://v2.explorer.kabuto.sh/transaction/${transaction.toString()}`;
		electron.shell.openExternal(url);
	} catch (err) {
		throw new Error('Invalid Account Id');
	}
}
/**
 * Attempts to launch the operating system's default browser with a URL crafted
 * to display information for the transaction that was executed by the given
 * schedule.  If the scheduled transaction has not yet been executed, the URL
 * will point to information for the scheduled transaction (by ID) itself.
 * Current implemenation points to Kabuto Hashgraph Explorer V.2.
 *
 * @param scheduleId the schedule ID to attempt to find the executed scheduled
 * transaction.
 */
export async function openScheduledTransactionExplorer(scheduleId: string) {
	const schedule = ScheduleId.fromString(scheduleId);
	const scheduleIdAsString = schedule.toString();
	try {
		const url =
			getNetworkId() === NetworkId.Test
				? `https://v2.api.testnet.kabuto.sh/transaction?filter[entityId]=${scheduleIdAsString}`
				: `https://v2.api.kabuto.sh/transaction?filter[entityId]=${scheduleIdAsString}`;
		const transactions = await httpsGetJson(url);
		if (transactions) {
			const txHash = transactions.find((tx) => tx['viaScheduleId'] === scheduleIdAsString)?.hash;
			if (txHash) {
				const txUrl =
					getNetworkId() === NetworkId.Test
						? `https://v2.explorer.kabuto.sh/transaction/${txHash}?network=testnet`
						: `https://v2.explorer.kabuto.sh/transaction/${txHash}`;
				electron.shell.openExternal(txUrl);
				return;
			}
		}
	}
	catch (fetchError) {		
		console.error(fetchError);
	}
	// If not discovered, navigate to the schedule page instead.
	await openAddressExplorer(scheduleIdAsString);
}
/**
 * Helper function to fetch a JSON object from the
 * Kabuto Exploer API.  It assumes the returned JSON
 * payload has a property "data".  If the property is
 * found, it is returned, otherwise null is returned
 * (or an error if the request failes due to other reasons)
 *
 * @param url url to fetch from the API.
 *
 * @returns an object literal parsed from the JSON
 * payload returned from the server if found, otherwise
 * the value `null`.
 */
function httpsGetJson(url: string): Promise<any> {
	return new Promise((resolve, reject) => {
		https
			.get(url, (resp) => {
				let data = '';
				resp.on('data', (chunk) => {
					data += chunk;
				});
				resp.on('end', () => {
					try {
						var rawData = JSON.parse(data);
						resolve(rawData.data ? rawData.data : null);
					} catch (err) {
						reject(err);
					}
					resolve(JSON.parse(data));
				});
			})
			.on('error', reject);
	});
}
