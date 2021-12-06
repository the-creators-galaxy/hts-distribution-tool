import { PrivateKey } from '@hashgraph/cryptography';
import type { Signatory } from '../common/primitives';
/**
 * Validates a user entered ED25519 ANS.1 Hex encoded private key,
 * returning a promise for a Signatory structure holding hex encoded
 * representations of the private and corresponding public key or a
 * rejection reason if the provided string value is invalid.
 *
 * Due to the nature of the `@hashgraph/sdk`, the `PrivateKey`
 * object must live on the node.js side of the application.
 * Assessing functionality from the user interface requires IPC,
 * which in turn due to the app’s architecture requires a promise
 * to be returned instead of the native object.  The `Signatory`
 * can be marshaled across the IPC barrier, the `PrivateKey` cannot.
 *
 * @param value Private ED25519 ANS.1 Hex value.
 * @returns A resolved promise holding a `Signatory` containing the
 * Hex encoded values for the private key and associated public key
 * if the input is valid, otherwise a rejected promise containing
 * an error message explaining why the value is invalid.
 */
export function validatePrivateKey(value: string): Promise<Signatory> {
	try {
		const privateKey = PrivateKey.fromString(value);
		const publicKey = privateKey.publicKey;
		return Promise.resolve({
			privateKey:
				'302e020100300506032b657004220420' +
				Buffer.from(privateKey.toBytes()).toString('hex'),
			publicKey:
				'302a300506032b6570032100' +
				Buffer.from(publicKey.toBytes()).toString('hex'),
		});
	} catch (err) {
		return Promise.reject(err.message || err.toString());
	}
}
