/**
 * Token service — replaces Firebase ID tokens and custom tokens.
 *
 * 1. Access JWTs (EdDSA/Ed25519 via `jose`): what the client now sends as
 *    `Authorization: Bearer ...` in place of the Firebase ID token. Verified
 *    by decodeUserIdToken() with the same contract: token -> uid | undefined.
 *
 * 2. One-time email login tokens: replace the Firebase createCustomToken() in the
 *    passwordless flow. High-entropy, hashed at rest, single-use, short-lived.
 *
 * Env:
 *   AUTH_JWT_PRIVATE_KEY / AUTH_JWT_PUBLIC_KEY — PKCS8/SPKI PEM (Ed25519).
 *   Generate once:
 *     openssl genpkey -algorithm ed25519 -out jwt_private.pem
 *     openssl pkey -in jwt_private.pem -pubout -out jwt_public.pem
 */

import crypto from 'node:crypto';
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
import { getFileFromStorage, uploadFileToStorage } from '../firebase/storage_utils.js';

const ISSUER = 'organized-selfhosted';
const AUDIENCE = 'organized-app';
const ACCESS_TOKEN_TTL = '15m';

let privateKey: CryptoKey | undefined;
let publicKey: CryptoKey | undefined;

const getKeys = async () => {
	if (!privateKey || !publicKey) {
		const priv = process.env.AUTH_JWT_PRIVATE_KEY;
		const pub = process.env.AUTH_JWT_PUBLIC_KEY;

		if (!priv || !pub) throw new Error('tokens: AUTH_JWT_PRIVATE_KEY / AUTH_JWT_PUBLIC_KEY not set');

		privateKey = await importPKCS8(priv.replace(/\\n/g, '\n'), 'EdDSA');
		publicKey = await importSPKI(pub.replace(/\\n/g, '\n'), 'EdDSA');
	}

	return { privateKey: privateKey!, publicKey: publicKey! };
};

/** Issue a short-lived access token for a uid. */
export const issueAccessToken = async (uid: string): Promise<string> => {
	const { privateKey } = await getKeys();

	return await new SignJWT({})
		.setProtectedHeader({ alg: 'EdDSA' })
		.setSubject(uid)
		.setIssuer(ISSUER)
		.setAudience(AUDIENCE)
		.setIssuedAt()
		.setExpirationTime(ACCESS_TOKEN_TTL)
		.sign(privateKey);
};

/**
 * Verify an access token. Returns the uid, or undefined if invalid/expired.
 * Same contract as upstream decodeUserIdToken.
 */
export const verifyAccessToken = async (token: string): Promise<string | undefined> => {
	try {
		const { publicKey } = await getKeys();
		const { payload } = await jwtVerify(token, publicKey, {
			algorithms: ['EdDSA'],
			issuer: ISSUER,
			audience: AUDIENCE,
		});
		return payload.sub;
	} catch {
		return undefined;
	}
};

// ---------------------------------------------------------------------------
// One-time email login tokens (passwordless flow)
// ---------------------------------------------------------------------------

type EmailTokenRecord = {
	token_hash: string;
	uid: string;
	expires_at: string; // ISO
};

type EmailTokenFile = EmailTokenRecord[];

const EMAIL_TOKENS_PATH = 'identity/email_tokens.txt';
const EMAIL_TOKEN_TTL_MS = 15 * 60 * 1000;

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

const readTokens = async (): Promise<EmailTokenFile> => {
	const raw = await getFileFromStorage({ type: 'api', path: EMAIL_TOKENS_PATH });
	return raw ? (JSON.parse(raw) as EmailTokenFile) : [];
};

const writeTokens = async (tokens: EmailTokenFile) => {
	await uploadFileToStorage(JSON.stringify(tokens), { type: 'api', path: EMAIL_TOKENS_PATH });
};

/** Create a one-time login token for uid; the RAW token goes in the email link. */
export const createEmailLoginToken = async (uid: string): Promise<string> => {
	const raw = crypto.randomBytes(32).toString('base64url');
	const now = Date.now();

	const tokens = (await readTokens()).filter((t) => Date.parse(t.expires_at) > now);

	tokens.push({
		token_hash: sha256(raw),
		uid,
		expires_at: new Date(now + EMAIL_TOKEN_TTL_MS).toISOString(),
	});

	await writeTokens(tokens);
	return raw;
};

/** Consume (single-use) a login token. Returns uid, or undefined. */
export const consumeEmailLoginToken = async (raw: string): Promise<string | undefined> => {
	const hash = sha256(raw);
	const now = Date.now();

	const tokens = await readTokens();
	const match = tokens.find((t) => t.token_hash === hash && Date.parse(t.expires_at) > now);

	// remove the used token AND any expired ones, atomically with the read
	const remaining = tokens.filter((t) => t.token_hash !== hash && Date.parse(t.expires_at) > now);
	await writeTokens(remaining);

	return match?.uid;
};
