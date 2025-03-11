import { AccountId, ScheduleId } from '@hashgraph/sdk';
import electron, { app, BrowserWindow, dialog } from 'electron';
import { homedir } from 'os';
import { ExplorerId, NetworkId } from '../common/primitives';
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
 * account ID
 *
 * @param accountId string representation of the account ID to explore.
 * @param explorerId the explorer identifier.
 */
export async function openAccountExplorer(accountId: string, explorerId: ExplorerId) {
	try {
		const account = AccountId.fromString(accountId);
		if (explorerId === ExplorerId.HashScan) {
			const url =
				getNetworkId() === NetworkId.Test
					? `https://hashscan.io/#/testnet/account/${account.toString()}`
					: `https://hashscan.io/#/mainnet/account/${account.toString()}`;
			electron.shell.openExternal(url);
		} else {
			const url =
				getNetworkId() === NetworkId.Test
					? `https://testnet.dragonglass.me/hedera/accounts/${account.toString()}`
					: `https://app.dragonglass.me/hedera/accounts/${account.toString()}`;
			electron.shell.openExternal(url);
		}
	} catch (err) {
		throw new Error('Invalid Account Id');
	}
}
/**
 * Launches the operating system's default browser with
 * a URL crafted to display information for the targeted
 * schedule ID
 *
 * @param scheduleId string representation of the schedule ID to explore.
 */
export async function openScheduleExplorer(scheduleId: string) {
	try {
		const schedule = ScheduleId.fromString(scheduleId);
		const url =
			getNetworkId() === NetworkId.Test
				? `https://testnet.dragonglass.me/hedera/search?q=${schedule.toString()}`
				: `https://app.dragonglass.me/hedera/search?q=${schedule.toString()}`;
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
 * @param txId the transaction id structure.
 * @param explorerId the explorer identifier.
 */
export async function openTransactionExplorer(txId: any, explorerId: ExplorerId) {
	try {
		if (explorerId === ExplorerId.HashScan) {
			const transactionId = `${txId.accountId}-${txId.seconds.toFixed(0)}-${txId.nanos.toFixed(0).padStart(9, '0')}`;
			const url =
				getNetworkId() === NetworkId.Test
					? `https://hashscan.io/#/testnet/transaction/${transactionId}`
					: `https://hashscan.io/#/mainnet/transaction/${transactionId}`;
			electron.shell.openExternal(url);
		} else {
			const [shard, realm, num] = txId.accountId.split('.');
			const transactionId = `${shard}${realm}${num}${txId.seconds.toFixed(0)}${txId.nanos.toFixed(0).padStart(9, '0')}`;
			const url =
				getNetworkId() === NetworkId.Test
					? `https://testnet.dragonglass.me/hedera/transactions/${transactionId}`
					: `https://app.dragonglass.me/hedera/transactions/${transactionId}`;
			electron.shell.openExternal(url);
		}
	} catch (err) {
		throw new Error('Invalid Account Id');
	}
}
