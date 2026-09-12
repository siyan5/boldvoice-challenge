jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
}));

import * as Notifications from 'expo-notifications';
import {
  GOAL_NOTIFICATION_ID,
  goalReachedAt,
  goalNotificationContent,
  syncGoalNotification,
} from '../goalNotification';
import { TimerState } from '../../timer/timerReducer';

const idle: TimerState = { status: 'idle' };
const running: TimerState = {
  status: 'running',
  name: 'Chapter 5 Review',
  goalMs: 30 * 60_000,
  startedAt: 1000,
  runningSince: 1000,
  accumulatedMs: 25 * 60_000,
  pauseCount: 0,
};
const runningPastGoal: TimerState = {
  ...running,
  accumulatedMs: 30 * 60_000,
};
const paused: TimerState = {
  status: 'paused',
  name: 'Chapter 5 Review',
  goalMs: 30 * 60_000,
  startedAt: 0,
  pausedAt: 25 * 60_000,
  accumulatedMs: 25 * 60_000,
  pauseCount: 1,
};

describe('goalReachedAt', () => {
  it('returns null when idle', () => {
    expect(goalReachedAt(idle, 1000)).toBeNull();
  });

  it('returns null when paused', () => {
    expect(goalReachedAt(paused, 1000)).toBeNull();
  });

  it('returns now + remaining time when running', () => {
    const now = running.status === 'running' ? running.runningSince : 0;
    expect(goalReachedAt(running, now)).toBe(now + 5 * 60_000);
  });

  it('returns null when a running session is already past its goal', () => {
    expect(goalReachedAt(runningPastGoal, 1000)).toBeNull();
  });
});

describe('goalNotificationContent', () => {
  it('includes the name and the goal label in the body', () => {
    const content = goalNotificationContent(running);
    expect(content.title).toBe('Goal reached');
    expect(content.body).toBe('Chapter 5 Review · 30m done. Keep going or stop.');
  });
});

describe('syncGoalNotification', () => {
  const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      granted: true,
      status: 'granted',
      expires: 'never',
      canAskAgain: true,
    } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cancels then schedules for a running session', async () => {
    await syncGoalNotification(running);

    expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      GOAL_NOTIFICATION_ID
    );
    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: GOAL_NOTIFICATION_ID,
        trigger: expect.objectContaining({ type: 'date' }),
      })
    );

    const cancelOrder = mockNotifications.cancelScheduledNotificationAsync.mock.invocationCallOrder[0];
    const scheduleOrder = mockNotifications.scheduleNotificationAsync.mock.invocationCallOrder[0];
    expect(cancelOrder).toBeLessThan(scheduleOrder);
  });

  it('only cancels when idle', async () => {
    await syncGoalNotification(idle);

    expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      GOAL_NOTIFICATION_ID
    );
    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('only cancels when permission is denied', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      status: 'denied',
      expires: 'never',
      canAskAgain: false,
    } as never);
    mockNotifications.requestPermissionsAsync.mockResolvedValue({
      granted: false,
      status: 'denied',
      expires: 'never',
      canAskAgain: false,
    } as never);

    await syncGoalNotification(running);

    expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      GOAL_NOTIFICATION_ID
    );
    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
