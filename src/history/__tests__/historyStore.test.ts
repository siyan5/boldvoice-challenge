jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HISTORY_KEY,
  MAX_HISTORY,
  recordFromCompleted,
  loadHistory,
  appendSession,
  clearHistory,
} from '../historyStore';
import { SessionRecord } from '../types';
import { TimerState } from '../../timer/timerReducer';

function record(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: '1000-9000',
    name: 'Math',
    goalMs: 60000,
    startedAt: 1000,
    endedAt: 9000,
    totalMs: 8000,
    pauseCount: 1,
    ...overrides,
  };
}

describe('recordFromCompleted', () => {
  it('maps a completed timer state to a SessionRecord', () => {
    const state: Extract<TimerState, { status: 'completed' }> = {
      status: 'completed',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      endedAt: 9000,
      accumulatedMs: 8000,
      pauseCount: 1,
    };
    expect(recordFromCompleted(state)).toEqual({
      id: '1000-9000',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      endedAt: 9000,
      totalMs: 8000,
      pauseCount: 1,
    });
  });
});

describe('loadHistory / appendSession / clearHistory', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('loading with nothing stored returns an empty list', async () => {
    expect(await loadHistory()).toEqual([]);
  });

  it('round-trips a single record', async () => {
    await appendSession(record());
    expect(await loadHistory()).toEqual([record()]);
  });

  it('prepends new records, newest first', async () => {
    await appendSession(record({ id: 'a', startedAt: 1 }));
    await appendSession(record({ id: 'b', startedAt: 2 }));
    const loaded = await loadHistory();
    expect(loaded.map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('dedupes by id, moving the updated record to the front', async () => {
    await appendSession(record({ id: 'a', name: 'Math' }));
    await appendSession(record({ id: 'b', name: 'Reading' }));
    await appendSession(record({ id: 'a', name: 'Math v2' }));
    const loaded = await loadHistory();
    expect(loaded.map((r) => r.id)).toEqual(['a', 'b']);
    expect(loaded[0].name).toBe('Math v2');
  });

  it('caps the list at MAX_HISTORY', async () => {
    for (let i = 0; i < MAX_HISTORY + 2; i++) {
      await appendSession(record({ id: `s${i}`, startedAt: i }));
    }
    const loaded = await loadHistory();
    expect(loaded).toHaveLength(MAX_HISTORY);
    expect(loaded[0].id).toBe(`s${MAX_HISTORY + 1}`);
  });

  it('returns the new list from appendSession', async () => {
    const result = await appendSession(record());
    expect(result).toEqual([record()]);
  });

  it('clearHistory empties the store', async () => {
    await appendSession(record());
    await clearHistory();
    expect(await loadHistory()).toEqual([]);
  });

  it('loading corrupt JSON returns an empty list', async () => {
    await AsyncStorage.setItem(HISTORY_KEY, '{not valid json');
    expect(await loadHistory()).toEqual([]);
  });

  it('loading a non-array value returns an empty list', async () => {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify({ foo: 'bar' }));
    expect(await loadHistory()).toEqual([]);
  });

  it('drops invalid entries while keeping valid ones', async () => {
    await AsyncStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([record({ id: 'valid' }), { id: 'bad' }, 'not an object', null])
    );
    const loaded = await loadHistory();
    expect(loaded).toEqual([record({ id: 'valid' })]);
  });
});
