import { TimerState } from './timerReducer';

export type SyncPlan = 'start' | 'update' | 'end' | 'none';

interface Snapshot {
  state: TimerState;
  enabled: boolean;
}

function wantsActivity({ state, enabled }: Snapshot): boolean {
  return enabled && (state.status === 'running' || state.status === 'paused');
}

// Decides which single ActivityKit call a state transition needs. Pure so it can be tested.
export function planLiveActivitySync(prev: Snapshot, next: Snapshot): SyncPlan {
  const nextWants = wantsActivity(next);
  const prevWants = wantsActivity(prev);
  if (!nextWants) return prevWants ? 'end' : 'none';
  if (!prevWants) return 'start';
  // Start pressed while a session was already active: a different session replaces it.
  if (next.state.status !== 'idle' && prev.state.status !== 'idle' && next.state.startedAt !== prev.state.startedAt) {
    return 'start';
  }
  return 'update';
}
