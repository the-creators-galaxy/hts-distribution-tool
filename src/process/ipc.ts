import { ipcMain, IpcMainEvent } from 'electron';
import type { IpcAsyncMessageRequest } from '../common/ipc';
import {
	executeDistributionPlan,
	generateDistributionPlan,
	getDistributionFileSummary,
	getDistributionResults,
	getTreasuryInformation,
	loadDistributionFile,
	saveDistributionResultsFile,
	setTreasuryInformation,
} from './distribution';
import { validatePrivateKey } from './keys';
import {
	getAppVersion,
	openAddressExplorer,
	openScheduledTransactionExplorer,
	openTransactionExplorer,
	queryUserForCsvFile,
	queryUserForOutputFile,
} from './ui';
/**
 * The registry of supported/whitelisted methods executing in the
 * node process thread that can be invoked from the Electron User
 * Interface Web environment.
 */
const methods: { [key: string]: (...args: any[]) => Promise<any> } = {
	'query-user-for-csv-file': queryUserForCsvFile,
	'load-distribution-file': loadDistributionFile,
	'get-distribution-file-summary': getDistributionFileSummary,
	'get-treasury-information': getTreasuryInformation,
	'set-treasury-information': setTreasuryInformation,
	'validate-private-key': validatePrivateKey,
	'generate-distribution-plan': generateDistributionPlan,
	'execute-distribution-plan': executeDistributionPlan,
	'get-distribution-results': getDistributionResults,
	'query-user-for-output-file': queryUserForOutputFile,
	'save-results-output-file': saveDistributionResultsFile,
	'get-app-version': getAppVersion,
	'open-address-explorer': openAddressExplorer,
	'open-transaction-explorer': openTransactionExplorer,
	'open-scheduled-transaction-explorer': openScheduledTransactionExplorer,
};
/**
 * The single IPC entry point used by the Electron User Interface
 * thread for invoking node process bound methods.  This method
 * cooperates with a paired method in the user interface thread
 * for marshaling arguments, callbacks and results over the IPC
 * interface using the `ipc-invoke-async` channel plus others.
 *
 * @param event Inbound IPC event containing the details
 * regarding a requested method invocation.
 *
 * @param request The method arguments associated with the IPC
 * event identifying the remote method to invoke, and the channel
 * ID to use for returning results to the user interface thread.
 */
function invoke(event: IpcMainEvent, request: IpcAsyncMessageRequest): void {
	const method = methods[request.method];
	if (method) {
		if (request.progress) {
			request.args.push((progress) => event.reply(request.id, { progress }));
		}
		method(...request.args).then(
			(value) => {
				event.reply(request.id, { value });
			},
			(reason) => {
				event.reply(request.id, { reason });
			},
		);
	} else {
		event.reply(request.id, { reason: 'Method not found.' });
	}
}
/**
 * Bind the invoke method to the agreed upon inbound channel id
 * of `ipc-invoke-async`.
 */
ipcMain.on('ipc-invoke-async', invoke);
