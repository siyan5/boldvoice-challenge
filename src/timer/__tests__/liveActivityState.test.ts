import { GOAL_MS } from '../constants';
import { TimerState } from '../timerReducer';
import { toLiveActivityAttributes, toLiveActivityContentState } from '../liveActivityState';

describe('toLiveActivityAttributes', () => {
  it('is null when idle', () => {
    const state: TimerState = { status: 'idle' };
    expect(toLiveActivityAttributes(state)).toBeNull();
  });

  it('carries name and GOAL_MS when running', () => {
    const state: TimerState = {
      status: 'running',
      name: 'Math',
      runningSince: 1000,
      accumulatedMs: 0,
    };
    expect(toLiveActivityAttributes(state)).toEqual({ name: 'Math', goalMs: GOAL_MS });
  });

  it('carries name and GOAL_MS when paused', () => {
    const state: TimerState = { status: 'paused', name: 'Math', accumulatedMs: 5000 };
    expect(toLiveActivityAttributes(state)).toEqual({ name: 'Math', goalMs: GOAL_MS });
  });
});

describe('toLiveActivityContentState', () => {
  it('is null when idle', () => {
    const state: TimerState = { status: 'idle' };
    expect(toLiveActivityContentState(state)).toBeNull();
  });

  it('running: timerStartMs = runningSince - accumulatedMs, elapsedMs = 0', () => {
    const state: TimerState = {
      status: 'running',
      name: 'Math',
      runningSince: 10000,
      accumulatedMs: 5000,
    };
    expect(toLiveActivityContentState(state)).toEqual({
      isPaused: false,
      timerStartMs: 5000,
      elapsedMs: 0,
    });
  });

  it('paused: timerStartMs = 0, elapsedMs = frozen accumulatedMs', () => {
    const state: TimerState = { status: 'paused', name: 'Math', accumulatedMs: 5000 };
    expect(toLiveActivityContentState(state)).toEqual({
      isPaused: true,
      timerStartMs: 0,
      elapsedMs: 5000,
    });
  });
});
