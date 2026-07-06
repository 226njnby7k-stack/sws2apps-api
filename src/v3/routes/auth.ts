import express from 'express';
import { body, header } from 'express-validator';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import {
	createSignInLink,
	loginUser,
	passwordLogin,
	sessionToken,
	tokenLogin,
	verifyEmailToken,
	verifyPasswordlessInfo,
} from '../controllers/auth_controller.js';
import { authBearerCheck } from '../services/validator/auth.js';

const router = express.Router();

// Strict limiter for credential-testing endpoints: 5 attempts / 15 min,
// keyed per IP + email so one attacker can't brute a single account, and
// a shared IP can't lock everyone out (AUTH_DESIGN §6).
const strictAuthLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => `${ipKeyGenerator(req.ip || req.clientIp || '')}:${String(req.body?.email || '').trim().toLowerCase()}`,
	message: JSON.stringify({ message: 'TOO_MANY_REQUESTS' }),
});

router.get('/user-login', header('Authorization').exists().notEmpty().isString().custom(authBearerCheck), loginUser);

router.post('/user-passwordless-login', strictAuthLimiter, body('email').isEmail(), createSignInLink);

router.post(
	'/user-passwordless-verify',
	header('Authorization').exists().notEmpty().isString().custom(authBearerCheck),
	verifyPasswordlessInfo
);

router.post(
	'/verify-email-token',
	strictAuthLimiter,
	body('email').isEmail(),
	body('token').isNumeric().isLength({ min: 6, max: 6 }),
	verifyEmailToken
);

// self-hosted identity (M4): password login and email-link completion
router.post(
	'/password-login',
	strictAuthLimiter,
	body('email').isEmail(),
	body('password').isString().notEmpty(),
	passwordLogin
);

router.post('/token-login', strictAuthLimiter, body('code').isString().notEmpty(), tokenLogin);

// silent access-token refresh, authorized by the signed visitorid session cookie
router.post('/session-token', sessionToken);

export default router;
