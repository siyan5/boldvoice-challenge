import { TimerState } from '../timerReducer';
import { toLiveActivityAttributes, toLiveActivityContentState } from '../liveActivityState';

describe('toLiveActivityAttributes', () => {
  it('is null when idle', () => {
    const state: TimerState = { status: 'idle' };
    expect(toLiveActivityAttributes(state)).toBeNull();
  });

  it('is null when completed', () => {
    const state: TimerState = {
      status: 'completed',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      endedAt: 1000,
      accumulatedMs: 1000,
      pauseCount: 0,
    };
    expect(toLiveActivityAttributes(state)).toBeNull();
  });

  it('carries name when running', () => {
    const state: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      runningSince: 1000,
      accumulatedMs: 0,
      pauseCount: 0,
    };
    expect(toLiveActivityAttributes(state)).toEqual({ name: 'Math' });
  });

  it('carries name when paused', () => {
    const state: TimerState = {
      status: 'paused',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      pausedAt: 5000,
      accumulatedMs: 5000,
      pauseCount: 1,
    };
    expect(toLiveActivityAttributes(state)).toEqual({ name: 'Math' });
  });
});

describe('toLiveActivityContentState', () => {
  it('is null when idle', () => {
    const state: TimerState = { status: 'idle' };
    expect(toLiveActivityContentState(state)).toBeNull();
  });

  it('is null when completed', () => {
    const state: TimerState = {
      status: 'completed',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      endedAt: 1000,
      accumulatedMs: 1000,
      pauseCount: 0,
    };
    expect(toLiveActivityContentState(state)).toBeNull();
  });

  it('running: timerStartMs = runningSince - accumulatedMs, elapsedMs = 0, carries goalMs', () => {
    const state: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 10000,
      runningSince: 10000,
      accumulatedMs: 5000,
      pauseCount: 0,
    };
    expect(toLiveActivityContentState(state)).toEqual({
      isPaused: false,
      timerStartMs: 5000,
      elapsedMs: 0,
      goalMs: 60000,
    });
  });

  it('paused: timerStartMs = 0, elapsedMs = frozen accumulatedMs, carries goalMs', () => {
    const state: TimerState = {
      status: 'paused',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      pausedAt: 5000,
      accumulatedMs: 5000,
      pauseCount: 1,
    };
    expect(toLiveActivityContentState(state)).toEqual({
      isPaused: true,
      timerStartMs: 0,
      elapsedMs: 5000,
      goalMs: 60000,
    });
  });
});
