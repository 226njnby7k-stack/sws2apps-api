import express from 'express';
import { check } from 'express-validator';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { visitorChecker } from '../middleware/visitor_checker.js';
import { verifyToken } from '../controllers/mfa_controller.js';

const router = express.Router();

router.use(visitorChecker());

// Tight cap on TOTP guesses per device+IP (a 6-digit code must not be
// brute-forceable by a stage-1 session). 5 attempts / 15 min.
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

export default router;
