export type TimerState =
  | { status: 'idle' }
  | { status: 'running'; name: string; runningSince: number; accumulatedMs: number }
  | { status: 'paused'; name: string; accumulatedMs: number };

export type TimerAction =
  | { type: 'start'; name: string; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'stop' };

export const initialTimerState: TimerState = { status: 'idle' };

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'start': {
      const trimmed = action.name.trim();
      return {
        status: 'running',
        name: trimmed === '' ? 'Study Session' : trimmed,
        runningSince: action.now,
        accumulatedMs: 0,
      };
    }
    case 'pause': {
      if (state.status !== 'running') return state;
      return {
        status: 'paused',
        name: state.name,
        accumulatedMs: state.accumulatedMs + runningDelta(state, action.now),
      };
    }
    case 'resume': {
      if (state.status !== 'paused') return state;
      return {
        status: 'running',
        name: state.name,
        runningSince: action.now,
        accumulatedMs: state.accumulatedMs,
      };
    }
    case 'stop': {
      if (state.status === 'idle') return state;
      return { status: 'idle' };
    }
  }
}

export function elapsedMs(state: TimerState, now: number): number {
  switch (state.status) {
    case 'idle':
      return 0;
    case 'paused':
      return state.accumulatedMs;
    case 'running':
      return state.accumulatedMs + runningDelta(state, now);
  }
}

// Never negative: a clock change while running must not eat accumulated time.
function runningDelta(state: { runningSince: number }, now: number): number {
  return Math.max(0, now - state.runningSince);
}
