import { Request, Response } from 'express';
import * as OTPAuth from 'otpauth';
import { validationResult } from 'express-validator';
import { UsersList } from '../classes/Users.js';
import { User } from '../classes/User.js';
import { CongregationsList } from '../classes/Congregations.js';
import { formatError } from '../utils/format_log.js';
import { UserAuthResponse } from '../definition/user.js';
import { ROLE_MASTER_KEY } from '../constant/base.js';
import { consumeRecoveryCode, countRecoveryCodes, generateRecoveryCodes } from '../services/identity/recovery.js';

// Standard TOKEN_VALID response (user + congregation settings) returned once the
// MFA gate is cleared — by either a TOTP or a recovery code. Shared so both paths
// hand the client identical data.
const buildMfaAuthResponse = (user: User): UserAuthResponse => {
	const userInfo: UserAuthResponse = {
		message: 'TOKEN_VALID',
		id: user.id,
		app_settings: {
			user_settings: {
				firstname: user.profile.firstname,
				lastname: user.profile.lastname,
				role: user.profile.role,
				mfa: 'enabled',
			},
		},
	};

	if (user.profile.congregation?.id) {
		const userCong = CongregationsList.findById(user.profile.congregation.id);

		const userRole = user.profile.congregation.cong_role;
		const masterKeyNeeded = userRole.some((role) => ROLE_MASTER_KEY.includes(role));

		if (userCong) {
			userInfo.app_settings.user_settings.user_local_uid = user.profile.congregation.user_local_uid;
			userInfo.app_settings.user_settings.user_members_delegate = user.profile.congregation.user_members_delegate;
			userInfo.app_settings.user_settings.cong_role = user.profile.congregation.cong_role;

			const midweek = userCong.settings.midweek_meeting.map((record) => {
				return { type: record.type, time: record.time, weekday: record.weekday };
			});

			const weekend = userCong.settings.weekend_meeting.map((record) => {
				return { type: record.type, time: record.time, weekday: record.weekday };
			});

			userInfo.app_settings.cong_settings = {
				id: user.profile.congregation.id,
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

	return userInfo;
};

export const verifyToken = async (req: Request, res: Response) => {
	const isProd = process.env.NODE_ENV === 'production';

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const msg = formatError(errors);

		res.locals.type = 'warn';
		res.locals.message = `invalid input: ${msg}`;

		res.status(400).json({ message: 'error_api_bad-request' });

		return;
	}

	const { token } = req.body;

	const { id, sessions } = res.locals.currentUser;

	const user = UsersList.findById(id)!;
	const secret = user.decryptSecret();

	// v2 2fa verification

	const totp = new OTPAuth.TOTP({
		issuer: isProd ? 'Organized' : 'Organized-dev',
		label: user.email,
		algorithm: 'SHA1',
		digits: 6,
		period: 30,
		secret: OTPAuth.Secret.fromBase32(secret.secret),
	});

	// Validate a token. `window: 1` accepts the current 30s step and ±1 adjacent
	// step for clock drift; totp.validate returns that delta (-1|0|1) or null.
	const delta = totp.validate({ token: token, window: 1 });

	if (delta === null || delta === undefined) {
		res.locals.type = 'warn';
		res.locals.message = 'OTP token invalid';
		res.status(403).json({ message: 'TOKEN_INVALID' });
		return;
	}

	const visitorid = req.signedCookies.visitorid;

	const newSessions = structuredClone(sessions);
	const findSession = newSessions.find((session) => session.visitorid === visitorid)!;

	// Reject replay: a given 30s TOTP step may be accepted at most once per
	// session, so a captured code can't be reused inside its ±1 window (~90s).
	const step = Math.floor(Date.now() / 1000 / 30) + delta;
	if (findSession.mfa_last_counter !== undefined && step <= findSession.mfa_last_counter) {
		res.locals.type = 'warn';
		res.locals.message = 'OTP token already used';
		res.status(403).json({ message: 'TOKEN_INVALID' });
		return;
	}
	findSession.mfa_last_counter = step;

	findSession.last_seen = new Date().toISOString();
	findSession.mfaVerified = true;

	// The first successful TOTP verify is the enrollment (mfa was not yet enabled) —
	// issue one-time recovery codes now and return them exactly once.
	const isEnrollment = !user.profile.mfa_enabled;

	await user.enableMFA();
	await user.updateSessions(newSessions);

	const userInfo = buildMfaAuthResponse(user);

	if (isEnrollment) {
		userInfo.recovery_codes = await generateRecoveryCodes(user.profile.auth_uid!);
	}

	res.locals.type = 'info';
	res.locals.message = 'OTP token verification success';
	res.status(200).json(userInfo);
};

/**
 * Recovery-code login: a break-glass alternative to TOTP when the authenticator is
 * lost. Reachable by a stage-1 (pre-MFA-cleared) session — visitor_checker allows
 * this path through the MFA gate, exactly like /verify-token — and rate-limited.
 * The code is consumed atomically (single-use).
 */
export const verifyRecoveryCode = async (req: Request, res: Response) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const msg = formatError(errors);
		res.locals.type = 'warn';
		res.locals.message = `invalid input: ${msg}`;
		res.status(400).json({ message: 'error_api_bad-request' });
		return;
	}

	const { code } = req.body as { code: string };

	const { id, sessions } = res.locals.currentUser;
	const user = UsersList.findById(id)!;

	// Recovery codes only exist for an MFA-enabled account.
	if (!user.profile.mfa_enabled) {
		res.locals.type = 'warn';
		res.locals.message = 'recovery code rejected: mfa not enabled';
		res.status(403).json({ message: 'TOKEN_INVALID' });
		return;
	}

	const accepted = await consumeRecoveryCode(user.profile.auth_uid!, String(code));

	if (!accepted) {
		res.locals.type = 'warn';
		res.locals.message = 'recovery code invalid or already used';
		res.status(403).json({ message: 'TOKEN_INVALID' });
		return;
	}

	const visitorid = req.signedCookies.visitorid;
	const newSessions = structuredClone(sessions);
	const findSession = newSessions.find((session) => session.visitorid === visitorid)!;

	findSession.last_seen = new Date().toISOString();
	findSession.mfaVerified = true;

	await user.updateSessions(newSessions);

	const userInfo = buildMfaAuthResponse(user);
	userInfo.recovery_codes_remaining = await countRecoveryCodes(user.profile.auth_uid!);

	res.locals.type = 'info';
	res.locals.message = 'recovery code verification success';
	res.status(200).json(userInfo);
};

/**
 * Regenerate the recovery-code set. Reachable only by a fully MFA-cleared session
 * (not on visitor_checker's pre-MFA allowlist), so a stage-1 attacker can't mint a
 * fresh set. Replaces (and thereby invalidates) any previous codes; returns the new
 * set exactly once.
 */
export const regenerateRecoveryCodes = async (req: Request, res: Response) => {
	const { id } = res.locals.currentUser;
	const user = UsersList.findById(id)!;

	if (!user.profile.mfa_enabled) {
		res.locals.type = 'warn';
		res.locals.message = 'cannot generate recovery codes: mfa not enabled';
		res.status(400).json({ message: 'MFA_NOT_ENABLED' });
		return;
	}

	const codes = await generateRecoveryCodes(user.profile.auth_uid!);

	res.locals.type = 'info';
	res.locals.message = 'recovery codes regenerated';
	res.status(200).json({ message: 'RECOVERY_CODES_CREATED', recovery_codes: codes });
};
