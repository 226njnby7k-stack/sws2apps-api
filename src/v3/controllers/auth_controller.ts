import crypto from 'node:crypto';
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { generateTokenDev } from '../dev/setup.js';
import { UsersList } from '../classes/Users.js';
import { UserAuthResponse, UserSession } from '../definition/user.js';
import { retrieveVisitorDetails } from '../services/ip_details/auth_utils.js';
import { CongregationsList } from '../classes/Congregations.js';
import { formatError } from '../utils/format_log.js';
import { decodeUserIdToken } from '../services/firebase/users.js';
import { consumeEmailLoginToken, createEmailLoginToken, issueAccessToken } from '../services/identity/tokens.js';
import { withLock } from '../services/identity/lock.js';
import { findUidByEmail, getCredentials } from '../services/identity/store.js';
import { verifyPassword } from '../services/identity/passwords.js';
import { cookieOptions } from '../utils/app.js';
import { ROLE_MASTER_KEY } from '../constant/base.js';
import { MailClient } from '../config/mail_config.js';

const isDev = process.env.NODE_ENV === 'development';

// Serializes the check-and-clear of the emailed OTP so two concurrent requests
// can't both accept the same code (single-use, like consumeEmailLoginToken).
// Coarse key = bounded lock map (see services/identity/lock.ts).
const OTP_CONSUME_LOCK = 'identity/otp-consume';

// Constant-time comparison for short equal-length secrets (the 6-digit OTP), so a
// wrong code can't be recovered digit-by-digit via response timing.
const constantTimeEquals = (a: string, b: string): boolean => {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	if (ab.length !== bb.length) return false;
	return crypto.timingSafeEqual(ab, bb);
};

// Origins we are willing to embed in an outgoing passwordless login email.
// The request Origin header is attacker-controlled on an unauthenticated
// endpoint, so it must never be trusted verbatim — otherwise the real service
// would email a victim a login link (carrying a one-time code) pointing at an
// attacker domain. We validate against this allowlist and fall back to the
// canonical app origin when the request origin is not allowed. NOTE: this is
// deliberately NARROWER than app.ts's CORS `whitelist` — a login link must only
// ever point at a real app frontend, never at the admin consoles. Keep separate.
const APP_ORIGIN_ALLOWLIST = [
	'https://organized-app.com',
	'https://staging.organized-app.com',
	...(process.env.APP_ORIGIN ? [process.env.APP_ORIGIN] : []),
];

const CANONICAL_APP_ORIGIN = process.env.APP_ORIGIN || 'https://organized-app.com';

const resolveAppOrigin = (requestOrigin: string | undefined): string => {
	if (requestOrigin) {
		if (APP_ORIGIN_ALLOWLIST.includes(requestOrigin)) return requestOrigin;
		if (isDev && /^https?:\/\/localhost(:\d+)?$/.test(requestOrigin)) return requestOrigin;
	}

	return CANONICAL_APP_ORIGIN;
};

export const loginUser = async (req: Request, res: Response) => {
	const userIP = req.clientIp!;

	// validate through express middleware
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const msg = formatError(errors);

		res.locals.type = 'warn';
		res.locals.message = `invalid input: ${msg}`;

		res.status(400).json({ message: 'error_api_bad-request' });

		return;
	}

	// decode authorization
	const idToken = req.headers.authorization!.split('Bearer ')[1];
	const uid = await decodeUserIdToken(idToken);

	if (!uid) {
		res.locals.type = 'warn';
		res.locals.message = 'the idToken received is invalid';
		res.status(404).json({ message: 'error_auth_invalid-token' });
		return;
	}

	const visitorid: string = req.signedCookies.visitorid || crypto.randomUUID();
	let authUser = UsersList.findByAuthUid(uid);
	let newSessions: UserSession[] = [];

	if (authUser) {
		newSessions = authUser.sessions?.filter((record) => record.visitorid !== visitorid) || [];
	}

	if (!authUser) {
		authUser = await UsersList.create({ auth_uid: uid, firstname: '', lastname: '' });
	}

	const newSession: UserSession = {
		mfaVerified: false,
		last_seen: new Date().toISOString(),
		visitorid: visitorid,
		visitor_details: await retrieveVisitorDetails(userIP, req),
		identifier: crypto.randomUUID(),
	};

	newSessions.push(newSession);

	await authUser.updateSessions(newSessions);

	if (authUser.profile.mfa_enabled) {
		res.locals.type = 'info';
		res.locals.message = 'user required to verify mfa';

		res.cookie('visitorid', visitorid, cookieOptions(req));

		if (isDev) {
			const tokenDev = generateTokenDev(authUser.email!, authUser.profile.secret!);
			console.log('Use this code to login:', tokenDev);

			res.status(200).json({ message: 'MFA_VERIFY', code: tokenDev });
		} else {
			res.status(200).json({ message: 'MFA_VERIFY' });
		}

		return;
	}

	const userInfo: UserAuthResponse = {
		message: 'TOKEN_VALID',
		id: authUser.id,
		app_settings: {
			user_settings: {
				firstname: authUser.profile.firstname,
				lastname: authUser.profile.lastname,
				role: authUser.profile.role,
				mfa: 'not_enabled',
			},
		},
	};

	if (authUser.profile.congregation?.id) {
		const userCong = CongregationsList.findById(authUser.profile.congregation.id);

		if (userCong) {
			const userRole = authUser.profile.congregation.cong_role;
			const masterKeyNeeded = userRole.some((role) => ROLE_MASTER_KEY.includes(role));

			userInfo.app_settings.user_settings.user_local_uid = authUser.profile.congregation.user_local_uid;
			userInfo.app_settings.user_settings.user_members_delegate = authUser.profile.congregation.user_members_delegate;
			userInfo.app_settings.user_settings.cong_role = authUser.profile.congregation.cong_role;

			const midweek = userCong.settings.midweek_meeting.map((record) => {
				return { type: record.type, time: record.time, weekday: record.weekday };
			});

			const weekend = userCong.settings.weekend_meeting.map((record) => {
				return { type: record.type, time: record.time, weekday: record.weekday };
			});

			userInfo.app_settings.cong_settings = {
				id: authUser.profile.congregation.id,
				cong_circuit: userCong.settings.cong_circuit,
				cong_name: userCong.settings.cong_name,
				cong_prefix: userCong.settings.cong_prefix,
				cong_number: userCong.settings.cong_number,
				country_code: userCong.settings.country_code,
				cong_access_code: userCong.settings.cong_access_code,
				cong_master_key: masterKeyNeeded ? userCong.settings.cong_master_key : undefined,
				cong_location: userCong.settings.cong_location,
				midweek_meeting: midweek,
				weekend_meeting: weekend,
			};
		}
	}

	res.locals.type = 'info';
	res.locals.message = 'user successfully logged in without MFA';

	res.cookie('visitorid', visitorid, cookieOptions(req));
	res.status(200).json(userInfo);
};

export const createSignInLink = async (req: Request, res: Response) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const msg = formatError(errors);

		res.locals.type = 'warn';
		res.locals.message = `invalid input: ${msg}`;

		res.status(400).json({ message: 'error_api_bad-request' });

		return;
	}

	const { email } = req.body;
	const language = (req.headers?.applanguage as string) || 'eng';

	const origin = resolveAppOrigin(req.headers.origin);
	const { link, otp } = await UsersList.generatePasswordLessLink({ email, origin });

	const MAIL_ENABLED = process.env.MAIL_ENABLED === 'true';

	if (MAIL_ENABLED) {
		req.i18n.changeLanguage(language);

		const options = {
			to: email,
			subject: req.t('tr_login'),
			template: 'login',
			context: {
				loginTitle: req.t('tr_login'),
				loginDesc: req.t('tr_loginDesc'),
				link,
				otp,
				loginButton: req.t('tr_loginBtn'),
				loginAltText: req.t('tr_loginAltText'),
				loginIgnoreText: req.t('tr_loginIgnoreText'),
				loginOTP: req.t('tr_loginOTP'),
				loginOTPDuration: req.t('tr_loginOTPDuration'),
				copyright: new Date().getFullYear(),
			},
		};

		MailClient.sendEmail(options, 'Passwordless link sent to user');

		res.locals.type = 'info';
		res.locals.message = 'passwordless link will be sent to user';
		res.status(200).json({ message: 'SIGNIN_LINK_SEND' });
		return;
	}

	// Mail is disabled. Returning the raw link/otp is a DEV-ONLY convenience —
	// in production it would hand an unauthenticated caller a login code for any
	// email (account takeover). Fail closed outside development.
	if (isDev) {
		res.locals.type = 'info';
		res.locals.message = 'passwordless link returned (dev, mail disabled)';
		res.status(200).json({ link, otp });
		return;
	}

	res.locals.type = 'error';
	res.locals.message = 'mail is not configured; passwordless login unavailable';
	res.status(500).json({ message: 'MAIL_NOT_CONFIGURED' });
};

export const verifyPasswordlessInfo = async (req: Request, res: Response) => {
	const userIP = req.clientIp!;
	const isDev = process.env.NODE_ENV === 'development';

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const msg = formatError(errors);

		res.locals.type = 'warn';
		res.locals.message = `invalid input: ${msg}`;

		res.status(400).json({ message: 'error_api_bad-request' });

		return;
	}

	// decode authorization
	const idToken = req.headers.authorization!.split('Bearer ')[1];
	const uid = await decodeUserIdToken(idToken);

	if (!uid) {
		res.locals.type = 'warn';
		res.locals.message = 'the idToken received is invalid';
		res.status(404).json({ message: 'error_auth_invalid-token' });
		return;
	}

	const authUser = UsersList.findByAuthUid(uid)!;

	const visitorid = req.signedCookies.visitorid || crypto.randomUUID();

	let newSessions: UserSession[] = [];

	if (authUser) {
		newSessions = authUser.sessions?.filter((session) => session.visitorid !== visitorid) || [];
	}
	const newSession: UserSession = {
		mfaVerified: false,
		last_seen: new Date().toISOString(),
		visitorid: visitorid,
		visitor_details: await retrieveVisitorDetails(userIP, req),
		identifier: crypto.randomUUID(),
	};

	newSessions.push(newSession);

	await authUser.updateSessions(newSessions);

	if (authUser.profile.mfa_enabled) {
		res.locals.type = 'info';
		res.locals.message = 'user required to verify mfa';

		res.cookie('visitorid', visitorid, cookieOptions(req));
		if (isDev) {
			const tokenDev = generateTokenDev(authUser.email!, authUser.profile.secret!);
			console.log('Use this code to login:', tokenDev);

			res.status(200).json({ message: 'MFA_VERIFY', code: tokenDev });
		} else {
			res.status(200).json({ message: 'MFA_VERIFY' });
		}

		return;
	}

	const userInfo: UserAuthResponse = {
		message: 'TOKEN_VALID',
		id: authUser.id,
		app_settings: {
			user_settings: {
				firstname: authUser.profile.firstname,
				lastname: authUser.profile.lastname,
				role: authUser.profile.role,
				mfa: 'not_enabled',
			},
		},
	};

	if (authUser.profile.congregation?.id) {
		const userCong = CongregationsList.findById(authUser.profile.congregation.id);

		const userRole = authUser.profile.congregation.cong_role;
		const masterKeyNeeded = userRole.some((role) => ROLE_MASTER_KEY.includes(role));

		if (userCong) {
			userInfo.app_settings.user_settings.user_local_uid = authUser.profile.congregation.user_local_uid;
			userInfo.app_settings.user_settings.user_members_delegate = authUser.profile.congregation.user_members_delegate;
			userInfo.app_settings.user_settings.cong_role = authUser.profile.congregation.cong_role;

			const midweek = userCong.settings.midweek_meeting.map((record) => {
				return { type: record.type, time: record.time, weekday: record.weekday };
			});

			const weekend = userCong.settings.weekend_meeting.map((record) => {
				return { type: record.type, time: record.time, weekday: record.weekday };
			});

			userInfo.app_settings.cong_settings = {
				id: authUser.profile.congregation.id,
				cong_circuit: userCong.settings.cong_circuit,
				cong_name: userCong.settings.cong_name,
				cong_prefix: userCong.settings.cong_prefix,
				cong_number: userCong.settings.cong_number,
				country_code: userCong.settings.country_code,
				cong_access_code: userCong.settings.cong_access_code,
				cong_master_key: masterKeyNeeded ? userCong.settings.cong_master_key : undefined,
				cong_location: userCong.settings.cong_location,
				midweek_meeting: midweek,
				weekend_meeting: weekend,
			};
		}
	}

	res.locals.type = 'info';
	res.locals.message = 'user successfully logged in without MFA';

	res.cookie('visitorid', visitorid, cookieOptions(req));
	res.status(200).json(userInfo);
};

export const verifyEmailToken = async (req: Request, res: Response) => {
	const userIP = req.clientIp!;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const msg = formatError(errors);

		res.locals.type = 'warn';
		res.locals.message = `invalid input: ${msg}`;

		res.status(400).json({ message: 'error_api_bad-request' });

		return;
	}

	const email = req.body.email as string;
	const token = req.body.token as string;

	const authUser = UsersList.findByEmail(email);

	// Unknown email, no pending OTP, and wrong/expired OTP all return the SAME
	// generic response so this endpoint isn't an account-existence oracle.
	if (!authUser) {
		res.locals.type = 'warn';
		res.locals.message = 'email token verify failed: no such user';
		res.status(403).json({ message: 'error_auth_invalid-token' });
		return;
	}

	// Validate AND consume the one-time OTP as a single atomic operation under a
	// lock, so two concurrent requests can't both accept the same code (single-use,
	// read-check-invalidate — same discipline as consumeEmailLoginToken). No pending
	// OTP, wrong code, and expired code all return false and fall through to the
	// same generic 403 below (no account-existence / validity oracle).
	const otpAccepted = await withLock(OTP_CONSUME_LOCK, async () => {
		const otp = authUser.profile.email_otp;
		if (!otp) return false;
		if (Date.now() > otp.expiredAt) return false;
		if (!constantTimeEquals(otp.code, String(token))) return false;

		// Consume it now, inside the lock, before any concurrent request re-reads it.
		const profile = structuredClone(authUser.profile);
		delete profile.email_otp;
		await authUser.updateProfile(profile);
		return true;
	});

	if (!otpAccepted) {
		res.locals.type = 'warn';
		res.locals.message = 'email otp invalid or already used';
		res.status(403).json({ message: 'error_auth_invalid-token' });
		return;
	}

	const visitorid = req.signedCookies.visitorid || crypto.randomUUID();

	let newSessions: UserSession[] = [];

	if (authUser) {
		newSessions = authUser.sessions?.filter((session) => session.visitorid !== visitorid) || [];
	}
	const newSession: UserSession = {
		mfaVerified: !authUser.profile.mfa_enabled,
		last_seen: new Date().toISOString(),
		visitorid: visitorid,
		visitor_details: await retrieveVisitorDetails(userIP, req),
		identifier: crypto.randomUUID(),
	};

	newSessions.push(newSession);

	await authUser.updateSessions(newSessions);

	// MFA gate: with TOTP 2FA enabled, the emailed OTP alone is not sufficient.
	// Return the SAME MFA_VERIFY signal /user-login uses so the client routes to
	// the existing verify-MFA screen (no new step). The one-time login code is
	// included because the email flow acquires its access token here — the client
	// exchanges it for a JWT, then calls /mfa/verify-token to clear the gate.
	// NOTE: upstream sets mfaVerified:true here unconditionally (no TOTP gate);
	// this gate is our divergence — see PROJECT.md session log.
	if (authUser.profile.mfa_enabled) {
		res.locals.type = 'info';
		res.locals.message = 'user required to verify mfa';

		res.cookie('visitorid', visitorid, cookieOptions(req));

		const customToken = await createEmailLoginToken(authUser.profile.auth_uid!);

		if (isDev) {
			const tokenDev = generateTokenDev(authUser.email!, authUser.profile.secret!);
			res.status(200).json({ message: 'MFA_VERIFY', code: tokenDev, custom_token: customToken });
		} else {
			res.status(200).json({ message: 'MFA_VERIFY', custom_token: customToken });
		}

		return;
	}

	const userInfo: UserAuthResponse = {
		message: 'TOKEN_VALID',
		id: authUser.id,
		app_settings: {
			user_settings: {
				firstname: authUser.profile.firstname,
				lastname: authUser.profile.lastname,
				role: authUser.profile.role,
				mfa: 'not_enabled',
			},
		},
	};

	if (authUser.profile.congregation?.id) {
		const userCong = CongregationsList.findById(authUser.profile.congregation.id);

		const userRole = authUser.profile.congregation.cong_role;
		const masterKeyNeeded = userRole.some((role) => ROLE_MASTER_KEY.includes(role));

		if (userCong) {
			userInfo.app_settings.user_settings.user_local_uid = authUser.profile.congregation.user_local_uid;
			userInfo.app_settings.user_settings.user_members_delegate = authUser.profile.congregation.user_members_delegate;
			userInfo.app_settings.user_settings.cong_role = authUser.profile.congregation.cong_role;

			const midweek = userCong.settings.midweek_meeting.map((record) => {
				return { type: record.type, time: record.time, weekday: record.weekday };
			});

			const weekend = userCong.settings.weekend_meeting.map((record) => {
				return { type: record.type, time: record.time, weekday: record.weekday };
			});

			userInfo.app_settings.cong_settings = {
				id: authUser.profile.congregation.id,
				cong_circuit: userCong.settings.cong_circuit,
				cong_name: userCong.settings.cong_name,
				cong_prefix: userCong.settings.cong_prefix,
				cong_number: userCong.settings.cong_number,
				country_code: userCong.settings.country_code,
				cong_access_code: userCong.settings.cong_access_code,
				cong_master_key: masterKeyNeeded ? userCong.settings.cong_master_key : undefined,
				cong_location: userCong.settings.cong_location,
				midweek_meeting: midweek,
				weekend_meeting: weekend,
			};
		}
	}

	res.locals.type = 'info';
	res.locals.message = 'user successfully logged with email OTP';

	// Return a one-time login code (not a JWT directly) so the client's single
	// userSignInCustomToken() path is uniform: both the email-link and OTP flows
	// hand a one-time code to /token-login, which exchanges it for an access JWT.
	const customToken = await createEmailLoginToken(authUser.profile.auth_uid!);

	userInfo.custom_token = customToken;

	res.cookie('visitorid', visitorid, cookieOptions(req));
	res.status(200).json(userInfo);
};

// A valid argon2id hash of a throwaway value. Verifying against it when no
// account exists equalizes response time with the real path, so a caller can't
// tell "unknown email" from "wrong password" by timing (AUTH_DESIGN §6).
const DUMMY_PASSWORD_HASH = '$argon2id$v=19$m=65536,t=3,p=1$BL+C97xOfh5LG9Jldn0fEQ$jLHA/3RRfOsnLGFQkFPmn2it60qN26naBOjwMCD8S2g';

// POST /auth/password-login { email, password } → { token }
// Mints an access JWT the client then presents to /user-login as Bearer,
// exactly like the old Firebase idToken. Generic error for unknown email or
// wrong password (no user enumeration); rate-limited in routes/auth.ts.
export const passwordLogin = async (req: Request, res: Response) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.locals.type = 'warn';
		res.locals.message = `invalid input: ${formatError(errors)}`;
		res.status(400).json({ message: 'error_api_bad-request' });
		return;
	}

	const { email, password } = req.body as { email: string; password: string };

	const uid = await findUidByEmail(email);
	const record = uid ? await getCredentials(uid) : undefined;

	const passwordOk = await verifyPassword(record?.password_hash ?? DUMMY_PASSWORD_HASH, password);

	if (!record || !record.password_hash || !passwordOk) {
		res.locals.type = 'warn';
		res.locals.message = 'invalid credentials';
		res.status(401).json({ message: 'error_auth_invalid-credentials' });
		return;
	}

	const token = await issueAccessToken(record.uid);

	res.locals.type = 'info';
	res.locals.message = 'password login success';
	res.status(200).json({ token });
};

// POST /auth/token-login { code } → { token }
// Completes the passwordless email-link flow: consume the one-time code and
// mint an access JWT. Rate-limited in routes/auth.ts.
export const tokenLogin = async (req: Request, res: Response) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.locals.type = 'warn';
		res.locals.message = `invalid input: ${formatError(errors)}`;
		res.status(400).json({ message: 'error_api_bad-request' });
		return;
	}

	const { code } = req.body as { code: string };

	const uid = await consumeEmailLoginToken(code);

	if (!uid) {
		res.locals.type = 'warn';
		res.locals.message = 'invalid or expired login code';
		res.status(401).json({ message: 'error_auth_invalid-token' });
		return;
	}

	const token = await issueAccessToken(uid);

	res.locals.type = 'info';
	res.locals.message = 'email token login success';
	res.status(200).json({ token });
};

// POST /session-token → { token }
// Silent access-token refresh. Access JWTs live 15 minutes; when one expires the
// client mints a fresh one here, authorized solely by the signed httpOnly
// visitorid session cookie. That cookie IS the revocable "refresh token" —
// upstream's session store gates it, so a terminated session cannot refresh.
// No credentials are accepted here, so it is not brute-forceable.
export const sessionToken = async (req: Request, res: Response) => {
	const visitorid = req.signedCookies.visitorid;

	if (!visitorid) {
		res.locals.type = 'warn';
		res.locals.message = 'no device session';
		res.status(401).json({ message: 'error_auth_invalid-token' });
		return;
	}

	const user = UsersList.findByVisitorId(visitorid);
	const session = user?.sessions?.find((record) => record.visitorid === visitorid);

	if (!user || !session) {
		res.clearCookie('visitorid');
		res.locals.type = 'warn';
		res.locals.message = 'session revoked or not found';
		res.status(401).json({ message: 'error_auth_invalid-token' });
		return;
	}

	// preserve the MFA gate: an MFA account must have cleared 2FA on this session
	if (user.profile.mfa_enabled && !session.mfaVerified) {
		res.locals.type = 'warn';
		res.locals.message = 'two factor authentication required';
		res.status(401).json({ message: 'LOGIN_FIRST' });
		return;
	}

	const token = await issueAccessToken(user.profile.auth_uid!);

	res.locals.type = 'info';
	res.locals.message = 'session token refresh';
	res.status(200).json({ token });
};
