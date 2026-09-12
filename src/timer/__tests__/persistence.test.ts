jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialTimerState, TimerState } from '../timerReducer';
import {
  saveTimerState,
  loadTimerState,
  TIMER_STORAGE_KEY,
  RECENT_NAMES_KEY,
  saveRecentName,
  loadRecentNames,
  LIVE_ACTIVITY_ENABLED_KEY,
  saveLiveActivityEnabled,
  loadLiveActivityEnabled,
} from '../persistence';
import { MAX_RECENT_NAMES } from '../constants';

describe('saveTimerState / loadTimerState', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips a running state', async () => {
    const state: TimerState = {
      status: 'running',
      name: 'Math',
      goalMs: 60000,
      startedAt: 1000,
      runningSince: 1000,
      accumulatedMs: 2000,
      pauseCount: 0,
    };
    await saveTimerState(state);
    expect(await loadTimerState()).toEqual(state);
  });

  it('round-trips a paused state', async () => {
    const state: TimerState = {
      status: 'paused',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      pausedAt: 5000,
      accumulatedMs: 5000,
      pauseCount: 1,
    };
    await saveTimerState(state);
    expect(await loadTimerState()).toEqual(state);
  });

  it('round-trips a completed state', async () => {
    const state: TimerState = {
      status: 'completed',
      name: 'Math',
      goalMs: 60000,
      startedAt: 0,
      endedAt: 9000,
      accumulatedMs: 5000,
      pauseCount: 1,
    };
    await saveTimerState(state);
    expect(await loadTimerState()).toEqual(state);
  });

  it('saving idle clears the key', async () => {
    await AsyncStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({
        status: 'paused',
        name: 'x',
        goalMs: 1,
        startedAt: 0,
        pausedAt: 1,
        accumulatedMs: 1,
        pauseCount: 0,
      })
    );
    await saveTimerState(initialTimerState);
    expect(await AsyncStorage.getItem(TIMER_STORAGE_KEY)).toBeNull();
  });

  it('loading with nothing stored returns idle', async () => {
    expect(await loadTimerState()).toEqual(initialTimerState);
  });

  it('loading corrupt JSON returns idle', async () => {
    await AsyncStorage.setItem(TIMER_STORAGE_KEY, '{not valid json');
    expect(await loadTimerState()).toEqual(initialTimerState);
  });

  it('loading a value with the wrong shape returns idle', async () => {
    await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ status: 'running' }));
    expect(await loadTimerState()).toEqual(initialTimerState);
  });

  it('loading a paused value missing pausedAt returns idle', async () => {
    await AsyncStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({
        status: 'paused',
        name: 'x',
        goalMs: 1,
        startedAt: 0,
        accumulatedMs: 1,
        pauseCount: 0,
      })
    );
    expect(await loadTimerState()).toEqual(initialTimerState);
  });

  it('loading a completed value missing endedAt returns idle', async () => {
    await AsyncStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({
        status: 'completed',
        name: 'x',
        goalMs: 1,
        startedAt: 0,
        accumulatedMs: 1,
        pauseCount: 0,
      })
    );
    expect(await loadTimerState()).toEqual(initialTimerState);
  });
});

describe('saveRecentName / loadRecentNames', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('loading with nothing stored returns an empty list', async () => {
    expect(await loadRecentNames()).toEqual([]);
  });

  it('saves and loads a name', async () => {
    await saveRecentName('Math');
    expect(await loadRecentNames()).toEqual(['Math']);
  });

  it('prepends new names, most recent first', async () => {
    await saveRecentName('Math');
    await saveRecentName('Reading');
    expect(await loadRecentNames()).toEqual(['Reading', 'Math']);
  });

  it('dedupes an exact repeated name, moving it to the front', async () => {
    await saveRecentName('Math');
    await saveRecentName('Reading');
    await saveRecentName('Math');
    expect(await loadRecentNames()).toEqual(['Math', 'Reading']);
  });

  it('caps the list at MAX_RECENT_NAMES', async () => {
    for (let i = 0; i < MAX_RECENT_NAMES + 2; i++) {
      await saveRecentName(`Session ${i}`);
    }
    const names = await loadRecentNames();
    expect(names).toHaveLength(MAX_RECENT_NAMES);
    expect(names[0]).toBe(`Session ${MAX_RECENT_NAMES + 1}`);
  });

  it('returns the new list from saveRecentName', async () => {
    const result = await saveRecentName('Math');
    expect(result).toEqual(['Math']);
  });

  it('loading a corrupt value returns an empty list', async () => {
    await AsyncStorage.setItem(RECENT_NAMES_KEY, '{not valid json');
    expect(await loadRecentNames()).toEqual([]);
  });

  it('loading a non-array value returns an empty list', async () => {
    await AsyncStorage.setItem(RECENT_NAMES_KEY, JSON.stringify({ foo: 'bar' }));
    expect(await loadRecentNames()).toEqual([]);
  });

  it('loading an array with non-string entries returns an empty list', async () => {
    await AsyncStorage.setItem(RECENT_NAMES_KEY, JSON.stringify(['Math', 42]));
    expect(await loadRecentNames()).toEqual([]);
  });
});

describe('saveLiveActivityEnabled / loadLiveActivityEnabled', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults to true when nothing is stored', async () => {
    expect(await loadLiveActivityEnabled()).toBe(true);
  });

  it('round-trips false', async () => {
    await saveLiveActivityEnabled(false);
    expect(await loadLiveActivityEnabled()).toBe(false);
  });

  it('round-trips true', async () => {
    await saveLiveActivityEnabled(false);
    await saveLiveActivityEnabled(true);
    expect(await loadLiveActivityEnabled()).toBe(true);
  });

  it('defaults to true on a corrupt value', async () => {
    await AsyncStorage.setItem(LIVE_ACTIVITY_ENABLED_KEY, '{not valid json');
    expect(await loadLiveActivityEnabled()).toBe(true);
  });
});
