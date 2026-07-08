import express from 'express';
import { check } from 'express-validator';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { visitorChecker } from '../middleware/visitor_checker.js';
import { regenerateRecoveryCodes, verifyRecoveryCode, verifyToken } from '../controllers/mfa_controller.js';

const router = express.Router();

router.use(visitorChecker());

// Tight cap on guesses per device+IP so neither a 6-digit TOTP nor a recovery code
// is brute-forceable by a stage-1 session. 5 attempts / 15 min.
const mfaVerifyLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => `${ipKeyGenerator(req.ip || req.clientIp || '')}:${req.signedCookies?.visitorid || ''}`,
	message: JSON.stringify({ message: 'TOO_MANY_REQUESTS' }),
});

// 2fa check
router.post('/verify-token', mfaVerifyLimiter, check('token').isNumeric().isLength({ min: 6 }), verifyToken);

// recovery-code login (break-glass MFA fallback) — same rate limit as TOTP verify
router.post('/verify-recovery-code', mfaVerifyLimiter, check('code').isString().isLength({ min: 8, max: 64 }), verifyRecoveryCode);

// regenerate the recovery-code set — only reachable by a fully MFA-cleared session
// (not on visitor_checker's pre-MFA allowlist)
router.post('/recovery-codes', regenerateRecoveryCodes);

export default router;
