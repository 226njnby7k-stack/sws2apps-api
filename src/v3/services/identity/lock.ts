/**
 * Minimal in-process async lock, keyed by string.
 *
 * The identity/token aggregates (index.txt, credential files, email tokens) are
 * read-modify-write JSON blobs. Because Node interleaves overlapping requests at
 * every `await`, two concurrent writers can both read the old file and clobber
 * each other's change — dropping an email→uid mapping (login lockout) or losing a
 * credential update — even in a single process. `withLock` serializes the
 * read-modify-write per key so those operations don't race.
 *
 * Keys are coarse and bounded (e.g. 'identity/index', 'identity/tokens'), so the
 * chain map does not grow unbounded.
 */
const tails: Record<string, Promise<unknown>> = {};

export const withLock = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
	const prev = tails[key] ?? Promise.resolve();

	// run fn only after the previous holder settles (success OR failure)
	const result = prev.catch(() => undefined).then(fn);

	// the next waiter chains off this one; swallow errors so the chain survives
	tails[key] = result.catch(() => undefined);

	return result;
};
