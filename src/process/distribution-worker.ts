import { parentPort, workerData } from 'worker_threads';
/**
 * WebWorker helper module that moves the cpu bound
 * summary algorithm off the user interface thread.
 */
let payments = workerData.payments;
let pendingUpdate = null;
parentPort.on('message', handleProgressUpdate);
generateSummary();
/**
 * Processes the detailed messages form the distribution plan,
 * placing the information in their respective holding fields.
 *
 * @param {data} the data message from the processing algorithm.
 */
function handleProgressUpdate(data) {
	if (data.payments) {
		payments = data.payments;
	}
	if (data.payment && payments[data.payment.index]) {
		payments[data.payment.index] = data.payment;
	}
	if (!pendingUpdate) {
		pendingUpdate = setTimeout(generateSummary, 1000);
	}
}
/**
 * Evaluates the existing current detailed state of the
 * distribution process summarizing the results and
 * posts a summary message to the channel.
 */
function generateSummary() {
	let notStartedCount = 0;
	let schedulingCount = 0;
	let confirmingCount = 0;
	let completedCount = 0;
	let summary = {};
	for (const item of payments) {
		const key = item.status;
		if (key) {
			summary[key] = (summary[key] || 0) + 1;
		}
		if (item.inProgress) {
			if (item.scheduleId) {
				confirmingCount = confirmingCount + 1;
			} else {
				schedulingCount = schedulingCount + 1;
			}
		} else {
			if (item.scheduleId) {
				completedCount = completedCount + 1;
			} else {
				notStartedCount = notStartedCount + 1;
			}
		}
	}
	const inProgressPayments = payments.filter((p) => p.inProgress);
	const percent = Math.min(99.9, payments.length > 0 ? (100 * completedCount) / payments.length : 0);
	const percentDisplay = percent > 10 ? percent.toFixed(1) : percent > 1 ? percent.toFixed(2) : percent.toFixed(3);
	const statusMessage = `Scheduling Payments, ${percentDisplay}% complete.`;
	pendingUpdate = null;
	parentPort.postMessage({
		statusMessage,
		summary,
		payments: inProgressPayments,
		notStartedCount,
		schedulingCount,
		confirmingCount,
		completedCount,
	});
}
export {};
