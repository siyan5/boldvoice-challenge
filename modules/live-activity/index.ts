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
  getActivityCount(): number;
}>('LiveActivity');

// Every native call is chained onto this promise so calls run one at a time,
// in call order. Without this, a `startActivity` in flight when `endActivity`
// is called could have its native request land after the end, resurrecting a
// Live Activity the JS side thinks is gone (a "zombie" activity). Chaining
// makes that ordering impossible by construction.
let chain: Promise<void> = Promise.resolve();
const noop = () => undefined;

function enqueue<T>(op: () => Promise<T>): Promise<T> {
  const result = chain.then(op);
  chain = result.then(noop, noop);
  return result;
}

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
  await enqueue(() => native.startActivity(attributes, state));
}

/** Updates the running Live Activity's content state. No-op when the native module is absent. */
export async function updateActivity(state: LiveActivityContentState): Promise<void> {
  if (native == null) return;
  await enqueue(() => native.updateActivity(state));
}

/** Ends the running Live Activity. No-op when the native module is absent. */
export async function endActivity(): Promise<void> {
  if (native == null) return;
  await enqueue(() => native.endActivity());
}

/** Number of Live Activities the OS currently reports. Diagnostic for simulator tests only. */
export async function getActivityCount(): Promise<number> {
  if (native == null) return 0;
  return enqueue(() => Promise.resolve(native.getActivityCount()));
}
