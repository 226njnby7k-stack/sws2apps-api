import { API_VAR } from '../../index.js';

/**
 * M5 stub: upstream stored `api_settings_v3` (the minimum supported client
 * version) in Firestore. Until that tiny bit of state is migrated to the
 * storage adapter (milestone M5), seed it from env / a safe default so the API
 * boots with zero Firestore dependency. Behaviour is unchanged for clients:
 * MINIMUM_APP_VERSION is still populated before the server accepts requests.
 */
export const initializeAPI = async () => {
	API_VAR.MINIMUM_APP_VERSION = process.env.MINIMUM_APP_VERSION || '1.0.0';
};
