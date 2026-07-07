import { AES, Utf8 } from 'crypto-es';

// SEC_ENCRYPT_KEY is validated at boot (see src/index.ts). Resolve it lazily and
// throw if it is missing, rather than binding a `&sws2apps_undefined` fallback at
// import time: that keeps any entrypoint which bypasses the boot check (a script,
// a test) from silently encrypting data under a predictable, source-public key.
const getServerKey = () => {
	const key = process.env.SEC_ENCRYPT_KEY;
	if (!key) throw new Error('SEC_ENCRYPT_KEY is not set — refusing to encrypt/decrypt with a fallback key');
	return `&sws2apps_${key}`;
};

export const encryptData = (data: string, passphrase?: string) => {
	const key = passphrase || getServerKey();

	const encryptedData = AES.encrypt(data, key).toString();
	return encryptedData;
};

export const decryptData = (data: string, passphrase?: string) => {
	try {
		const key = passphrase || getServerKey();

		const decryptedData = AES.decrypt(data, key);
		const str = decryptedData.toString(Utf8);
		return str;
	} catch {
		return;
	}
};
