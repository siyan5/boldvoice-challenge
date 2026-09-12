import { requireOptionalNativeModule } from 'expo';
import type { LiveActivityAttributes, LiveActivityContentState } from '../../src/timer/liveActivityState';

// Only one Live Activity exists at a time by design, so there are no activity
// IDs on the JS side; on the native side, `startActivity` ends any existing
// activity before starting the new one.
const native = requireOptionalNativeModule<{
  areActivitiesEnabled(): boolean;
  startActivity(attributes: LiveActivityAttributes, state: LiveActivityContentState): Promise<void>;
  updateActivity(state: LiveActivityContentState): Promise<void>;
  endActivity(): Promise<void>;
}>('LiveActivity');

/** Whether Live Activities are available: native module is present and the OS/user has them enabled. */
export function isLiveActivitySupported(): boolean {
  return native != null && native.areActivitiesEnabled();
}

/** Starts a Live Activity. No-op when the native module is absent (e.g. Expo Go). */
export async function startActivity(
  attributes: LiveActivityAttributes,
  state: LiveActivityContentState
): Promise<void> {
  if (native == null) return;
  await native.startActivity(attributes, state);
}

/** Updates the running Live Activity's content state. No-op when the native module is absent. */
export async function updateActivity(state: LiveActivityContentState): Promise<void> {
  if (native == null) return;
  await native.updateActivity(state);
}

/** Ends the running Live Activity. No-op when the native module is absent. */
export async function endActivity(): Promise<void> {
  if (native == null) return;
  await native.endActivity();
}
