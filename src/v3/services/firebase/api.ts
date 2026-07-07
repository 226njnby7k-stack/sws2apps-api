import { API_VAR } from '../../../index.js';
import { getFileFromStorage, uploadFileToStorage } from './storage_utils.js';

/**
 * M5: api_settings (the minimum supported client version) now lives on the disk
 * storage adapter at v3/api/settings.txt instead of Firestore's api_settings_v3
 * collection. Same single field, same behaviour — zero Firestore dependency.
 */
const SETTINGS_PATH = 'settings.txt';

type ApiSettings = { minimum_version: string };

export const getApiSettings = async (): Promise<ApiSettings> => {
	const raw = await getFileFromStorage({ type: 'api', path: SETTINGS_PATH });
	if (raw) return JSON.parse(raw) as ApiSettings;

	return { minimum_version: process.env.MINIMUM_APP_VERSION || '1.0.0' };
};

export const setApiSettings = async (settings: ApiSettings): Promise<void> => {
	await uploadFileToStorage(JSON.stringify(settings), { type: 'api', path: SETTINGS_PATH });
};

export const updateAPIMinimumClient = async (version: string) => {
	const settings = await getApiSettings();
	settings.minimum_version = version;

	await setApiSettings(settings);

	API_VAR.MINIMUM_APP_VERSION = version;
};
