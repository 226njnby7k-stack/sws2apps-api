import express from 'express';
import { body, header } from 'express-validator';
import { visitorChecker } from '../middleware/visitor_checker.js';
import {
	deleteUser,
	deleteUserSession,
	disableUser2FA,
	getAuxiliaryApplications,
	getUserSecretToken,
	getUserSessions,
	getUserUpdates,
	joinCongregation,
	postUserReport,
	registerPassword,
	retrieveUserBackup,
	saveUserBackup,
	saveUserChunkedBackup,
	submitAuxiliaryApplication,
	userLogout,
	userPostFeedback,
	validateUser,
} from '../controllers/users_controller.js';

const router = express.Router();

// activate middleware at this point
router.use(visitorChecker());

// Object-level authorization: every /users/:id route is a self-service action
// (own 2fa, sessions, backup, applications, erase, ...). Bind the :id param to
// the authenticated user so one account can't act on another's by guessing/
// leaking its id (congregation admins are handed member ids). visitorChecker has
// already set res.locals.currentUser.
router.param('id', (req, res, next, id) => {
	const user = res.locals.currentUser;

	if (!user || user.id !== id) {
		res.locals.type = 'warn';
		res.locals.message = 'a user may only act on their own account';
		res.status(403).json({ message: 'FORBIDDEN' });
		return;
	}

	next();
});

// validate user for active session
router.get('/validate-me', validateUser);

// logout current user session
router.get('/logout', userLogout);

// request access to a congregation
router.post(
	'/:id/join-congregation',
	body('country_code').isString().notEmpty(),
	body('cong_name').isString().notEmpty(),
	body('firstname').isString().notEmpty(),
	body('lastname').isString(),
	joinCongregation
);

// get user 2fa token
router.get('/:id/2fa', getUserSecretToken);

// disable user 2fa
router.get('/:id/2fa/disable', disableUser2FA);

// get user sessions
router.get('/:id/sessions', getUserSessions);

// delete user session
router.delete('/:id/sessions', body('identifier').notEmpty(), deleteUserSession);

// get auxiliary pioneer applications
router.get('/:id/applications', getAuxiliaryApplications);

// submit auxiliary pioneer application
router.post('/:id/applications', body('application').isObject().notEmpty(), submitAuxiliaryApplication);

// post field service report
router.post('/:id/field-service-reports', body('report').isObject().notEmpty(), postUserReport);

// retrieve congregation backup
router.get('/:id/backup', header('metadata').isString(), retrieveUserBackup);

// save congregation backup in chunk
router.post(
	'/:id/backup/chunked',
	header('metadata').isString(),
	body('uploadId').isString().notEmpty(),
	body('chunkIndex').toInt().isNumeric().notEmpty(),
	body('totalChunks').toInt().isNumeric().notEmpty(),
	body('chunkData').isString().notEmpty(),
	saveUserChunkedBackup
);

// save congregation backup
router.post('/:id/backup', body('cong_backup').isObject(), saveUserBackup);

// get user updates
router.get('/:id/updates-routine', getUserUpdates);

// set a password on the authenticated user's own account (enables password-login)
router.post('/:id/register-password', body('password').isString().notEmpty(), registerPassword);

// get user updates
router.post('/:id/feedback', body('subject').notEmpty().isString(), body('message').notEmpty().isString(), userPostFeedback);

// delete user
router.delete('/:id/erase', deleteUser);

export default router;
