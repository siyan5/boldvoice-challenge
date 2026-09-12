import { TimerState } from './timerReducer';

// Fixed for the activity's lifetime; the Swift widget mirrors this shape.
export interface LiveActivityAttributes {
  name: string;
}

export interface LiveActivityContentState {
  isPaused: boolean;
  timerStartMs: number; // epoch ms. When running: runningSince - accumulatedMs, so a widget counting up from this shows total elapsed. When paused: 0.
  elapsedMs: number; // when paused: the frozen elapsed value. When running: 0 (widget computes from timerStartMs).
  goalMs: number;
}

export function toLiveActivityAttributes(state: TimerState): LiveActivityAttributes | null {
  if (state.status === 'idle' || state.status === 'completed') return null;
  return { name: state.name };
}

export function toLiveActivityContentState(state: TimerState): LiveActivityContentState | null {
  if (state.status === 'idle' || state.status === 'completed') return null;
  if (state.status === 'paused') {
    return { isPaused: true, timerStartMs: 0, elapsedMs: state.accumulatedMs, goalMs: state.goalMs };
  }
  return {
    isPaused: false,
    timerStartMs: state.runningSince - state.accumulatedMs,
    elapsedMs: 0,
    goalMs: state.goalMs,
  };
}
