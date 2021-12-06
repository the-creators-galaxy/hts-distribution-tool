import { AccountId, PrivateKey, PublicKey } from '@hashgraph/sdk';
import { CalaxyClient } from '../../../src/process/client/client';

export const payer = AccountId.fromString(process.env.PAYER_ACCOUNT);
export const payerPrivateKey = PrivateKey.fromString(process.env.PAYER_PRIVATE_KEY);
export const payerPublicKey = PublicKey.fromString(process.env.PAYER_PUBLIC_KEY);
let client: CalaxyClient = null;

export async function getClient(): Promise<CalaxyClient> {
    if (client) {
        return Promise.resolve(client);
    } else {
        const candidates = CalaxyClient.forTestnet();
        for (let i = 0; i < 10; i++) {
            const clients = await CalaxyClient.filterByPing(candidates, i * 100);
            if (clients.length > 0) {
                client = clients[0];
                return client;
            }
        }
    }
    throw new Error('It appears no hedera nodes are currently available');
}
