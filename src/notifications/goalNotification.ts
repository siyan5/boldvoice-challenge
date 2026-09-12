import * as Notifications from 'expo-notifications';
import { formatGoal } from '../timer/format';
import { remainingMs, TimerState } from '../timer/timerReducer';

export const GOAL_NOTIFICATION_ID = 'goal-reached';

/** Pure. Epoch ms when the goal will be reached for a running session, or null when idle/paused/completed or already past the goal. */
export function goalReachedAt(state: TimerState, now: number): number | null {
  if (state.status !== 'running') return null;
  const remaining = remainingMs(state, now);
  if (remaining <= 0) return null;
  return now + remaining;
}

/** Pure. Notification content for a session. */
export function goalNotificationContent(
  state: Extract<TimerState, { status: 'running' | 'paused' }>
): { title: string; body: string } {
  return {
    title: 'Goal reached',
    body: `${state.name} · ${formatGoal(state.goalMs)} done. Keep going or stop.`,
  };
}

/** Asks for alert+sound permission once; resolves to whether notifications are allowed. Safe to call repeatedly. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true },
  });
  return requested.granted;
}

/** Cancels any pending goal notification, then schedules one if a running session has a goal still ahead and permission is granted. */
export async function syncGoalNotification(state: TimerState): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(GOAL_NOTIFICATION_ID);

    const reachedAt = goalReachedAt(state, Date.now());
    if (reachedAt == null || state.status !== 'running') return;

    const allowed = await ensureNotificationPermission();
    if (!allowed) return;

    await Notifications.scheduleNotificationAsync({
      identifier: GOAL_NOTIFICATION_ID,
      content: { ...goalNotificationContent(state), sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reachedAt },
    });
  } catch (e) {
    console.warn('Goal notification sync failed', e);
  }
}

/** Call once at app start: shows the banner and plays sound even while the app is in the foreground. */
export function configureNotificationPresentation(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
