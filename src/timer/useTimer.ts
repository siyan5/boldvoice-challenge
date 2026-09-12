import { useEffect, useReducer, useRef, useState } from 'react';
import { elapsedMs, initialTimerState, timerReducer, TimerState } from './timerReducer';
import { loadTimerState, saveTimerState } from './persistence';
import { toLiveActivityAttributes, toLiveActivityContentState } from './liveActivityState';
import { endActivity, startActivity, updateActivity } from '../../modules/live-activity';

export interface TimerController {
  state: TimerState;
  elapsedMs: number;
  start(name: string): void;
  pause(): void;
  resume(): void;
  stop(): void;
}

export function useTimer(): TimerController {
  const [state, dispatch] = useReducer(timerReducer, initialTimerState);
  const [now, setNow] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);
  const prevState = useRef<TimerState>(initialTimerState);

  // Re-adopt a persisted session (app was killed or relaunched).
  useEffect(() => {
    loadTimerState().then((persisted) => {
      dispatch({ type: 'hydrate', state: persisted });
      setHydrated(true);
    });
  }, []);

  // Tick the clock only while running.
  useEffect(() => {
    if (state.status !== 'running') return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state.status]);

  // Mirror every state transition to storage and to the Live Activity.
  // Gated on hydration so the initial idle state does not wipe the persisted one.
  useEffect(() => {
    if (!hydrated) return;
    const prev = prevState.current;
    prevState.current = state;
    saveTimerState(state);
    syncLiveActivity(prev, state).catch((e) => console.warn('Live Activity sync failed', e));
  }, [state, hydrated]);

  return {
    state,
    elapsedMs: elapsedMs(state, now),
    start: (name: string) => dispatch({ type: 'start', name, now: Date.now() }),
    pause: () => dispatch({ type: 'pause', now: Date.now() }),
    resume: () => dispatch({ type: 'resume', now: Date.now() }),
    stop: () => dispatch({ type: 'stop' }),
  };
}

async function syncLiveActivity(prev: TimerState, next: TimerState): Promise<void> {
  if (next.status === 'idle') {
    if (prev.status !== 'idle') await endActivity();
    return;
  }
  const attributes = toLiveActivityAttributes(next)!;
  const content = toLiveActivityContentState(next)!;
  // A new session starts from idle, from hydration, or when Start replaces a running session.
  const isNewSession =
    prev.status === 'idle' || (next.status === 'running' && prev.status === 'running');
  if (isNewSession) {
    await startActivity(attributes, content);
  } else {
    await updateActivity(content);
  }
}
