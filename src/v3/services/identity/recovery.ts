/**
 * MFA recovery codes — a break-glass fallback for TOTP 2FA.
 *
 * Same discipline as the one-time email login tokens (tokens.ts):
 *   - single-use, consumed ATOMICALLY (read-check-invalidate under a lock) so a
 *     code can't be accepted twice by concurrent requests;
 *   - shown to the user exactly ONCE at generation time — only sha256 hashes are
 *     stored, so the API can never reproduce them;
 *   - regeneration REPLACES the whole set, so previous codes die immediately
 *     (no ever-growing pile of live backdoors);
 *   - the /mfa/verify-recovery-code endpoint that consumes them is rate-limited
 *     like the TOTP verify endpoint.
 *
 * Persisted via the M3 disk adapter (AES-encrypted at rest). Keyed by auth_uid.
 *
 * NOTE: atomicity is provided by the in-process lock (lock.ts). Like every other
 * single-use guarantee here, it holds only for a SINGLE-PROCESS API — see the
 * hard constraint in docker-compose.yml / PROJECT.md §10.
 */

import crypto from 'node:crypto';
import { getFileFromStorage, uploadFileToStorage } from '../firebase/storage_utils.js';
import { withLock } from './lock.js';

// Coarse key = bounded lock map; serializes every recovery read-modify-write.
const RECOVERY_LOCK = 'identity/recovery';
const RECOVERY_PATH = 'identity/recovery_codes.txt';

const CODE_COUNT = 10;
const CODE_BYTES = 8; // 64-bit codes: infeasible to brute-force sha256 offline

// uid -> array of sha256(normalized code) for the still-unused codes
type RecoveryStore = Record<string, string[]>;

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

// Codes are shown grouped ("abcd-ef01-2345-6789") but hashed/compared without the
// separators or case, so the user can retype them loosely.
const normalize = (code: string) => code.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const readStore = async (): Promise<RecoveryStore> => {
	const raw = await getFileFromStorage({ type: 'api', path: RECOVERY_PATH });
	return raw ? (JSON.parse(raw) as RecoveryStore) : {};
};

const writeStore = async (store: RecoveryStore) => {
	await uploadFileToStorage(JSON.stringify(store), { type: 'api', path: RECOVERY_PATH });
};

const makeCode = (): string => {
	const hex = crypto.randomBytes(CODE_BYTES).toString('hex'); // 16 hex chars
	return hex.replace(/(.{4})(?=.)/g, '$1-'); // -> abcd-ef01-2345-6789
};

/**
 * Generate a fresh set of one-time recovery codes for uid, REPLACING any existing
 * set (so previous codes are invalidated at this instant). Returns the RAW codes —
 * the caller must show them to the user exactly once; only their hashes are kept.
 */
export const generateRecoveryCodes = async (uid: string): Promise<string[]> =>
	withLock(RECOVERY_LOCK, async () => {
		const codes = Array.from({ length: CODE_COUNT }, makeCode);

		const store = await readStore();
		store[uid] = codes.map((code) => sha256(normalize(code)));
		await writeStore(store);

		return codes;
	});

/**
 * Consume (single-use) one recovery code for uid. Atomic read-check-invalidate:
 * the code is removed in the same locked operation that validates it, so two
 * concurrent requests can't both accept it. Returns true iff it was valid + unused.
 */
export const consumeRecoveryCode = async (uid: string, code: string): Promise<boolean> =>
	withLock(RECOVERY_LOCK, async () => {
		const hash = sha256(normalize(code));

		const store = await readStore();
		const codes = store[uid] ?? [];

		if (!codes.includes(hash)) return false;

		store[uid] = codes.filter((c) => c !== hash);
		await writeStore(store);
		return true;
	});

/** How many unused recovery codes remain for uid (so the client can warn when low). */
export const countRecoveryCodes = async (uid: string): Promise<number> => {
	const store = await readStore();
	return (store[uid] ?? []).length;
};

/** Delete all recovery codes for uid — on MFA disable and on account deletion. */
export const deleteRecoveryCodes = async (uid: string): Promise<void> =>
	withLock(RECOVERY_LOCK, async () => {
		const store = await readStore();
		if (store[uid]) {
			delete store[uid];
			await writeStore(store);
		}
	});
