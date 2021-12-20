import * as path from 'path';
import { expect } from 'chai';
import 'mocha';
import { getDistributionFileSummary, loadDistributionFile, resetDistribution } from '../../../src/process/distribution';

describe('Distribution CSV Parsing of small amounts', function () {
	let csvFilename;
	let parseSummary;
	before(async function () {
		resetDistribution();
		csvFilename = path.join(__dirname, 'csv.spec.resource-test-file-25-small-amounts.csv');
		await loadDistributionFile(csvFilename);
		parseSummary = await getDistributionFileSummary();
	});
	it('results were returned', function () {
		expect(parseSummary).to.exist;
	});
	it('results included the filename', function () {
		expect(parseSummary.filename).to.equal(csvFilename);
	});
	it('distribution parsing of rows and columns match', function () {
		expect(parseSummary.rows).to.equal(26);
		expect(parseSummary.columns).to.equal(2);
	});
	it('parsed transfers match expectations', function () {
		expect(parseSummary.decimals).to.equal(7);
		expect(parseSummary.transfers).lengthOf(25);
	});
	it('included the raw data', function () {
		expect(parseSummary.data).lengthOf(26);
	});
	it('no errors were produced', function () {
		expect(parseSummary.errors).to.be.empty;
	});
	it('produced expected transfers', function () {
		const expectations = [
			['0.0.3107592', '0.2361031'],
			['0.0.3107593', '0.0981806'],
			['0.0.3107594', '0.5263959'],
			['0.0.3107596', '0.8731884'],
			['0.0.3107599', '0.0258817'],
			['0.0.3107600', '0.0164523'],
			['0.0.3107601', '0.7335083'],
			['0.0.3107603', '0.9999999'],
			['0.0.3107606', '0.0000001'],
			['0.0.3107607', '0.2601683'],
			['0.0.3107608', '0.3902776'],
			['0.0.3107609', '0.891325'],
			['0.0.3107610', '0.6030532'],
			['0.0.3107612', '0.8879341'],
			['0.0.3107615', '0.4307827'],
			['0.0.3107616', '0.4124992'],
			['0.0.3107617', '0.2127456'],
			['0.0.3107618', '0.0126336'],
			['0.0.3107621', '0.3312914'],
			['0.0.3107625', '0.8296916'],
			['0.0.3107627', '0.9168664'],
			['0.0.3107629', '0.8680449'],
			['0.0.3107632', '0.3999223'],
			['0.0.3107633', '0.3680789'],
			['0.0.3107634', '0.214822'],
		];
		for (let i = 0; i < expectations.length; i++) {
			const xfer = parseSummary.transfers[i];
			expect(xfer.account).to.equal(expectations[i][0]);
			expect(xfer.amount).to.equal(expectations[i][1]);
		}
	});
});

describe('Distribution CSV Parsing of whole amounts', function () {
	let csvFilename;
	let parseSummary;
	before(async function () {
		resetDistribution();
		csvFilename = path.join(__dirname, 'csv.spec.resource-test-file-25-whole-amounts.csv');
		await loadDistributionFile(csvFilename);
		parseSummary = await getDistributionFileSummary();
	});
	it('results were returned', function () {
		expect(parseSummary).to.exist;
	});
	it('results included the filename', function () {
		expect(parseSummary.filename).to.equal(csvFilename);
	});
	it('distribution parsing of rows and columns match', function () {
		expect(parseSummary.rows).to.equal(26);
		expect(parseSummary.columns).to.equal(2);
	});
	it('parsed transfers match expectations', function () {
		expect(parseSummary.decimals).to.equal(0);
		expect(parseSummary.transfers).lengthOf(25);
	});
	it('included the raw data', function () {
		expect(parseSummary.data).lengthOf(26);
	});
	it('no errors were produced', function () {
		expect(parseSummary.errors).to.be.empty;
	});
	it('produced expected transfers', function () {
		const expectations = [
			['0.0.3107592', '2361031'],
			['0.0.3107593', '981806'],
			['0.0.3107594', '5263959'],
			['0.0.3107596', '8731884'],
			['0.0.3107599', '258817'],
			['0.0.3107600', '164523'],
			['0.0.3107601', '7335083'],
			['0.0.3107603', '9999999'],
			['0.0.3107606', '1'],
			['0.0.3107607', '2601683'],
			['0.0.3107608', '3902776'],
			['0.0.3107609', '891325'],
			['0.0.3107610', '6030532'],
			['0.0.3107612', '8879341'],
			['0.0.3107615', '4307827'],
			['0.0.3107616', '4124992'],
			['0.0.3107617', '2127456'],
			['0.0.3107618', '126336'],
			['0.0.3107621', '3312914'],
			['0.0.3107625', '8296916'],
			['0.0.3107627', '9168664'],
			['0.0.3107629', '8680449'],
			['0.0.3107632', '3999223'],
			['0.0.3107633', '3680789'],
			['0.0.3107634', '214822'],
		];
		for (let i = 0; i < expectations.length; i++) {
			const xfer = parseSummary.transfers[i];
			expect(xfer.account).to.equal(expectations[i][0]);
			expect(xfer.amount).to.equal(expectations[i][1]);
		}
	});
});
