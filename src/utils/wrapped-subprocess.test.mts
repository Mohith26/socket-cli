import { describe, expect, it } from 'vitest'

import { spawn } from '@socketsecurity/registry/lib/spawn'

import {
  awaitWrappedSubprocess,
  isSubprocessExitError,
} from './wrapped-subprocess.mts'

describe('isSubprocessExitError', () => {
  it('matches a numeric exit code or a signal', () => {
    expect(isSubprocessExitError({ code: 1 })).toBe(true)
    expect(isSubprocessExitError({ code: null, signal: 'SIGINT' })).toBe(true)
  })

  it('does not match spawn failures or non-objects', () => {
    expect(isSubprocessExitError({ code: 'ENOENT' })).toBe(false)
    expect(isSubprocessExitError(new Error('boom'))).toBe(false)
    expect(isSubprocessExitError(null)).toBe(false)
    expect(isSubprocessExitError('command failed')).toBe(false)
  })
})

describe('awaitWrappedSubprocess', () => {
  it('resolves true when the child exits 0', async () => {
    const spawnPromise = spawn(process.execPath, ['-e', 'process.exit(0)'], {
      stdio: 'ignore',
    })
    await expect(awaitWrappedSubprocess(spawnPromise)).resolves.toBe(true)
  })

  it('resolves false instead of throwing when the child exits non-zero', async () => {
    // e.g. `npm outdated` exits 1 when updates are available.
    const spawnPromise = spawn(process.execPath, ['-e', 'process.exit(1)'], {
      stdio: 'ignore',
    })
    await expect(awaitWrappedSubprocess(spawnPromise)).resolves.toBe(false)
  })

  it('still throws when the child could not be started', async () => {
    const spawnPromise = spawn('socket-cli-command-that-does-not-exist', [], {
      stdio: 'ignore',
    })
    await expect(awaitWrappedSubprocess(spawnPromise)).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })
})
