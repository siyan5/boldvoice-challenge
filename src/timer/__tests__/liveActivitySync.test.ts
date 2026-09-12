import { planLiveActivitySync } from '../liveActivitySync';
import { TimerState } from '../timerReducer';

const idle: TimerState = { status: 'idle' };
const running: TimerState = {
  status: 'running', name: 'Math', goalMs: 7_200_000, startedAt: 1000, runningSince: 1000, accumulatedMs: 0, pauseCount: 0,
};
const paused: TimerState = {
  status: 'paused', name: 'Math', goalMs: 7_200_000, startedAt: 1000, pausedAt: 5000, accumulatedMs: 4000, pauseCount: 1,
};
const completed: TimerState = {
  status: 'completed', name: 'Math', goalMs: 7_200_000, startedAt: 1000, endedAt: 9000, accumulatedMs: 8000, pauseCount: 1,
};
const on = (state: TimerState) => ({ state, enabled: true });
const off = (state: TimerState) => ({ state, enabled: false });

it('starts when a session begins from idle', () => {
  expect(planLiveActivitySync(on(idle), on(running))).toBe('start');
});
it('updates on pause and resume', () => {
  expect(planLiveActivitySync(on(running), on(paused))).toBe('update');
  expect(planLiveActivitySync(on(paused), on(running))).toBe('update');
});
it('ends on stop and does nothing on dismiss', () => {
  expect(planLiveActivitySync(on(running), on(completed))).toBe('end');
  expect(planLiveActivitySync(on(completed), on(idle))).toBe('none');
});
it('restarts when Start replaces a live session', () => {
  const replaced: TimerState = { ...running, startedAt: 2000, runningSince: 2000 };
  expect(planLiveActivitySync(on(running), on(replaced))).toBe('start');
});
it('starts on hydration from idle', () => {
  expect(planLiveActivitySync(on(idle), on(paused))).toBe('start');
});
it('ends when the toggle turns off and starts when it turns back on', () => {
  expect(planLiveActivitySync(on(running), off(running))).toBe('end');
  expect(planLiveActivitySync(off(running), on(running))).toBe('start');
  expect(planLiveActivitySync(off(running), off(paused))).toBe('none');
});
