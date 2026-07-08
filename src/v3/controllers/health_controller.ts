/**
 * Health check — for the Docker Compose healthcheck and any future uptime
 * monitoring. Deliberately does more than "process is running": it verifies
 * the storage volume is actually mounted, writable, and readable, since that's
 * the failure mode that matters in production (a bad volume mount, permissions
 * issue, or full disk won't crash the process — it'll just silently break
 * every request that touches storage).
 *
 * Mount this at GET /health, unauthenticated (Compose calls it from inside the
 * network; keep it out of any CORS whitelist / auth-required middleware).
 */

import { Request, Response } from 'express';
import { saveObject, readObject, deleteObjectsByPrefix } from '../services/storage/disk.js';

const PROBE_PATH = '_health/probe.txt';

export const getHealth = async (req: Request, res: Response) => {
	try {
		const stamp = new Date().toISOString();

		await saveObject(PROBE_PATH, stamp);
		const readBack = await readObject(PROBE_PATH);

		if (readBack !== stamp) {
			res.locals.type = 'error';
			res.locals.message = 'health check: storage round-trip mismatch';
			res.status(503).json({ status: 'unhealthy', reason: 'storage_mismatch' });
			return;
		}

		res.status(200).json({ status: 'ok', storage: 'ok', time: stamp });
	} catch (err) {
		res.locals.type = 'error';
		res.locals.message = `health check failed: ${(err as Error).message}`;
		res.status(503).json({ status: 'unhealthy', reason: 'storage_unreachable' });
	} finally {
		// don't let probe files accumulate
		await deleteObjectsByPrefix('_health/').catch(() => undefined);
	}
};
