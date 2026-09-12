import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialTimerState, TimerState } from './timerReducer';

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

  if (v.status === 'running') {
    return (
      typeof v.name === 'string' &&
      typeof v.runningSince === 'number' &&
      Number.isFinite(v.runningSince) &&
      typeof v.accumulatedMs === 'number' &&
      Number.isFinite(v.accumulatedMs)
    );
  }

  if (v.status === 'paused') {
    return (
      typeof v.name === 'string' &&
      typeof v.accumulatedMs === 'number' &&
      Number.isFinite(v.accumulatedMs)
    );
  }

  return false;
}
