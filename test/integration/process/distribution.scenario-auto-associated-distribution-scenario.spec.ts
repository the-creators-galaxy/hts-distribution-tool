import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'csv-parse';
import { expect } from 'chai';
import 'mocha';
import { createDistributionScenario, privateKeytoSignatory, recoverFunds } from '../facets/scenarios.facets';
import {
	executeDistributionPlan,
	generateDistributionPlan,
	getDistributionFileSummary,
	getDistributionResults,
	loadDistributionFile,
	resetDistribution,
	saveDistributionResultsFile,
	setTreasuryInformation,
} from '../../../src/process/distribution';
import { NetworkId, PaymentStage } from '../../../src/common/primitives';
import { payer, payerPrivateKey } from '../facets/environment.facets';

describe('fully auto-associated distribution scenario', function () {
	this.timeout(0);
	let facet: any;
	before(async function () {
		facet = await createDistributionScenario(0, 5, 0);
	});
	after(async function () {
		await recoverFunds(facet.treasuryInfo);
		await recoverFunds(facet.distributionPayerInfo);
	});
	describe('normal execution with separate scheduler', function () {
		describe('distribution pass one', function () {
			let distSummary;
			let planSummary;
			let planResult;
			let finalResult;
			let outputFile;
			before(async function () {
				resetDistribution();
				await loadDistributionFile(facet.distributionFilePath);
				distSummary = await getDistributionFileSummary();
				await setTreasuryInformation({
					networkId: NetworkId.Test,
					token: facet.tokenInfo.receipt.tokenId.toString(),
					submitPayer: payer.toString(),
					transferPayer: facet.distributionPayerInfo.receipt.accountId.toString(),
					tokenTreasury: facet.treasuryInfo.receipt.accountId.toString(),
					submitPayerSignatories: [privateKeytoSignatory(payerPrivateKey)],
					transferPayerSignatories: [privateKeytoSignatory(facet.distributionPayerInfo.privateKeys[0])],
					treasurySignatories: [privateKeytoSignatory(facet.treasuryInfo.privateKeys[1])],
				});
				planSummary = await generateDistributionPlan(() => {});
				planResult = await executeDistributionPlan(() => {});
				finalResult = await getDistributionResults();
				outputFile = path.join(path.dirname(facet.distributionFilePath), 'pass-one-results.csv');
				await saveDistributionResultsFile(outputFile);
			});
			it('results were returned', function () {
				expect(distSummary).to.exist;
				expect(planSummary).to.exist;
				expect(planResult).to.exist;
				expect(finalResult).to.exist;
			});
			it('no errors were produced', function () {
				expect(distSummary.errors).to.be.empty;
				expect(planSummary.errors).to.be.empty;
				expect(planResult.errors).to.be.empty;
				expect(finalResult.errors).to.be.empty;
			});
			it('warnings were produced', function () {
				expect(planSummary.warnings).lengthOf(5);
				for (let i = 0; i < planSummary.warnings.length; i++) {
					expect(planSummary.warnings[i]).to.contain(
						'does not appear to be associated with this token, if the account has not enabled auto-association, this distribuiton can fail.',
					);
				}
			});
			it('distribution parsing was valid', function () {
				expect(distSummary.decimals).to.equal(2);
				expect(distSummary.transfers).lengthOf(facet.accountsInfo.length);
			});
			it('distribution plan is valid', function () {
				expect(planSummary.decimals).to.equal(2);
				expect(planSummary.transfers).lengthOf(facet.accountsInfo.length);
			});
			it('distribution result is valid', function () {
				expect(finalResult.payments).lengthOf(facet.accountsInfo.length);
				for (let i = 0; i < facet.accountsInfo.length; i++) {
					const accountInfo = facet.accountsInfo[i];
					const payment = finalResult.payments[i];
					expect(payment.index).to.equal(i);
					expect(payment.account).to.equal(accountInfo.receipt.accountId.toString());
					expect(payment.stage).to.equal(PaymentStage.Scheduled);
					expect(payment).has.property('schedulingTx');
					expect(payment).has.property('scheduledTx');
					expect(payment).has.property('scheduleId');
				}
			});
			it('creates an output file with expected contents', async function () {
				expect(fs.existsSync(outputFile)).to.be.true;
				let count = 0;
				const stream = fs.createReadStream(outputFile).pipe(parse());
				for await (const record of stream) {
					if (count === 0) {
						expect(record[0]).to.equal('Account');
						expect(record[1]).to.equal('Amount');
						expect(record[2]).to.equal('Distribution Id');
						expect(record[3]).to.equal('Scheduling Tx Id');
						expect(record[4]).to.equal('Scheduling Tx Status');
						expect(record[5]).to.equal('Countersigning Tx Id');
						expect(record[6]).to.equal('Countersigning Tx Status');
						expect(record[7]).to.equal('Scheduled Payment Tx Id');
						expect(record[8]).to.equal('Scheduled Payment Tx Status');
						expect(record[9]).to.equal('Status Description');
						expect(record[10]).to.equal('Started');
						expect(record[11]).to.equal('Scheduled');
						expect(record[12]).to.equal('Countersigned');
						expect(record[13]).to.equal('Finished');
					} else {
						const payment = finalResult.payments[count - 1];
						expect(record[0]).to.equal(payment.account);
						expect(record[1]).to.equal(payment.amount);
						expect(record[2]).to.not.be.empty;
						expect(record[3]).to.not.be.empty;
						expect(record[4]).to.equal('SUCCESS');
						expect(record[5]).to.equal('n/a');
						expect(record[6]).to.equal('n/a');
						expect(record[7]).to.not.be.empty;
						expect(record[8]).to.equal('RECEIPT_NOT_FOUND');
						expect(record[9]).to.equal('Scheduled');
						expect(record[10]).to.not.be.empty;
						expect(record[11]).to.not.be.empty;
						expect(record[12]).to.equal('n/a');
						expect(record[13]).to.not.be.empty;
					}
					count = count + 1;
				}
				// Should have read as many records as transfers exist
				// plus the header in the CSV file.
				expect(count).to.equal(planSummary.transfers.length + 1);
			});
		});
		describe('distribution pass two', function () {
			let distSummary;
			let planSummary;
			let planResult;
			let finalResult;
			let outputFile;
			before(async function () {
				resetDistribution();
				await loadDistributionFile(facet.distributionFilePath);
				distSummary = await getDistributionFileSummary();
				await setTreasuryInformation({
					networkId: NetworkId.Test,
					token: facet.tokenInfo.receipt.tokenId.toString(),
					submitPayer: payer.toString(),
					transferPayer: facet.distributionPayerInfo.receipt.accountId.toString(),
					tokenTreasury: facet.treasuryInfo.receipt.accountId.toString(),
					submitPayerSignatories: [privateKeytoSignatory(payerPrivateKey)],
					transferPayerSignatories: [],
					treasurySignatories: [privateKeytoSignatory(facet.treasuryInfo.privateKeys[0])],
				});
				planSummary = await generateDistributionPlan(() => {});
				planResult = await executeDistributionPlan(() => {});
				finalResult = await getDistributionResults();
				outputFile = path.join(path.dirname(facet.distributionFilePath), 'pass-two-results.csv');
				await saveDistributionResultsFile(outputFile);
			});
			it('results were returned', function () {
				expect(distSummary).to.exist;
				expect(planSummary).to.exist;
				expect(planResult).to.exist;
				expect(finalResult).to.exist;
			});
			it('no errors were produced', function () {
				expect(distSummary.errors).to.be.empty;
				expect(planSummary.errors).to.be.empty;
				expect(planResult.errors).to.be.empty;
				expect(finalResult.errors).to.be.empty;
			});
			it('warnings were produced', function () {
				expect(planSummary.warnings).lengthOf(5);
				for (let i = 0; i < planSummary.warnings.length; i++) {
					expect(planSummary.warnings[i]).to.contain(
						'does not appear to be associated with this token, if the account has not enabled auto-association, this distribuiton can fail.',
					);
				}
			});
			it('distribution parsing was valid', function () {
				expect(distSummary.decimals).to.equal(2);
				expect(distSummary.transfers).lengthOf(facet.accountsInfo.length);
			});
			it('distribution plan is valid', function () {
				expect(planSummary.decimals).to.equal(2);
				expect(planSummary.transfers).lengthOf(facet.accountsInfo.length);
			});
			it('distribution result is valid', function () {
				expect(finalResult.payments).lengthOf(facet.accountsInfo.length);
				for (let i = 0; i < facet.accountsInfo.length; i++) {
					const accountInfo = facet.accountsInfo[i];
					const payment = finalResult.payments[i];
					expect(payment.index).to.equal(i);
					expect(payment.account).to.equal(accountInfo.receipt.accountId.toString());
					expect(payment.stage).to.equal(PaymentStage.Completed);
					expect(payment).has.property('schedulingTx');
					expect(payment).has.property('scheduledTx');
					expect(payment).has.property('scheduleId');
				}
			});
			it('creates an output file with expected contents', async function () {
				expect(fs.existsSync(outputFile)).to.be.true;
				let count = 0;
				const stream = fs.createReadStream(outputFile).pipe(parse());
				for await (const record of stream) {
					if (count === 0) {
						expect(record[0]).to.equal('Account');
						expect(record[1]).to.equal('Amount');
						expect(record[2]).to.equal('Distribution Id');
						expect(record[3]).to.equal('Scheduling Tx Id');
						expect(record[4]).to.equal('Scheduling Tx Status');
						expect(record[5]).to.equal('Countersigning Tx Id');
						expect(record[6]).to.equal('Countersigning Tx Status');
						expect(record[7]).to.equal('Scheduled Payment Tx Id');
						expect(record[8]).to.equal('Scheduled Payment Tx Status');
						expect(record[9]).to.equal('Status Description');
						expect(record[10]).to.equal('Started');
						expect(record[11]).to.equal('Scheduled');
						expect(record[12]).to.equal('Countersigned');
						expect(record[13]).to.equal('Finished');
					} else {
						const payment = finalResult.payments[count - 1];
						expect(record[0]).to.equal(payment.account);
						expect(record[1]).to.equal(payment.amount);
						expect(record[2]).to.not.be.empty;
						expect(record[3]).to.not.be.empty;
						expect(record[4]).to.equal('IDENTICAL_SCHEDULE_ALREADY_CREATED');
						expect(record[5]).to.not.be.empty;
						expect(record[6]).to.equal('SUCCESS');
						expect(record[7]).to.not.be.empty;
						expect(record[8]).to.equal('SUCCESS');
						expect(record[9]).to.equal('Completed');
						expect(record[10]).to.not.be.empty;
						expect(record[11]).to.not.be.empty;
						expect(record[12]).to.not.be.empty;
						expect(record[13]).to.not.be.empty;
						expect(Date.parse(record[10])).to.be.lessThan(Date.parse(record[11]));
						expect(Date.parse(record[11])).to.be.lessThan(Date.parse(record[12]));
						expect(Date.parse(record[12])).to.be.lessThan(Date.parse(record[13]));
					}
					count = count + 1;
				}
				// Should have read as many records as transfers exist
				// plus the header in the CSV file.
				expect(count).to.equal(planSummary.transfers.length + 1);
			});
		});
	});
});
