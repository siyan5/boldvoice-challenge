import { DEFAULT_GOAL_MS, DEFAULT_SESSION_NAME, MAX_NAME_LENGTH } from './constants';

interface SessionFields {
  name: string;
  goalMs: number;
  startedAt: number;
  accumulatedMs: number;
  pauseCount: number;
}

export type TimerState =
  | { status: 'idle' }
  | ({ status: 'running'; runningSince: number } & SessionFields)
  | ({ status: 'paused'; pausedAt: number } & SessionFields)
  | ({ status: 'completed'; endedAt: number } & SessionFields);

export type TimerAction =
  | { type: 'start'; name: string; goalMs: number; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'stop'; now: number }
  | { type: 'dismiss' }
  | { type: 'hydrate'; state: TimerState }; // re-adopt a persisted session on app launch

export const initialTimerState: TimerState = { status: 'idle' };

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'start': {
      const trimmed = action.name.trim().slice(0, MAX_NAME_LENGTH);
      const goalMs =
        Number.isFinite(action.goalMs) && action.goalMs > 0 ? action.goalMs : DEFAULT_GOAL_MS;
      return {
        status: 'running',
        name: trimmed === '' ? DEFAULT_SESSION_NAME : trimmed,
        goalMs,
        startedAt: action.now,
        runningSince: action.now,
        accumulatedMs: 0,
        pauseCount: 0,
      };
    }
    case 'pause': {
      if (state.status !== 'running') return state;
      const { status: _status, runningSince: _runningSince, ...session } = state;
      return {
        status: 'paused',
        ...session,
        pausedAt: action.now,
        accumulatedMs: session.accumulatedMs + runningDelta(state, action.now),
        pauseCount: session.pauseCount + 1,
      };
    }
    case 'resume': {
      if (state.status !== 'paused') return state;
      const { status: _status, pausedAt: _pausedAt, ...session } = state;
      return {
        status: 'running',
        ...session,
        runningSince: action.now,
      };
    }
    case 'stop': {
      if (state.status === 'running') {
        const { status: _status, runningSince: _runningSince, ...session } = state;
        return {
          status: 'completed',
          ...session,
          accumulatedMs: session.accumulatedMs + runningDelta(state, action.now),
          endedAt: action.now,
        };
      }
      if (state.status === 'paused') {
        const { status: _status, pausedAt: _pausedAt, ...session } = state;
        return {
          status: 'completed',
          ...session,
          endedAt: action.now,
        };
      }
      return state;
    }
    case 'dismiss': {
      if (state.status !== 'completed') return state;
      return { status: 'idle' };
    }
    case 'hydrate':
      return action.state;
  }
}

export function elapsedMs(state: TimerState, now: number): number {
  switch (state.status) {
    case 'idle':
      return 0;
    case 'paused':
    case 'completed':
      return state.accumulatedMs;
    case 'running':
      return state.accumulatedMs + runningDelta(state, now);
  }
}

export function remainingMs(state: TimerState, now: number): number {
  if (state.status === 'idle') return 0;
  return Math.max(0, state.goalMs - elapsedMs(state, now));
}

// Never negative: a clock change while running must not eat accumulated time.
function runningDelta(state: { runningSince: number }, now: number): number {
  return Math.max(0, now - state.runningSince);
}
