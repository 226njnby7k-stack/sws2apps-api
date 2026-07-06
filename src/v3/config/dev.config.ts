import { LogLevel } from '@logtail/types';
import { logger } from '../services/logger/logger.js';
import { UserGlobalRoleType, UserProfile } from '../definition/user.js';
import { setUserProfile } from '../services/firebase/users.js';
import { createIdentity, findUidByEmail } from '../services/identity/store.js';
import { hashPassword } from '../services/identity/passwords.js';

// Local-only convenience: a fixed password for the seeded dev accounts.
const DEV_PASSWORD = 'organized-local-dev';

export const createDevTestUsers = async () => {
	try {
		if (process.env.NODE_ENV !== 'development') return;

		const users = [
			{
				email: 'admin@dummyjson.com',
				firstname: 'admin',
				lastname: 'local',
				role: 'admin' as UserGlobalRoleType,
			},
			{
				email: 'user@dummyjson.com',
				firstname: 'user',
				lastname: 'local',
				role: 'vip' as UserGlobalRoleType,
			},
		];

		for (const user of users) {
			// skip if an identity already exists for this email
			const existing = await findUidByEmail(user.email);
			if (existing) continue;

			logger(LogLevel.Info, `creating ${user.role} dev account`);

			// STEP 1: create the identity record (email -> uid, argon2id password)
			const record = await createIdentity(user.email, await hashPassword(DEV_PASSWORD));

			// STEP 2: create the app user profile, linked by the generated uid
			const id = crypto.randomUUID().toUpperCase();

			const profile: UserProfile = {
				firstname: { value: user.firstname, updatedAt: new Date().toISOString() },
				lastname: { value: user.lastname, updatedAt: new Date().toISOString() },
				role: user.role,
				auth_uid: record.uid,
				createdAt: new Date().toISOString(),
			};

			await setUserProfile(id, profile);

			logger(LogLevel.Info, `dev ${user.role} account created (password: ${DEV_PASSWORD})`);
		}
	} catch (error) {
		console.error(error);
	}
};
