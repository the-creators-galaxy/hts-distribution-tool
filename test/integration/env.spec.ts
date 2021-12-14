import { AccountId, PrivateKey, PublicKey } from '@hashgraph/sdk';
import { expect } from 'chai';
import 'mocha';

describe('environmental prerequisites', function () {
	it('test account address to be defined', function () {
		expect(process.env.PAYER_ACCOUNT).to.exist;
		const accountId = AccountId.fromString(process.env.PAYER_ACCOUNT);
		expect(accountId.num.greaterThan(0)).to.be.true;
	});
	it('test account public key to be defined', function () {
		expect(process.env.PAYER_PUBLIC_KEY).to.exist;
		const publicKey = PublicKey.fromString(process.env.PAYER_PUBLIC_KEY);
		expect(publicKey).to.exist;
	});
	it('test account private key to be defined', function () {
		expect(process.env.PAYER_PRIVATE_KEY).to.exist;
		const privateKey = PrivateKey.fromString(process.env.PAYER_PRIVATE_KEY);
		expect(privateKey).to.exist;
	});
});
