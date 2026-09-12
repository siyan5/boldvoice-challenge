import { useEffect, useReducer, useRef, useState } from 'react';
import { elapsedMs, initialTimerState, remainingMs, timerReducer, TimerState } from './timerReducer';
import {
  loadLiveActivityEnabled,
  loadRecentNames,
  loadTimerState,
  saveLiveActivityEnabled,
  saveRecentName,
  saveTimerState,
} from './persistence';
import { toLiveActivityAttributes, toLiveActivityContentState } from './liveActivityState';
import { planLiveActivitySync } from './liveActivitySync';
import { appendSession, loadHistory, recordFromCompleted } from '../history/historyStore';
import { SessionRecord } from '../history/types';
import { ensureNotificationPermission, syncGoalNotification } from '../notifications/goalNotification';
import {
  endActivity,
  getActivityCount,
  isLiveActivitySupported,
  startActivity,
  updateActivity,
} from '../../modules/live-activity';

export interface TimerController {
  state: TimerState;
  elapsedMs: number;
  remainingMs: number;
  recentNames: string[];
  history: SessionRecord[];
  liveActivityEnabled: boolean;
  liveActivitySupported: boolean;
  start(name: string, goalMs: number): void;
  pause(): void;
  resume(): void;
  stop(): void;
  dismiss(): void;
  setLiveActivityEnabled(enabled: boolean): void;
}

export function useTimer(): TimerController {
  const [state, dispatch] = useReducer(timerReducer, initialTimerState);
  const [now, setNow] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);
  const [recentNames, setRecentNames] = useState<string[]>([]);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [liveActivityEnabled, setEnabled] = useState(true);
  const prev = useRef({ state: initialTimerState, enabled: true });

  // Re-adopt a persisted session and settings (app was killed or relaunched).
  useEffect(() => {
    Promise.all([loadTimerState(), loadRecentNames(), loadLiveActivityEnabled(), loadHistory()]).then(
      ([persisted, names, enabled, records]) => {
        prev.current = { state: initialTimerState, enabled };
        setRecentNames(names);
        setHistory(records);
        setEnabled(enabled);
        dispatch({ type: 'hydrate', state: persisted });
        setHydrated(true);
      }
    );
  }, []);

  // Tick the clock only while running.
  useEffect(() => {
    if (state.status !== 'running') return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state.status]);

  // The widget cannot re-render on its own, so send one update when the goal is reached
  // (content unchanged; the render lets the widget switch to "over goal"). If the app is
  // suspended at that moment, the timer fires on return to foreground; staleDate covers the rest.
  useEffect(() => {
    if (!hydrated || !liveActivityEnabled || state.status !== 'running') return;
    const delay = remainingMs(state, Date.now());
    const content = toLiveActivityContentState(state);
    if (!content || delay <= 0) return;
    const id = setTimeout(() => updateActivity(content).catch(() => {}), delay);
    return () => clearTimeout(id);
  }, [state, liveActivityEnabled, hydrated]);

  // Mirror every transition to storage and to the Live Activity.
  // Gated on hydration so the initial idle state does not wipe the persisted one.
  useEffect(() => {
    if (!hydrated) return;
    const next = { state, enabled: liveActivityEnabled };
    const plan = planLiveActivitySync(prev.current, next);
    const prevState = prev.current.state;
    const isNewSession =
      (state.status === 'running' || state.status === 'paused') &&
      (prevState.status === 'idle' || prevState.status === 'completed' || prevState.startedAt !== state.startedAt);
    const justCompleted = state.status === 'completed' && prevState.status !== 'completed';
    prev.current = next;
    saveTimerState(state);
    if (isNewSession) saveRecentName(state.name).then(setRecentNames);
    if (justCompleted) appendSession(recordFromCompleted(state)).then(setHistory);
    syncGoalNotification(state);
    syncLiveActivity(plan, state).catch((e) => console.warn('Live Activity sync failed', e));
  }, [state, liveActivityEnabled, hydrated]);

  return {
    state,
    elapsedMs: elapsedMs(state, now),
    remainingMs: remainingMs(state, now),
    recentNames,
    history,
    liveActivityEnabled,
    liveActivitySupported: isLiveActivitySupported(),
    start: (name, goalMs) => {
      ensureNotificationPermission();
      dispatch({ type: 'start', name, goalMs, now: Date.now() });
    },
    pause: () => dispatch({ type: 'pause', now: Date.now() }),
    resume: () => dispatch({ type: 'resume', now: Date.now() }),
    stop: () => dispatch({ type: 'stop', now: Date.now() }),
    dismiss: () => dispatch({ type: 'dismiss' }),
    setLiveActivityEnabled: (enabled) => {
      setEnabled(enabled);
      saveLiveActivityEnabled(enabled);
    },
  };
}

async function syncLiveActivity(plan: ReturnType<typeof planLiveActivitySync>, state: TimerState): Promise<void> {
  if (plan === 'none') return;
  if (plan === 'end') {
    await endActivity();
  } else {
    const attributes = toLiveActivityAttributes(state);
    const content = toLiveActivityContentState(state);
    if (!attributes || !content) return;
    if (plan === 'start') await startActivity(attributes, content);
    else await updateActivity(content);
  }
  // Diagnostic for the zombie edge case: after every transition the OS should hold
  // exactly one activity while a session is live and zero otherwise.
  if (__DEV__) console.log(`[live-activity] ${plan} -> activities: ${await getActivityCount()}`);
}
