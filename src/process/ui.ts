import { app, BrowserWindow, dialog } from 'electron';
import { homedir } from 'os';
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
