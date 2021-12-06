import { expect } from 'chai';
import 'mocha';
import { createDistributionScenario, privateKeytoSignatory, recoverFunds } from "../facets/scenarios.facets";
import { executeDistributionPlan, generateDistributionPlan, getDistributionFileSummary, getDistributionResults, loadDistributionFile, resetDistribution, setTreasuryInformation } from '../../../src/process/distribution';
import { NetworkId } from '../../../src/common/primitives';
import { payer, payerPrivateKey } from '../facets/environment.facets';

describe('tcg process code', function () {
    describe('module distribution', function () {
        describe('basic distribution scenario', function () {
            this.timeout(0);
            let facet: any;
            before(async function () {
                facet = await createDistributionScenario();
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
                            signatories: [
                                privateKeytoSignatory(payerPrivateKey),
                                privateKeytoSignatory(facet.distributionPayerInfo.privateKeys[0]),
                                privateKeytoSignatory(facet.treasuryInfo.privateKeys[1]),
                            ]
                        });
                        planSummary = await generateDistributionPlan(() => { });
                        planResult = await executeDistributionPlan(() => { });
                        finalResult = await getDistributionResults();
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
                        expect(planSummary.warnings).to.be.empty;
                        expect(planResult.errors).to.be.empty;
                        expect(finalResult.errors).to.be.empty;
                    });
                    it('distribution parsing was valid', function () {
                        expect(distSummary.decimals).to.equal(2);
                        expect(distSummary.transfers).lengthOf(5);
                    });
                    it('distribution plan is valid', function () {
                        expect(planSummary.decimals).to.equal(2);
                        expect(planSummary.transfers).lengthOf(5);
                    });
                    it('distribution result is valid', function () {
                        expect(finalResult.payments).lengthOf(5);
                        for (let i = 0; i < facet.accountsInfo.length; i++) {
                            const accountInfo = facet.accountsInfo[i];
                            const payment = finalResult.payments[i];
                            expect(payment.index).to.equal(i);
                            expect(payment.account).to.equal(accountInfo.receipt.accountId.toString());
                            expect(payment.status).to.equal(`Scheduling: Awaiting Add'l Signatures`);
                            expect(payment).has.property('schedulingTx');
                            expect(payment).has.property('scheduledTx');
                            expect(payment).has.property('scheduleId');
                        }
                    });
                });
                describe('distribution pass two', function () {
                    let distSummary;
                    let planSummary;
                    let planResult;
                    let finalResult;
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
                            signatories: [
                                privateKeytoSignatory(payerPrivateKey),
                                privateKeytoSignatory(facet.distributionPayerInfo.privateKeys[0]),
                                privateKeytoSignatory(facet.treasuryInfo.privateKeys[0]),
                            ]
                        });
                        planSummary = await generateDistributionPlan(() => { });
                        planResult = await executeDistributionPlan(() => { });
                        finalResult = await getDistributionResults();
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
                        expect(planSummary.warnings).to.be.empty;
                        expect(planResult.errors).to.be.empty;
                        expect(finalResult.errors).to.be.empty;
                    });
                    it('distribution parsing was valid', function () {
                        expect(distSummary.decimals).to.equal(2);
                        expect(distSummary.transfers).lengthOf(5);
                    });
                    it('distribution plan is valid', function () {
                        expect(planSummary.decimals).to.equal(2);
                        expect(planSummary.transfers).lengthOf(5);
                    });
                    it('distribution result is valid', function () {
                        expect(finalResult.payments).lengthOf(5);
                        for (let i = 0; i < facet.accountsInfo.length; i++) {
                            const accountInfo = facet.accountsInfo[i];
                            const payment = finalResult.payments[i];
                            expect(payment.index).to.equal(i);
                            expect(payment.account).to.equal(accountInfo.receipt.accountId.toString());
                            expect(payment.status).to.equal('Status: Distribution Completed');
                            expect(payment).has.property('schedulingTx');
                            expect(payment).has.property('scheduledTx');
                            expect(payment).has.property('scheduleId');
                        }
                    });
                });
            });
        });
    });
});