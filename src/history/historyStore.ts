import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionRecord } from './types';
import { TimerState } from '../timer/timerReducer';

export const HISTORY_KEY = 'study-timer/history/v1';
export const MAX_HISTORY = 500;

export function recordFromCompleted(
  state: Extract<TimerState, { status: 'completed' }>
): SessionRecord {
  return {
    id: `${state.startedAt}-${state.endedAt}`,
    name: state.name,
    goalMs: state.goalMs,
    startedAt: state.startedAt,
    endedAt: state.endedAt,
    totalMs: state.accumulatedMs,
    pauseCount: state.pauseCount,
  };
}

export async function loadHistory(): Promise<SessionRecord[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (raw == null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isSessionRecord);
}

export async function appendSession(record: SessionRecord): Promise<SessionRecord[]> {
  const existing = await loadHistory();
  const deduped = existing.filter((r) => r.id !== record.id);
  const updated = [record, ...deduped].slice(0, MAX_HISTORY);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

function isSessionRecord(value: unknown): value is SessionRecord {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.goalMs === 'number' &&
    Number.isFinite(v.goalMs) &&
    typeof v.startedAt === 'number' &&
    Number.isFinite(v.startedAt) &&
    typeof v.endedAt === 'number' &&
    Number.isFinite(v.endedAt) &&
    typeof v.totalMs === 'number' &&
    Number.isFinite(v.totalMs) &&
    typeof v.pauseCount === 'number' &&
    Number.isFinite(v.pauseCount)
  );
}
