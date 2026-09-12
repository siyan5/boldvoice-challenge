import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialTimerState, TimerState } from './timerReducer';
import { MAX_RECENT_NAMES } from './constants';

export const TIMER_STORAGE_KEY = 'study-timer/state/v1';

export async function saveTimerState(state: TimerState): Promise<void> {
  if (state.status === 'idle') {
    await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
}

export async function loadTimerState(): Promise<TimerState> {
  const raw = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
  if (raw == null) return initialTimerState;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return initialTimerState;
  }

  return isTimerState(parsed) ? parsed : initialTimerState;
}

function isTimerState(value: unknown): value is TimerState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  if (v.status === 'idle') return true;

  if (!hasSessionFields(v)) return false;

  if (v.status === 'running') {
    return typeof v.runningSince === 'number' && Number.isFinite(v.runningSince);
  }

  if (v.status === 'paused') {
    return typeof v.pausedAt === 'number' && Number.isFinite(v.pausedAt);
  }

  if (v.status === 'completed') {
    return typeof v.endedAt === 'number' && Number.isFinite(v.endedAt);
  }

  return false;
}

function hasSessionFields(v: Record<string, unknown>): boolean {
  return (
    typeof v.name === 'string' &&
    typeof v.goalMs === 'number' &&
    Number.isFinite(v.goalMs) &&
    typeof v.startedAt === 'number' &&
    Number.isFinite(v.startedAt) &&
    typeof v.accumulatedMs === 'number' &&
    Number.isFinite(v.accumulatedMs) &&
    typeof v.pauseCount === 'number' &&
    Number.isFinite(v.pauseCount)
  );
}

export const RECENT_NAMES_KEY = 'study-timer/recent-names/v1';

export async function saveRecentName(name: string): Promise<string[]> {
  const existing = await loadRecentNames();
  const deduped = existing.filter((n) => n !== name);
  const updated = [name, ...deduped].slice(0, MAX_RECENT_NAMES);
  await AsyncStorage.setItem(RECENT_NAMES_KEY, JSON.stringify(updated));
  return updated;
}

export async function loadRecentNames(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(RECENT_NAMES_KEY);
  if (raw == null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed) || !parsed.every((n) => typeof n === 'string')) return [];
  return parsed;
}

export const LIVE_ACTIVITY_ENABLED_KEY = 'study-timer/live-activity-enabled/v1';

export async function saveLiveActivityEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(LIVE_ACTIVITY_ENABLED_KEY, JSON.stringify(enabled));
}

export async function loadLiveActivityEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(LIVE_ACTIVITY_ENABLED_KEY);
  if (raw == null) return true;

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'boolean' ? parsed : true;
  } catch {
    return true;
  }
}
