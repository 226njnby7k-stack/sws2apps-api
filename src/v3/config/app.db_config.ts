import { API_VAR } from '../../index.js';
import { getApiSettings, setApiSettings } from '../services/firebase/api.js';

/**
 * M5: api_settings (the minimum supported client version) now lives on the disk
 * storage adapter (v3/api/settings.txt), not Firestore. Read it on boot, seeding
 * the file on first run from MINIMUM_APP_VERSION env / a safe default so admin
 * updates persist across restarts. Zero Firestore dependency.
 */
export const initializeAPI = async () => {
	const settings = await getApiSettings();

	// ensure the file exists so admin POST /client-version has something to update
	await setApiSettings(settings);

	API_VAR.MINIMUM_APP_VERSION = settings.minimum_version;
};
