/**
 * Password hashing — argon2id.
 * npm i argon2
 */

import argon2 from 'argon2';

const OPTIONS: argon2.Options = {
	type: argon2.argon2id,
	memoryCost: 65536, // 64 MiB
	timeCost: 3,
	parallelism: 1,
};

export const hashPassword = async (password: string): Promise<string> => {
	return await argon2.hash(password, OPTIONS);
};

export const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
	try {
		return await argon2.verify(hash, password);
	} catch {
		return false;
	}
};

/** Minimal strength gate: length-first (passphrases beat complexity rules). */
export const isPasswordAcceptable = (password: string): boolean => {
	return typeof password === 'string' && password.length >= 12 && password.length <= 256;
};
