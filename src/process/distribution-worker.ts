import { parentPort, workerData } from 'worker_threads';
import type { DistributionResult } from '../common/primitives';
import { PaymentStage, PaymentStep } from '../common/primitives';
/**
 * WebWorker helper module that moves the cpu bound
 * summary algorithm off the user interface thread.
 */
let payments = workerData.payments as DistributionResult[];
let pendingUpdate = null;
let percent = 0;
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
		payments = data.payments as DistributionResult[];
	}
	if (data.payment && payments[data.payment.index]) {
		payments[data.payment.index] = data.payment as DistributionResult;
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
	let stageCounts = {};
	let stepCounts = {};
	for (const item of payments) {
		const stageKey = item.stage;
		stageCounts[stageKey] = (stageCounts[stageKey] || 0) + 1;
	}
	const inProgress = payments.filter((d) => d.stage === PaymentStage.Processing);
	for (const item of inProgress) {
		const stepKey = item.step;
		stepCounts[stepKey] = (stepCounts[stepKey] || 0) + 1;
	}
	const finishedCount = payments.length - (stageCounts[PaymentStage.NotStarted] || 0) - inProgress.length;
	const transientPercent = Math.min(99.9, payments.length > 0 ? (100 * finishedCount) / payments.length : 0);
	// Due to an artifact that "scheduled" can temporarily
	// be added back to processing to see if its been
	// "completed".  The percentage should not go backwards
	percent = Math.max(transientPercent, percent);
	const percentDisplay = percent > 10 ? percent.toFixed(1) : percent > 1 ? percent.toFixed(2) : percent.toFixed(3);
	const statusMessage = `Scheduling Payments, ${percentDisplay}% complete.`;
	pendingUpdate = null;
	parentPort.postMessage({
		statusMessage,
		notStartedCount: stageCounts[PaymentStage.NotStarted] || 0,
		processingCount: stageCounts[PaymentStage.Processing] || 0,
		scheduledCount: stageCounts[PaymentStage.Scheduled] || 0,
		completedCount: stageCounts[PaymentStage.Completed] || 0,
		failedCount: stageCounts[PaymentStage.Failed] || 0,
		schedulingCount: stepCounts[PaymentStep.Scheduling] || 0,
		countersigningCount: stepCounts[PaymentStep.Countersigning] || 0,
		confirmingCount: stepCounts[PaymentStep.Confirming] || 0,
		payments: inProgress,
	});
}
export {};
