import {
  initialTimerState,
  timerReducer,
  elapsedMs,
  TimerState,
} from '../timerReducer';

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
      now: 1000,
    });
    expect(result).toEqual({
      status: 'running',
      name: 'Math',
      runningSince: 1000,
      accumulatedMs: 0,
    });
  });

  it('starting while running replaces the session', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      runningSince: 1000,
      accumulatedMs: 5000,
    };
    const result = timerReducer(running, { type: 'start', name: 'Science', now: 9000 });
    expect(result).toEqual({
      status: 'running',
      name: 'Science',
      runningSince: 9000,
      accumulatedMs: 0,
    });
  });

  it('starting while paused replaces the session', () => {
    const paused: TimerState = {
      status: 'paused',
      name: 'Math',
      accumulatedMs: 5000,
    };
    const result = timerReducer(paused, { type: 'start', name: 'Science', now: 9000 });
    expect(result).toEqual({
      status: 'running',
      name: 'Science',
      runningSince: 9000,
      accumulatedMs: 0,
    });
  });

  it('trims the name', () => {
    const result = timerReducer(initialTimerState, {
      type: 'start',
      name: '  Math  ',
      now: 1000,
    });
    expect(result).toEqual({
      status: 'running',
      name: 'Math',
      runningSince: 1000,
      accumulatedMs: 0,
    });
  });

  it('falls back to "Study Session" for an empty name', () => {
    const result = timerReducer(initialTimerState, { type: 'start', name: '', now: 1000 });
    expect(result).toMatchObject({ name: 'Study Session' });
  });

  it('falls back to "Study Session" for a whitespace-only name', () => {
    const result = timerReducer(initialTimerState, { type: 'start', name: '   ', now: 1000 });
    expect(result).toMatchObject({ name: 'Study Session' });
  });
});

describe('timerReducer: pause', () => {
  it('pauses from running, accumulating elapsed time', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      runningSince: 1000,
      accumulatedMs: 2000,
    };
    const result = timerReducer(running, { type: 'pause', now: 4500 });
    expect(result).toEqual({
      status: 'paused',
      name: 'Math',
      accumulatedMs: 5500,
    });
  });

  it('keeps accumulatedMs when pausing after a clock rollback', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      runningSince: 5000,
      accumulatedMs: 2000,
    };
    expect(timerReducer(running, { type: 'pause', now: 1000 })).toMatchObject({ accumulatedMs: 2000 });
  });

  it('is a no-op from idle (identity)', () => {
    const result = timerReducer(initialTimerState, { type: 'pause', now: 1000 });
    expect(result).toBe(initialTimerState);
  });

  it('is a no-op from paused (identity)', () => {
    const paused: TimerState = { status: 'paused', name: 'Math', accumulatedMs: 5000 };
    const result = timerReducer(paused, { type: 'pause', now: 1000 });
    expect(result).toBe(paused);
  });
});

describe('timerReducer: resume', () => {
  it('resumes from paused, carrying over accumulatedMs', () => {
    const paused: TimerState = { status: 'paused', name: 'Math', accumulatedMs: 5000 };
    const result = timerReducer(paused, { type: 'resume', now: 8000 });
    expect(result).toEqual({
      status: 'running',
      name: 'Math',
      runningSince: 8000,
      accumulatedMs: 5000,
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
      runningSince: 1000,
      accumulatedMs: 2000,
    };
    const result = timerReducer(running, { type: 'resume', now: 5000 });
    expect(result).toBe(running);
  });
});

describe('timerReducer: stop', () => {
  it('stops from running', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      runningSince: 1000,
      accumulatedMs: 2000,
    };
    expect(timerReducer(running, { type: 'stop' })).toEqual({ status: 'idle' });
  });

  it('stops from paused', () => {
    const paused: TimerState = { status: 'paused', name: 'Math', accumulatedMs: 5000 };
    expect(timerReducer(paused, { type: 'stop' })).toEqual({ status: 'idle' });
  });

  it('is a no-op from idle (identity)', () => {
    const result = timerReducer(initialTimerState, { type: 'stop' });
    expect(result).toBe(initialTimerState);
  });
});

describe('timerReducer: hydrate', () => {
  it('replaces the state with the persisted one', () => {
    const persisted: TimerState = { status: 'paused', name: 'Math', accumulatedMs: 5000 };
    expect(timerReducer(initialTimerState, { type: 'hydrate', state: persisted })).toBe(persisted);
  });
});

describe('elapsedMs', () => {
  it('is 0 when idle', () => {
    expect(elapsedMs(initialTimerState, 5000)).toBe(0);
  });

  it('is accumulatedMs when paused', () => {
    const paused: TimerState = { status: 'paused', name: 'Math', accumulatedMs: 3000 };
    expect(elapsedMs(paused, 9999)).toBe(3000);
  });

  it('is accumulatedMs + (now - runningSince) when running', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      runningSince: 1000,
      accumulatedMs: 2000,
    };
    expect(elapsedMs(running, 4000)).toBe(5000);
  });

  it('keeps accumulatedMs when now is before runningSince (clock rollback)', () => {
    const running: TimerState = {
      status: 'running',
      name: 'Math',
      runningSince: 5000,
      accumulatedMs: 2000,
    };
    expect(elapsedMs(running, 1000)).toBe(2000);
  });
});

describe('integration: start -> pause -> resume -> pause', () => {
  it('tracks elapsed time correctly across transitions', () => {
    let state = timerReducer(initialTimerState, { type: 'start', name: 'Focus', now: 0 });
    expect(elapsedMs(state, 3000)).toBe(3000);

    state = timerReducer(state, { type: 'pause', now: 3000 });
    expect(state).toEqual({ status: 'paused', name: 'Focus', accumulatedMs: 3000 });
    expect(elapsedMs(state, 10000)).toBe(3000);

    state = timerReducer(state, { type: 'resume', now: 8000 });
    expect(state).toEqual({
      status: 'running',
      name: 'Focus',
      runningSince: 8000,
      accumulatedMs: 3000,
    });
    expect(elapsedMs(state, 8500)).toBe(3500);

    state = timerReducer(state, { type: 'pause', now: 8500 });
    expect(state).toEqual({ status: 'paused', name: 'Focus', accumulatedMs: 3500 });
    expect(elapsedMs(state, 999999)).toBe(3500);
  });
});
