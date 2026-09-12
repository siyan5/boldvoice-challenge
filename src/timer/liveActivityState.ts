import { GOAL_MS } from './constants';
import { TimerState } from './timerReducer';

// Fixed for the activity's lifetime; the Swift widget mirrors this shape.
export interface LiveActivityAttributes {
  name: string;
  goalMs: number;
}

export interface LiveActivityContentState {
  isPaused: boolean;
  timerStartMs: number; // epoch ms. When running: runningSince - accumulatedMs, so a widget counting up from this shows total elapsed. When paused: 0.
  elapsedMs: number; // when paused: the frozen elapsed value. When running: 0 (widget computes from timerStartMs).
}

export function toLiveActivityAttributes(state: TimerState): LiveActivityAttributes | null {
  if (state.status === 'idle') return null;
  return { name: state.name, goalMs: GOAL_MS };
}

export function toLiveActivityContentState(state: TimerState): LiveActivityContentState | null {
  if (state.status === 'idle') return null;
  if (state.status === 'paused') {
    return { isPaused: true, timerStartMs: 0, elapsedMs: state.accumulatedMs };
  }
  return { isPaused: false, timerStartMs: state.runningSince - state.accumulatedMs, elapsedMs: 0 };
}
