/**
 * Whether `e` is the rejection a spawn promise produces after the child ran
 * and exited: a numeric exit `code`, or the `signal` that ended it. A failure
 * to start the child at all (e.g. `ENOENT`, where `code` is a string) is not.
 *
 * The registry's `isSpawnError` is avoided because it never matches (it
 * requires `code` to be both a number and a string).
 */
export function isSubprocessExitError(e: unknown): boolean {
  if (e === null || typeof e !== 'object') {
    return false
  }
  const { code, signal } = e as { code?: unknown; signal?: unknown }
  return typeof code === 'number' || typeof signal === 'string'
}

/**
 * Await the spawn promise of a wrapped package manager (`socket npm`,
 * `socket npx`, `socket pnpm`, `socket yarn`).
 *
 * A non-zero exit is the child's own result, not a wrapper failure: npm exits
 * 1 from `npm outdated` when updates are available, for example. The `exit`
 * handler already forwards the child's code or signal, so treating the
 * rejection as an error would only make the top-level handler print an extra
 * "Unexpected error" (as a second JSON document under `--json`).
 *
 * Resolves `true` when the child exited 0 and `false` when it exited non-zero
 * or was killed by a signal. Failures that never produced an exit are rethrown.
 */
export async function awaitWrappedSubprocess(
  spawnPromise: Promise<unknown>,
): Promise<boolean> {
  try {
    await spawnPromise
    return true
  } catch (e) {
    if (isSubprocessExitError(e)) {
      return false
    }
    throw e
  }
}
