import {
  initialTimerState,
  timerReducer,
  elapsedMs,
  remainingMs,
  TimerState,
} from '../timerReducer';
import { DEFAULT_GOAL_MS, DEFAULT_SESSION_NAME } from '../constants';

describe('initialTimerState', () => {
  it('is idle', () => {
    expect(initialTimerState).toEqual({ status: 'idle' });
  });
});

describe('timerReducer: start', () => {
  it('starts from idle', () => {
    const result = timerReducer(initialTimerState, {
      type: 'start',
      name: 'Math',
      goalMs: 60000,
      now: 1000,
    });
    expect(result).toEqual({
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      runningSince: 1000,
      accumulatedMs: 0,
      pauseCount: 0,
    });
  });

  it('starting while running replaces the session', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      runningSince: 1000,
      accumulatedMs: 5000,
      pauseCount: 2,
    };
    const result = timerReducer(running, {
      type: 'start',
      name: 'Science',
      goalMs: 120000,
      now: 9000,
    });
    expect(result).toEqual({
      status: 'running',
      name: 'Science',
      goalMs: 120000,
      startedAt: 9000,
      runningSince: 9000,
      accumulatedMs: 0,
      pauseCount: 0,
    });
  });

  it('starting while paused replaces the session', () => {
    const paused: TimerState = {
      status: 'paused',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      pausedAt: 4000,
      accumulatedMs: 5000,
      pauseCount: 1,
    };
    const result = timerReducer(paused, {
      type: 'start',
      name: 'Science',
      goalMs: 120000,
      now: 9000,
    });
    expect(result).toEqual({
      status: 'running',
      name: 'Science',
      goalMs: 120000,
      startedAt: 9000,
      runningSince: 9000,
      accumulatedMs: 0,
      pauseCount: 0,
    });
  });

  it('starting while completed replaces the session', () => {
    const completed: TimerState = {
      status: 'completed',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      endedAt: 5000,
      accumulatedMs: 4000,
      pauseCount: 1,
    };
    const result = timerReducer(completed, {
      type: 'start',
      name: 'Science',
      goalMs: 120000,
      now: 9000,
    });
    expect(result).toEqual({
      status: 'running',
      name: 'Science',
      goalMs: 120000,
      startedAt: 9000,
      runningSince: 9000,
      accumulatedMs: 0,
      pauseCount: 0,
    });
  });

  it('trims the name', () => {
    const result = timerReducer(initialTimerState, {
      type: 'start',
      name: '  Math  ',
      goalMs: 60000,
      now: 1000,
    });
    expect(result).toMatchObject({ name: 'Math' });
  });

  it('caps the name at MAX_NAME_LENGTH', () => {
    const long = 'x'.repeat(80);
    const result = timerReducer(initialTimerState, {
      type: 'start',
      name: long,
      goalMs: 60000,
      now: 1000,
    });
    expect(result).toMatchObject({ name: 'x'.repeat(60) });
  });

  it('falls back to "Study Session" for an empty name', () => {
    const result = timerReducer(initialTimerState, {
      type: 'start',
      name: '',
      goalMs: 60000,
      now: 1000,
    });
    expect(result).toMatchObject({ name: DEFAULT_SESSION_NAME });
  });

  it('falls back to "Study Session" for a whitespace-only name', () => {
    const result = timerReducer(initialTimerState, {
      type: 'start',
      name: '   ',
      goalMs: 60000,
      now: 1000,
    });
    expect(result).toMatchObject({ name: DEFAULT_SESSION_NAME });
  });

  it('falls back to DEFAULT_GOAL_MS for a zero goal', () => {
    const result = timerReducer(initialTimerState, {
      type: 'start',
      name: 'Math',
      goalMs: 0,
      now: 1000,
    });
    expect(result).toMatchObject({ goalMs: DEFAULT_GOAL_MS });
  });

  it('falls back to DEFAULT_GOAL_MS for a negative goal', () => {
    const result = timerReducer(initialTimerState, {
      type: 'start',
      name: 'Math',
      goalMs: -5,
      now: 1000,
    });
    expect(result).toMatchObject({ goalMs: DEFAULT_GOAL_MS });
  });

  it('falls back to DEFAULT_GOAL_MS for a non-finite goal', () => {
    const result = timerReducer(initialTimerState, {
      type: 'start',
      name: 'Math',
      goalMs: NaN,
      now: 1000,
    });
    expect(result).toMatchObject({ goalMs: DEFAULT_GOAL_MS });
  });
});

describe('timerReducer: pause', () => {
  it('pauses from running, accumulating elapsed time', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      runningSince: 1000,
      accumulatedMs: 2000,
      pauseCount: 0,
    };
    const result = timerReducer(running, { type: 'pause', now: 4500 });
    expect(result).toEqual({
      status: 'paused',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      pausedAt: 4500,
      accumulatedMs: 5500,
      pauseCount: 1,
    });
  });

  it('increments pauseCount across two pauses', () => {
    let state: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      runningSince: 0,
      accumulatedMs: 0,
      pauseCount: 0,
    };
    state = timerReducer(state, { type: 'pause', now: 1000 });
    expect(state).toMatchObject({ pauseCount: 1 });
    state = timerReducer(state, { type: 'resume', now: 2000 });
    state = timerReducer(state, { type: 'pause', now: 3000 });
    expect(state).toMatchObject({ pauseCount: 2 });
  });

  it('keeps accumulatedMs when pausing after a clock rollback', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 5000,
      runningSince: 5000,
      accumulatedMs: 2000,
      pauseCount: 0,
    };
    expect(timerReducer(running, { type: 'pause', now: 1000 })).toMatchObject({
      accumulatedMs: 2000,
    });
  });

  it('is a no-op from idle (identity)', () => {
    const result = timerReducer(initialTimerState, { type: 'pause', now: 1000 });
    expect(result).toBe(initialTimerState);
  });

  it('is a no-op from paused (identity)', () => {
    const paused: TimerState = {
      status: 'paused',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      pausedAt: 1000,
      accumulatedMs: 5000,
      pauseCount: 1,
    };
    const result = timerReducer(paused, { type: 'pause', now: 1000 });
    expect(result).toBe(paused);
  });

  it('is a no-op from completed (identity)', () => {
    const completed: TimerState = {
      status: 'completed',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      endedAt: 1000,
      accumulatedMs: 1000,
      pauseCount: 0,
    };
    const result = timerReducer(completed, { type: 'pause', now: 2000 });
    expect(result).toBe(completed);
  });
});

describe('timerReducer: resume', () => {
  it('resumes from paused, carrying over accumulatedMs', () => {
    const paused: TimerState = {
      status: 'paused',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      pausedAt: 5000,
      accumulatedMs: 5000,
      pauseCount: 1,
    };
    const result = timerReducer(paused, { type: 'resume', now: 8000 });
    expect(result).toEqual({
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      runningSince: 8000,
      accumulatedMs: 5000,
      pauseCount: 1,
    });
  });

  it('is a no-op from idle (identity)', () => {
    const result = timerReducer(initialTimerState, { type: 'resume', now: 1000 });
    expect(result).toBe(initialTimerState);
  });

  it('is a no-op from running (identity)', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      runningSince: 1000,
      accumulatedMs: 2000,
      pauseCount: 0,
    };
    const result = timerReducer(running, { type: 'resume', now: 5000 });
    expect(result).toBe(running);
  });

  it('is a no-op from completed (identity)', () => {
    const completed: TimerState = {
      status: 'completed',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      endedAt: 1000,
      accumulatedMs: 1000,
      pauseCount: 0,
    };
    const result = timerReducer(completed, { type: 'resume', now: 2000 });
    expect(result).toBe(completed);
  });
});

describe('timerReducer: stop', () => {
  it('stops from running, completing with the accumulated elapsed time', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      runningSince: 1000,
      accumulatedMs: 2000,
      pauseCount: 0,
    };
    expect(timerReducer(running, { type: 'stop', now: 4500 })).toEqual({
      status: 'completed',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      endedAt: 4500,
      accumulatedMs: 5500,
      pauseCount: 0,
    });
  });

  it('stops from paused, completing with the frozen accumulated time', () => {
    const paused: TimerState = {
      status: 'paused',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      pausedAt: 4000,
      accumulatedMs: 5000,
      pauseCount: 1,
    };
    expect(timerReducer(paused, { type: 'stop', now: 9000 })).toEqual({
      status: 'completed',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      endedAt: 9000,
      accumulatedMs: 5000,
      pauseCount: 1,
    });
  });

  it('is a no-op from idle (identity)', () => {
    const result = timerReducer(initialTimerState, { type: 'stop', now: 1000 });
    expect(result).toBe(initialTimerState);
  });

  it('is a no-op from completed (identity)', () => {
    const completed: TimerState = {
      status: 'completed',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      endedAt: 1000,
      accumulatedMs: 1000,
      pauseCount: 0,
    };
    const result = timerReducer(completed, { type: 'stop', now: 2000 });
    expect(result).toBe(completed);
  });
});

describe('timerReducer: dismiss', () => {
  it('dismisses a completed session back to idle', () => {
    const completed: TimerState = {
      status: 'completed',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      endedAt: 1000,
      accumulatedMs: 1000,
      pauseCount: 0,
    };
    expect(timerReducer(completed, { type: 'dismiss' })).toEqual({ status: 'idle' });
  });

  it('is a no-op from idle (identity)', () => {
    const result = timerReducer(initialTimerState, { type: 'dismiss' });
    expect(result).toBe(initialTimerState);
  });

  it('is a no-op from running (identity)', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      runningSince: 1000,
      accumulatedMs: 2000,
      pauseCount: 0,
    };
    const result = timerReducer(running, { type: 'dismiss' });
    expect(result).toBe(running);
  });

  it('is a no-op from paused (identity)', () => {
    const paused: TimerState = {
      status: 'paused',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      pausedAt: 1000,
      accumulatedMs: 5000,
      pauseCount: 1,
    };
    const result = timerReducer(paused, { type: 'dismiss' });
    expect(result).toBe(paused);
  });
});

describe('timerReducer: hydrate', () => {
  it('replaces the state with the persisted one', () => {
    const persisted: TimerState = {
      status: 'paused',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      pausedAt: 1000,
      accumulatedMs: 5000,
      pauseCount: 1,
    };
    expect(timerReducer(initialTimerState, { type: 'hydrate', state: persisted })).toBe(persisted);
  });
});

describe('elapsedMs', () => {
  it('is 0 when idle', () => {
    expect(elapsedMs(initialTimerState, 5000)).toBe(0);
  });

  it('is accumulatedMs when paused', () => {
    const paused: TimerState = {
      status: 'paused',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      pausedAt: 3000,
      accumulatedMs: 3000,
      pauseCount: 1,
    };
    expect(elapsedMs(paused, 9999)).toBe(3000);
  });

  it('is accumulatedMs when completed', () => {
    const completed: TimerState = {
      status: 'completed',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      endedAt: 3000,
      accumulatedMs: 3000,
      pauseCount: 0,
    };
    expect(elapsedMs(completed, 9999)).toBe(3000);
  });

  it('is accumulatedMs + (now - runningSince) when running', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      runningSince: 1000,
      accumulatedMs: 2000,
      pauseCount: 0,
    };
    expect(elapsedMs(running, 4000)).toBe(5000);
  });

  it('keeps accumulatedMs when now is before runningSince (clock rollback)', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 5000,
      runningSince: 5000,
      accumulatedMs: 2000,
      pauseCount: 0,
    };
    expect(elapsedMs(running, 1000)).toBe(2000);
  });
});

describe('remainingMs', () => {
  it('is 0 when idle', () => {
    expect(remainingMs(initialTimerState, 5000)).toBe(0);
  });

  it('is goalMs - elapsed when running', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      runningSince: 0,
      accumulatedMs: 0,
      pauseCount: 0,
    };
    expect(remainingMs(running, 20000)).toBe(40000);
  });

  it('clamps to 0 once elapsed passes the goal', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      runningSince: 0,
      accumulatedMs: 0,
      pauseCount: 0,
    };
    expect(remainingMs(running, 90000)).toBe(0);
  });

  it('uses the frozen accumulatedMs when paused', () => {
    const paused: TimerState = {
      status: 'paused',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      pausedAt: 20000,
      accumulatedMs: 20000,
      pauseCount: 1,
    };
    expect(remainingMs(paused, 999999)).toBe(40000);
  });
});

describe('integration: start -> pause -> resume -> pause -> stop', () => {
  it('tracks elapsed time and session bookkeeping across transitions, ending completed', () => {
    let state = timerReducer(initialTimerState, {
      type: 'start',
      name: 'Focus',
      goalMs: 60000,
      now: 0,
    });
    expect(elapsedMs(state, 3000)).toBe(3000);

    state = timerReducer(state, { type: 'pause', now: 3000 });
    expect(state).toEqual({
      status: 'paused',
      name: 'Focus',
      goalMs: 60000,
      startedAt: 0,
      pausedAt: 3000,
      accumulatedMs: 3000,
      pauseCount: 1,
    });
    expect(elapsedMs(state, 10000)).toBe(3000);

    state = timerReducer(state, { type: 'resume', now: 8000 });
    expect(state).toEqual({
      status: 'running',
      name: 'Focus',
      goalMs: 60000,
      startedAt: 0,
      runningSince: 8000,
      accumulatedMs: 3000,
      pauseCount: 1,
    });
    expect(elapsedMs(state, 8500)).toBe(3500);

    state = timerReducer(state, { type: 'pause', now: 8500 });
    expect(state).toEqual({
      status: 'paused',
      name: 'Focus',
      goalMs: 60000,
      startedAt: 0,
      pausedAt: 8500,
      accumulatedMs: 3500,
      pauseCount: 2,
    });
    expect(elapsedMs(state, 999999)).toBe(3500);

    state = timerReducer(state, { type: 'stop', now: 20000 });
    expect(state).toEqual({
      status: 'completed',
      name: 'Focus',
      goalMs: 60000,
      startedAt: 0,
      endedAt: 20000,
      accumulatedMs: 3500,
      pauseCount: 2,
    });
    expect(elapsedMs(state, 999999)).toBe(3500);
  });
});
