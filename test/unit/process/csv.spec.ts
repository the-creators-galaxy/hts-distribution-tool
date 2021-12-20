import * as path from 'path';
import { expect } from 'chai';
import 'mocha';
import { CsvParseData, loadAndParseCsvDistributionFile } from '../../../src/process/csv';

describe('CSV Processing Module', function () {
	describe('method loadAndParseCsvDistributionFile', function () {
		describe('returns error when it', function () {
			it('receives empty filename for input', async function () {
				const result = await loadAndParseCsvDistributionFile('');
				expect(result).to.exist;
				expect(result.data).to.be.empty;
				expect(result.errors).to.have.length(1);
				expect(result.errors[0]).to.have.property('description').with.equal("File '' not found.");
			});
			it('receives invalid filename for input', async function () {
				const result = await loadAndParseCsvDistributionFile('something that does not exist.csv');
				expect(result).to.exist;
				expect(result.data).to.be.empty;
				expect(result.errors).to.have.length(1);
				expect(result.errors[0]).to.have.property('description').with.equal("File 'something that does not exist.csv' not found.");
			});
		});
		describe('loads valid file without errors and', function () {
			const filename = path.join(__dirname, 'csv.spec.resource-test-file-25.csv');
			let data: CsvParseData;
			before(async function () {
				data = await loadAndParseCsvDistributionFile(filename);
			});
			it('returns a csv data structure', function () {
				expect(data).to.exist;
			});
			it('includes the original full path to the file', function () {
				expect(data.filename).to.equal(filename);
			});
			it('counts the number of rows in the file', function () {
				expect(data.rows).to.equal(26);
			});
			it('counts the maximum number of columns in the file', function () {
				expect(data.columns).to.equal(2);
			});
			it('counts the maximum decimal places in the file', function () {
				expect(data.decimals).to.equal(8);
			});
			it('generates a transfer list', function () {
				expect(data.transfers).to.lengthOf(25);
				// Spot Check some of the transfers, but not all
				expect(data.transfers.find((t) => t.account.toString() === '0.0.3107592'))
					.to.have.property('amount')
					.with.to.satisfy((a) => a.toString() === '819.23610931');
				expect(data.transfers.find((t) => t.account.toString() === '0.0.3107612'))
					.to.have.property('amount')
					.with.to.satisfy((a) => a.toString() === '7608.88793741');
				expect(data.transfers.find((t) => t.account.toString() === '0.0.3107603'))
					.to.have.property('amount')
					.with.to.satisfy((a) => a.toString() === '4988.42042225');
			});
			it('orders transfer list by account id first', function () {
				for (let i = 1; i < data.transfers.length; i++) {
					const lhs = data.transfers[i - 1];
					const rhs = data.transfers[i];
					expect(lhs.account.num.lessThan(rhs.account.num)).to.be.true;
				}
			});
			it('echos the original data', function () {
				expect(data.data).to.lengthOf(26);
			});
			it('reports no errors in the error list', function () {
				expect(data.errors).to.lengthOf(0);
			});
		});
		describe('loads valid file of small amounts without error and', function () {
			const filename = path.join(__dirname, 'csv.spec.resource-test-file-25-small-amounts.csv');
			let data: CsvParseData;
			before(async function () {
				data = await loadAndParseCsvDistributionFile(filename);
			});
			it('returns a csv data structure', function () {
				expect(data).to.exist;
			});
			it('includes the original full path to the file', function () {
				expect(data.filename).to.equal(filename);
			});
			it('counts the number of rows in the file', function () {
				expect(data.rows).to.equal(26);
			});
			it('counts the maximum number of columns in the file', function () {
				expect(data.columns).to.equal(2);
			});
			it('counts the maximum decimal places in the file', function () {
				expect(data.decimals).to.equal(7);
			});
			it('generates a transfer list', function () {
				expect(data.transfers).to.lengthOf(25);
				// Spot Check some of the transfers, but not all
				expect(data.transfers.find((t) => t.account.toString() === '0.0.3107606'))
					.to.have.property('amount')
					.with.to.satisfy((a) => a.toString(10) === '0.0000001');
				expect(data.transfers.find((t) => t.account.toString() === '0.0.3107612'))
					.to.have.property('amount')
					.with.to.satisfy((a) => a.toString(10) === '0.8879341');
				expect(data.transfers.find((t) => t.account.toString() === '0.0.3107616'))
					.to.have.property('amount')
					.with.to.satisfy((a) => a.toString(10) === '0.4124992');
				expect(data.transfers.find((t) => t.account.toString() === '0.0.3107603'))
					.to.have.property('amount')
					.with.to.satisfy((a) => a.toString(10) === '0.9999999');
			});
			it('orders transfer list by account id first', function () {
				for (let i = 1; i < data.transfers.length; i++) {
					const lhs = data.transfers[i - 1];
					const rhs = data.transfers[i];
					expect(lhs.account.num.lessThan(rhs.account.num)).to.be.true;
				}
			});
			it('echos the original data', function () {
				expect(data.data).to.lengthOf(26);
			});
			it('reports no errors in the error list', function () {
				expect(data.errors).to.lengthOf(0);
			});
		});
		describe('loads parsable file with errors and', function () {
			const filename = path.join(__dirname, 'csv.spec.resource-test-file-25-with-errors.csv');
			let data: CsvParseData;
			before(async function () {
				data = await loadAndParseCsvDistributionFile(filename);
			});
			it('returns a csv data structure', function () {
				expect(data).to.exist;
			});
			it('includes the original full path to the file', function () {
				expect(data.filename).to.equal(filename);
			});
			it('counts the number of rows in the file', function () {
				expect(data.rows).to.equal(26);
			});
			it('counts the maximum number of columns in the file', function () {
				expect(data.columns).to.equal(2);
			});
			it('counts the maximum decimal places in the file', function () {
				expect(data.decimals).to.equal(8);
			});
			it('generates a transfer list', function () {
				expect(data.transfers).to.lengthOf(19);
				// Spot Check some of the transfers, but not all
				expect(data.transfers.find((t) => t.account.toString() === '0.0.3107592'))
					.to.have.property('amount')
					.with.to.satisfy((a) => a.toString() === '819.23610931');
				expect(data.transfers.find((t) => t.account.toString() === '0.0.3107593'))
					.to.have.property('amount')
					.with.to.satisfy((a) => a.toString() === '4793.09818506');
				expect(data.transfers.find((t) => t.account.toString() === '0.0.3107608'))
					.to.have.property('amount')
					.with.to.satisfy((a) => a.toString() === '3712.39027706');
				expect(data.transfers.find((t) => t.account.toString() === '0.0.3107616'))
					.to.have.property('amount')
					.with.to.satisfy((a) => a.toString() === '5652.41249923');
			});
			it('orders transfer list by account id first', function () {
				for (let i = 1; i < data.transfers.length; i++) {
					const lhs = data.transfers[i - 1];
					const rhs = data.transfers[i];
					expect(lhs.account.num.lessThan(rhs.account.num)).to.be.true;
				}
			});
			it('echos the original data', function () {
				expect(data.data).to.lengthOf(26);
			});
			it('reports errors in the error list', function () {
				expect(data.errors).to.lengthOf(6);
			});
			it('identifies missing account id', function () {
				const err = data.errors.find((e) => e.line === 4);
				expect(err.line).to.exist;
				expect(err.column).to.equal(1);
				expect(err.description).to.equal('Unable to parse Account ID: invalid format for entity ID');
			});
			it('identifies distribution amount of zero', function () {
				const err = data.errors.find((e) => e.line === 8);
				expect(err.line).to.exist;
				expect(err.column).to.equal(2);
				expect(err.description).to.equal('Amount of distribution must be a value greater than zero.');
			});
			it('identifies distribution with missing amount', function () {
				const err = data.errors.find((e) => e.line === 11);
				expect(err.line).to.exist;
				expect(err.column).to.equal(1);
				expect(err.description).to.equal('Expected to find Crypto Address in column 1 and distribution amount in column 2.');
			});
			it('identifies unparsable account id', function () {
				const err = data.errors.find((e) => e.line === 18);
				expect(err.line).to.exist;
				expect(err.column).to.equal(1);
				expect(err.description).to.equal('Unable to parse Account ID: invalid format for entity ID');
			});
			it('identifies unparsable distribution amount', function () {
				const err = data.errors.find((e) => e.line === 23);
				expect(err.line).to.exist;
				expect(err.column).to.equal(2);
				expect(err.description).to.equal("Unable to parse 'not a number' as an amount of distribution.");
			});
		});
		describe('loads parsable file with duplicate account entries', function () {
			const filename = path.join(__dirname, 'csv.spec.resource-test-file-duplicate-accounts.csv');
			let data: CsvParseData;
			before(async function () {
				data = await loadAndParseCsvDistributionFile(filename);
			});
			it('orders transfer list by account id first then by amount', function () {
				for (let i = 1; i < data.transfers.length; i++) {
					const lhs = data.transfers[i - 1];
					const rhs = data.transfers[i];
					if (lhs.account.num.equals(rhs.account.num)) {
						expect(lhs.amount.isLessThan(rhs.amount)).to.be.true;
					} else {
						expect(lhs.account.num.lessThan(rhs.account.num)).to.be.true;
					}
				}
			});
			it('includes multiple records for duplicated accounts', function () {
				const map = {};
				for (let i = 0; i < data.transfers.length; i++) {
					const dist = data.transfers[i];
					const key = dist.account.toString();
					map[key] = (map[key] || 0) + 1;
				}
				expect(map).to.have.property('0.0.3107612', 3);
				expect(map).to.have.property('0.0.3107606', 1);
				expect(map).to.have.property('0.0.3107592', 2);
				expect(map).to.have.property('0.0.3107593', 1);
				expect(map).to.have.property('0.0.3107607', 1);
				expect(map).to.have.property('0.0.3107610', 1);
				expect(map).to.have.property('0.0.3107625', 2);
			});
		});
	});
});
