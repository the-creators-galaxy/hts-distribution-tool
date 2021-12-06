import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { expect } from 'chai';
import { AccountBalanceQuery, AccountCreateTransaction, Key, KeyList, PrivateKey, Status, TokenAssociateTransaction, TokenCreateTransaction, TransactionId, TransferTransaction } from '@hashgraph/sdk';
import type { Signatory } from '../../../src/common/primitives';
import { payer, getClient, payerPrivateKey } from './environment.facets';

export async function createDistributionScenario() {
    const treasuryInfo = await createAccount(0, 3, 2);
    const distributionPayerInfo = await createAccount(10);
    const accountsInfo = [];
    for (let i = 0; i < 5; i++) {
        accountsInfo.push(await createAccount());
    }
    const tokenInfo = await createToken(treasuryInfo);
    for (let accountInfo of accountsInfo) {
        await associateToken(tokenInfo, accountInfo);
    }
    const distributionFilePath = path.join(createTemporaryDirectory(), 'distribution.csv');
    for (let i = 0; i < 5; i++) {
        fs.appendFileSync(distributionFilePath, `${accountsInfo[i].receipt.accountId.toString()},100.${i + 10}\r\n`);
    }
    return { treasuryInfo, tokenInfo, distributionPayerInfo, accountsInfo, distributionFilePath };
}

export async function createAccount(initialBalance: number = 0, keyCount: number = 1, keyThreshold: number = 1) {
    const client = await getClient();
    const { key, privateKeys } = createKeyList(keyCount, keyThreshold);
    const { receipt, error } = await client.executeTransaction(async nodeIds => {
        return new AccountCreateTransaction()
            .setInitialBalance(initialBalance)
            .setKey(key)
            .setTransactionId(TransactionId.generate(payer))
            .setNodeAccountIds(nodeIds)
            .freeze()
            .sign(payerPrivateKey);
    });
    expect(error).to.not.exist;
    expect(receipt.status).to.equal(Status.Success);
    expect(receipt.accountId).to.exist;
    return { receipt, privateKeys, keyThreshold, error };
}

export async function createToken(treasuryInfo) {
    const client = await getClient();
    const { receipt, error } = await client.executeTransaction(async nodeIds => {
        const tx = new TokenCreateTransaction()
            .setDecimals(2)
            .setTokenSymbol('TYRO')
            .setTokenName('Myro\'s Evil Twin')
            .setTreasuryAccountId(treasuryInfo.receipt.accountId)
            .setInitialSupply(1000000000)
            .setExpirationTime(new Date(Date.now() + 7776000000))
            .setTransactionId(TransactionId.generate(payer))
            .setNodeAccountIds(nodeIds)
            .freeze();
        await tx.sign(payerPrivateKey);
        for (const privateKey of treasuryInfo.privateKeys) {
            await tx.sign(privateKey);
        }
        return tx;
    });
    expect(error).to.not.exist;
    expect(receipt.status).to.equal(Status.Success);
    expect(receipt.tokenId).to.exist;
    return { receipt, error };
}

export async function recoverFunds(accountInfo: any) {
    const accountId = accountInfo?.receipt?.accountId;
    const privateKeys = accountId?.privateKeys;
    if (accountId && privateKeys) {
        const client = await getClient();
        const { response } = await client.executeQuery(() => Promise.resolve(new AccountBalanceQuery().setAccountId(accountId)));
        if (response && response.hbars.toBigNumber().isGreaterThan(1)) {
            await client.executeTransaction(async nodeIds => {
                const tx = new TransferTransaction()
                    .addHbarTransfer(accountId, response.hbars.negated())
                    .addHbarTransfer(payer, response.hbars)
                    .setTransactionId(TransactionId.generate(payer))
                    .setNodeAccountIds(nodeIds)
                    .freeze();
                await tx.sign(payerPrivateKey);
                for (const privateKey of accountInfo.privateKeys) {
                    await tx.sign(privateKey);
                }
                return tx;
            });
        }
    }
}

export function privateKeytoSignatory(privateKey: PrivateKey): Signatory {
    const publicKey = privateKey.publicKey;
    return {
        privateKey: '302e020100300506032b657004220420' + Buffer.from(privateKey.toBytes()).toString('hex'),
        publicKey: '302a300506032b6570032100' + Buffer.from(publicKey.toBytes()).toString('hex')
    };
}

async function associateToken(tokenInfo: any, accountInfo: any) {
    const client = await getClient();
    const { receipt, error } = await client.executeTransaction(async nodeIds => {
        const tx = new TokenAssociateTransaction()
            .setTokenIds([tokenInfo.receipt.tokenId])
            .setAccountId(accountInfo.receipt.accountId)
            .setTransactionId(TransactionId.generate(payer))
            .setNodeAccountIds(nodeIds)
            .freeze();
        await tx.sign(payerPrivateKey);
        for (const privateKey of accountInfo.privateKeys) {
            await tx.sign(privateKey);
        }
        return tx;
    });
    expect(error).to.not.exist;
    expect(receipt.status).to.equal(Status.Success);
    return { receipt, error };
}

function createKeyList(keyCount: number, keyThreshold: number) {
    let key: Key;
    const privateKeys = [];
    for (let i = 0; i < keyCount; i++) {
        privateKeys.push(PrivateKey.generate());
    }
    if (keyCount === 1) {
        key = privateKeys[0];
    } else {
        key = new KeyList(privateKeys, keyThreshold);
    }
    return { key, privateKeys, keyThreshold };
}
/**
 * Thanks to https://advancedweb.hu/secure-tempfiles-in-nodejs-without-dependencies/
 * for the inspiration.
 *  
 * @param params creates an os temporary directory
 */
//
function createTemporaryDirectory() {
    return fs.mkdtempSync(fs.realpathSync(os.tmpdir()) + path.sep);
}