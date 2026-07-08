import { CookieOptions, Request } from 'express';
import { API_VAR } from '../../index.js';

const isLocalRequest = (req: Request) => {
	const host = req.get('host');
	return host?.includes('localhost');
};

export const cookieOptions = (req: Request): CookieOptions => {
	const isLocalHost = isLocalRequest(req);

	// COOKIE_SAMESITE lets the deployment pin the session cookie's SameSite. A
	// same-origin self-hosted deploy (client + API behind one Caddy domain) should
	// set 'lax' for CSRF defence-in-depth (audit §10 finding #4); the cross-site
	// SaaS setup needs 'none'. Falls back to the host-based default. 'none' requires
	// Secure, so force it there; localhost (no TLS) stays insecure otherwise.
	const configured = process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none' | undefined;
	const sameSite = configured ?? (isLocalHost ? 'lax' : 'none');

	return {
		httpOnly: true,
		signed: true,
		secure: sameSite === 'none' ? true : !isLocalHost,
		sameSite,
		maxAge: 400 * 24 * 60 * 60 * 1000,
	};
};

export const isValidClientVersion = (version: string) => {
	const parts1 = version.split('.').map(Number);
	const parts2 = API_VAR.MINIMUM_APP_VERSION.split('.').map(Number);

	const maxLength = Math.max(parts1.length, parts2.length);
	for (let i = 0; i < maxLength; i++) {
		const num1 = parts1[i] ?? 0;
		const num2 = parts2[i] ?? 0;

		if (num1 > num2) return true;
		if (num1 < num2) return false;
	}

	return true;
};
