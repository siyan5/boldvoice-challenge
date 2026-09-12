import type { LiveActivityAttributes, LiveActivityContentState } from '../../../src/timer/liveActivityState';

const attributes: LiveActivityAttributes = { name: 'Math' };
const content: LiveActivityContentState = { isPaused: false, timerStartMs: 0, elapsedMs: 0, goalMs: 60000 };

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeFakeNative(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    areActivitiesEnabled: jest.fn(() => true),
    startActivity: jest.fn(() => Promise.resolve()),
    updateActivity: jest.fn(() => Promise.resolve()),
    endActivity: jest.fn(() => Promise.resolve()),
    getActivityCount: jest.fn(() => 0),
    ...overrides,
  };
}

// requireOptionalNativeModule runs at module load time, so the fake native
// module must be registered (via jest.doMock) before each fresh `require`.
function loadModule(fakeNative: unknown): typeof import('../index') {
  let mod!: typeof import('../index');
  jest.isolateModules(() => {
    jest.doMock('expo', () => ({ requireOptionalNativeModule: () => fakeNative }));
    mod = require('../index');
  });
  return mod;
}

describe('live-activity bridge queue', () => {
  it('does not start endActivity until startActivity has settled', async () => {
    const startDeferred = deferred<void>();
    const fakeNative = makeFakeNative({ startActivity: jest.fn(() => startDeferred.promise) });
    const { startActivity, endActivity } = loadModule(fakeNative);

    const startPromise = startActivity(attributes, content);
    const endPromise = endActivity();

    // Let any queued microtasks that could (incorrectly) run endActivity flush.
    await Promise.resolve();
    await Promise.resolve();
    expect(fakeNative.endActivity).not.toHaveBeenCalled();

    startDeferred.resolve();
    await startPromise;
    await endPromise;

    expect(fakeNative.endActivity).toHaveBeenCalledTimes(1);
    expect(fakeNative.startActivity.mock.invocationCallOrder[0]).toBeLessThan(
      fakeNative.endActivity.mock.invocationCallOrder[0]
    );
  });

  it('keeps the queue alive after a rejected call', async () => {
    const fakeNative = makeFakeNative({ startActivity: jest.fn(() => Promise.reject(new Error('boom'))) });
    const { startActivity, endActivity } = loadModule(fakeNative);

    await expect(startActivity(attributes, content)).rejects.toThrow('boom');
    await expect(endActivity()).resolves.toBeUndefined();
    expect(fakeNative.endActivity).toHaveBeenCalledTimes(1);
  });

  it('getActivityCount returns the native count, or 0 when native is absent', async () => {
    const fakeNative = makeFakeNative({ getActivityCount: jest.fn(() => 3) });
    const { getActivityCount } = loadModule(fakeNative);
    await expect(getActivityCount()).resolves.toBe(3);

    const { getActivityCount: getActivityCountNoNative } = loadModule(null);
    await expect(getActivityCountNoNative()).resolves.toBe(0);
  });
});
