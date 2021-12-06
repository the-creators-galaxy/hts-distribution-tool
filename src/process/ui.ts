import { BrowserWindow, dialog } from 'electron';
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
	return !result.canceled && result.filePaths.length == 1
		? result.filePaths[0]
		: null;
}
