// name kept for upstream-merge compatibility; contains self-hosted implementation, not Firebase

/**
 * storage_utils.ts — self-hosted fork.
 *
 * DROP-IN REPLACEMENT for src/v3/services/firebase/storage_utils.ts.
 * Same four exported functions, same signatures, same semantics — but backed
 * by the local disk adapter instead of a Firebase Cloud Storage bucket.
 *
 * Callers (users.ts, congregations.ts, api.ts, classes/*) need NO changes for
 * these four functions. Only metadata.updated and metadata.timeCreated are
 * preserved because they are the only metadata fields upstream code ever reads.
 */

import { StorageBaseType } from '../../definition/firebase.js';
import { decryptData, encryptData } from '../encryption/encryption.js';
import { deleteObjectsByPrefix, readObject, saveObject, statObject } from '../storage/disk.js';

const buildDestPath = ({ path, type }: StorageBaseType): string => {
	let destPath = 'v3/';

	if (type === 'congregation') destPath += `congregations/${path}`;
	if (type === 'user') destPath += `users/${path}`;
	if (type === 'api') destPath += `api/${path}`;

	return destPath;
};

export const uploadFileToStorage = async (data: string, options: StorageBaseType) => {
	const destPath = buildDestPath(options);

	const encryptedData = encryptData(data);
	await saveObject(destPath, encryptedData);

	return encryptedData;
};

export const getFileMetadata = async (options: StorageBaseType) => {
	// upstream quirk preserved: this function never handled type 'api'
	if (options.type === 'api') return undefined;

	const destPath = buildDestPath(options);
	return await statObject(destPath);
};

export const getFileFromStorage = async (options: StorageBaseType) => {
	const destPath = buildDestPath(options);

	const encryptedData = await readObject(destPath);
	if (encryptedData === undefined) return undefined;

	return decryptData(encryptedData);
};

export const deleteFileFromStorage = async ({ path, type }: StorageBaseType) => {
	if (!path || path.length === 0) return;

	let destPath = 'v3/';
	if (type === 'congregation') destPath += `congregations/${path}`;
	if (type === 'user') destPath += `users/${path}`;

	await deleteObjectsByPrefix(destPath);
};
