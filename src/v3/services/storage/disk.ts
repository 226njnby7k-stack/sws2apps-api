/**
 * Disk-backed storage adapter — replaces Firebase Cloud Storage.
 *
 * Self-hosted fork: stores the same encrypted text blobs the upstream API keeps
 * in a GCS bucket, on a local filesystem path instead (Docker volume in prod).
 *
 * Mirrors the exact upstream semantics:
 *   - same object paths ("v3/users/...", "v3/congregations/...", "v3/api/...")
 *   - metadata.updated = ISO 8601 string (here: file mtime)
 *   - prefix-based listing and prefix-based deletion
 *
 * Root directory comes from STORAGE_PATH (default: ./storage).
 * NOTE: file contents are already AES-encrypted by the caller (encryption.ts),
 * so this layer never sees plaintext congregation data.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const STORAGE_ROOT = path.resolve(process.env.STORAGE_PATH || './storage');

// Monotonic per-process counter so concurrent writes to the same object never
// collide on a temp filename (pid + Date.now() alone collide within one ms).
let tmpSeq = 0;

export type StoredFileMetadata = {
	/** ISO 8601 last-modified timestamp — mirrors GCS metadata.updated */
	updated: string;
	/** ISO 8601 creation timestamp — mirrors GCS metadata.timeCreated */
	timeCreated: string;
};

export type StoredFile = {
	/** object name relative to storage root, e.g. "v3/users/abc/profile.txt" */
	name: string;
	metadata: StoredFileMetadata;
};

/**
 * Resolve an object name to an absolute path, guaranteed to stay inside
 * STORAGE_ROOT. Throws on traversal attempts ("..", absolute paths, etc.).
 *
 * Rejecting any ".." segment (before path.resolve collapses it) blocks not only
 * escape from STORAGE_ROOT but also *in-root* traversal that would cross from
 * one tenant's subtree into another's — e.g. an attacker-supplied person_uid of
 * "../../../users/<victim>/sessions". Legitimate object names are fixed
 * "v3/<kind>/<id>/<file>.txt" shapes and never contain "..", so this is
 * semantics-preserving. The GCS backend this replaces treated object names as
 * opaque literals, so this normalization risk is new to the disk adapter.
 */
const safeResolve = (objectName: string): string => {
	const segments = objectName.split(/[\\/]/);
	if (segments.some((segment) => segment === '..')) {
		throw new Error(`storage: illegal traversal segment in object name: ${objectName}`);
	}

	const resolved = path.resolve(STORAGE_ROOT, objectName);

	if (resolved !== STORAGE_ROOT && !resolved.startsWith(STORAGE_ROOT + path.sep)) {
		throw new Error(`storage: path escapes storage root: ${objectName}`);
	}

	return resolved;
};

/** Write (create or overwrite) an object. Creates parent directories. */
export const saveObject = async (objectName: string, data: string): Promise<void> => {
	const filePath = safeResolve(objectName);

	await fs.mkdir(path.dirname(filePath), { recursive: true });

	// write-to-temp + rename = atomic on POSIX; no torn files on crash.
	// The temp name must be unique per concurrent write to the same object,
	// otherwise two writers in the same millisecond share a temp path and the
	// second rename hits ENOENT after the first renames it away. A monotonic
	// counter + random suffix guarantees uniqueness.
	const unique = `${process.pid}-${Date.now()}-${(tmpSeq = (tmpSeq + 1) >>> 0)}-${crypto.randomBytes(4).toString('hex')}`;
	const tmpPath = `${filePath}.tmp-${unique}`;
	await fs.writeFile(tmpPath, data, 'utf-8');
	await fs.rename(tmpPath, filePath);
};

/** Read an object. Returns undefined if it does not exist. */
export const readObject = async (objectName: string): Promise<string | undefined> => {
	const filePath = safeResolve(objectName);

	try {
		return await fs.readFile(filePath, 'utf-8');
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
		throw err;
	}
};

/** Metadata for a single object. Returns undefined if it does not exist. */
export const statObject = async (objectName: string): Promise<StoredFileMetadata | undefined> => {
	const filePath = safeResolve(objectName);

	try {
		const stat = await fs.stat(filePath);
		return { updated: stat.mtime.toISOString(), timeCreated: stat.birthtime.toISOString() };
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
		throw err;
	}
};

/**
 * List all objects whose name starts with the given prefix.
 * Mirrors GCS bucket.getFiles({ prefix }).
 */
export const listObjects = async (prefix: string): Promise<StoredFile[]> => {
	const results: StoredFile[] = [];

	// The prefix may end mid-filename (GCS prefixes are string prefixes, not
	// directories), so walk from the deepest existing directory of the prefix.
	const prefixAbs = safeResolve(prefix);
	let walkRoot = prefixAbs;

	try {
		const stat = await fs.stat(walkRoot);
		if (!stat.isDirectory()) walkRoot = path.dirname(walkRoot);
	} catch {
		walkRoot = path.dirname(walkRoot);
	}

	const walk = async (dir: string): Promise<void> => {
		let entries;
		try {
			entries = await fs.readdir(dir, { withFileTypes: true });
		} catch (err) {
			if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
			throw err;
		}

		for (const entry of entries) {
			const full = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				await walk(full);
			} else if (entry.isFile() && !entry.name.includes('.tmp-')) {
				const objectName = path.relative(STORAGE_ROOT, full).split(path.sep).join('/');

				if (objectName.startsWith(prefix)) {
					const stat = await fs.stat(full);
					results.push({
						name: objectName,
						metadata: { updated: stat.mtime.toISOString(), timeCreated: stat.birthtime.toISOString() },
					});
				}
			}
		}
	};

	await walk(walkRoot);
	return results;
};

/**
 * Delete every object under a prefix.
 * Mirrors GCS bucket.deleteFiles({ prefix, force: true }).
 */
export const deleteObjectsByPrefix = async (prefix: string): Promise<void> => {
	if (!prefix || prefix.length === 0) return;

	const files = await listObjects(prefix);

	for (const file of files) {
		await fs.rm(safeResolve(file.name), { force: true });
	}

	// prune now-empty directories under the prefix, best-effort
	const prefixAbs = safeResolve(prefix);
	await fs.rm(prefixAbs, { recursive: true, force: true }).catch(() => undefined);
};
