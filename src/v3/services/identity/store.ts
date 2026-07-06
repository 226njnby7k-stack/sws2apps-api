/**
 * Identity store — replaces Firebase Auth as the identity provider.
 *
 * Stores, via the M3 disk adapter (so everything is AES-encrypted at rest):
 *   v3/api/identity/index.txt              email -> uid map
 *   v3/api/identity/credentials/{uid}.txt  per-user credential record
 *
 * A user's `auth_uid` (their id everywhere else in the API) is now a UUID we
 * generate, instead of a Firebase uid. Same shape, same role.
 */

import crypto from 'node:crypto';
import { getFileFromStorage, uploadFileToStorage } from '../firebase/storage_utils.js';
// NOTE: deliberately NOT using deleteFileFromStorage here — upstream's version
// does not handle type 'api' and would fall through to prefix-deleting 'v3/'
// (i.e. ALL data). We call the disk adapter directly with the full path.
import { deleteObjectsByPrefix } from '../storage/disk.js';

export type CredentialRecord = {
	uid: string;
	email: string;
	/** argon2id hash; absent for passwordless-only accounts */
	password_hash?: string;
	created_at: string;
	updated_at: string;
};

type EmailIndex = Record<string, string>; // normalized email -> uid

const INDEX_PATH = 'identity/index.txt';
const credPath = (uid: string) => `identity/credentials/${uid}.txt`;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const readIndex = async (): Promise<EmailIndex> => {
	const raw = await getFileFromStorage({ type: 'api', path: INDEX_PATH });
	return raw ? (JSON.parse(raw) as EmailIndex) : {};
};

const writeIndex = async (index: EmailIndex) => {
	await uploadFileToStorage(JSON.stringify(index), { type: 'api', path: INDEX_PATH });
};

export const findUidByEmail = async (email: string): Promise<string | undefined> => {
	const index = await readIndex();
	return index[normalizeEmail(email)];
};

export const getCredentials = async (uid: string): Promise<CredentialRecord | undefined> => {
	const raw = await getFileFromStorage({ type: 'api', path: credPath(uid) });
	return raw ? (JSON.parse(raw) as CredentialRecord) : undefined;
};

/** Create an identity. Replaces the Firebase createUser({ email }) call. */
export const createIdentity = async (email: string, password_hash?: string): Promise<CredentialRecord> => {
	const normalized = normalizeEmail(email);
	const index = await readIndex();

	if (index[normalized]) {
		throw new Error('identity: email already registered');
	}

	const now = new Date().toISOString();
	const record: CredentialRecord = {
		uid: crypto.randomUUID(),
		email: normalized,
		password_hash,
		created_at: now,
		updated_at: now,
	};

	await uploadFileToStorage(JSON.stringify(record), { type: 'api', path: credPath(record.uid) });

	index[normalized] = record.uid;
	await writeIndex(index);

	return record;
};

/** Replaces the Firebase updateUser(uid, { email }) call. */
export const updateIdentityEmail = async (uid: string, newEmail: string) => {
	const record = await getCredentials(uid);
	if (!record) throw new Error('identity: user not found');

	const normalized = normalizeEmail(newEmail);
	const index = await readIndex();

	if (index[normalized] && index[normalized] !== uid) {
		throw new Error('identity: email already registered');
	}

	delete index[record.email];
	index[normalized] = uid;

	record.email = normalized;
	record.updated_at = new Date().toISOString();

	await uploadFileToStorage(JSON.stringify(record), { type: 'api', path: credPath(uid) });
	await writeIndex(index);
};

export const updateIdentityPassword = async (uid: string, password_hash: string) => {
	const record = await getCredentials(uid);
	if (!record) throw new Error('identity: user not found');

	record.password_hash = password_hash;
	record.updated_at = new Date().toISOString();

	await uploadFileToStorage(JSON.stringify(record), { type: 'api', path: credPath(uid) });
};

/** Replaces the Firebase deleteUser(uid) call. */
export const deleteIdentity = async (uid: string) => {
	const record = await getCredentials(uid);
	if (!record) return;

	const index = await readIndex();
	delete index[record.email];
	await writeIndex(index);

	await deleteObjectsByPrefix(`v3/api/${credPath(uid)}`);
};
