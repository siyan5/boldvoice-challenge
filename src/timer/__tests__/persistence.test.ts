jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialTimerState, TimerState } from '../timerReducer';
import { saveTimerState, loadTimerState, TIMER_STORAGE_KEY } from '../persistence';

describe('saveTimerState / loadTimerState', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips a running state', async () => {
    const state: TimerState = {
      status: 'running',
      name: 'Math',
      runningSince: 1000,
      accumulatedMs: 2000,
    };
    await saveTimerState(state);
    expect(await loadTimerState()).toEqual(state);
  });

  it('round-trips a paused state', async () => {
    const state: TimerState = { status: 'paused', name: 'Math', accumulatedMs: 5000 };
    await saveTimerState(state);
    expect(await loadTimerState()).toEqual(state);
  });

  it('saving idle clears the key', async () => {
    await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ status: 'paused', name: 'x', accumulatedMs: 1 }));
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
});
