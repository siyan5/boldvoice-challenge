# Discussion notes for the review

## Architecture decisions and why

- **Timestamps cross the bridge, not ticks.** The timer state is `{ runningSince, accumulatedMs, goalMs }`. The app talks to ActivityKit only on transitions (start, pause, resume, stop, goal reached). The widget renders time with `Text(timerInterval:)` and `ProgressView(timerInterval:)`, which iOS animates itself. This is what makes backgrounding and app death free, and it keeps the app and the widget from drifting because they derive from the same numbers. (D2, D7)
- **A pure reducer as the source of truth, and the state machine as the router.** `timerReducer` takes `now` as an argument, so all transitions are unit-tested with hand-picked timestamps, including clock rollback. `App.tsx` picks the screen from `state.status`. (D2)
- **A pure sync planner.** Which ActivityKit call a transition needs (start, update, end, none) is a small function with tests, so the toggle, hydration and "start replaces a live session" cases are checked without a simulator.
- **The bridge serializes every call.** One promise chain in the Expo module means rapid start/stop cannot interleave. Safe by construction, with a unit test pinning the exact race. (D8)
- **Local Expo module plus `@bacons/apple-targets`.** Swift stays in `modules/` and `targets/`; `npx expo prebuild --clean` regenerates the whole Xcode project, including the widget extension. Nothing in `ios/` is hand-edited or committed. (D1, D3)
- **The shared `ActivityAttributes` type is duplicated with a guard test**, because CocoaPods cannot source a file outside the pod and the plugin's shared folder links into the app target, not the pod. (D5)

## What was hardest

- **Environment before code.** No Xcode, a non-mounting simulator runtime, CocoaPods refusing the system Ruby. Most of the first hour went there.
- **Widgets never re-render on their own.** Anything computed at render time freezes until the next update. The progress bar was static until it became a `timerInterval` view; the percentage inside rings was cut for the same reason; the goal-reached moment needs one app-sent update, and a `staleDate` in the past makes iOS hide the activity entirely.
- **SwiftUI's greedy timer text.** `Text(timerInterval:)` and relative dates claim the whole row width, so nothing right-aligns until you set the text alignment explicitly, and then the same fix breaks the places that should be leading. It also wins the width contest against the session name, which truncated to "learning about a…" next to empty space until the name got `layoutPriority(1)` and the timer a minimum width.
- **The system owns the timer format.** `Text(timerInterval:)` renders `7:03`, never `00:07:03`, and cannot be told otherwise. A hand-formatted paused clock made the number change shape on every pause; the fix was one timer view for both states with `pauseTime`, and a documented deviation from the brief's HH:MM:SS mock in the widget.
- **Verifying iOS behavior versus app bugs.** The lock-screen "3:––" turned out to be Always-On display behavior, proven with byte-identical framebuffer captures, not a bug.

## What the AI got wrong and had to be fixed

- Gave a subagent a wrong example value for `timerStartMs`; the agent implemented the formula that matched the wrong number. Caught in review.
- Clamped the whole elapsed value to zero on clock rollback, discarding accumulated time. Changed to clamp only the running delta.
- Appeared to hang several times by backgrounding `npx expo run:ios` (which never exits; it becomes Metro) and waiting for it to finish, with the log piped through a buffering filter. Fixed by building with `xcodebuild` directly and polling for concrete signals.
- Put `fontWeight` next to a custom `fontFamily`, which makes iOS fall back to the system font; and set padding on `SafeAreaView`, which iOS overrides. Both caught on first run.
- Used a relative-date style for "time left" that counted up again after the goal (reported by the user), and later requested activities with a past `staleDate` that iOS silently refused to show.
- Formatted the paused clock by hand (`00:01:18`) next to a system-rendered running clock (`1:18`), so the number changed shape on pause; SwiftUI's `pauseTime` argument does this in one view. Reported by the user from screenshots.
- Computed the lock-screen percent at render time, the same freezing-value mistake as the earlier progress bar, so it read "0% of 1m goal" until the next update. Now shown only while paused.
- Capped the compact-island name at the design spec's 72pt, which truncated normal names; the island itself decides the space, so the cap was raised and iOS truncates.
- Assumed `expo install --dev` would put Jest in devDependencies; it did not.

## What to improve next

- App Intents for Pause / Stop / Resume in the expanded island, with a native-to-JS reconciliation path.
- Rename and change-goal from the overflow menu; the content state already carries `goalMs`.
- Push-driven updates so the goal-reached re-render does not depend on the app being alive.
- A test target for the Swift module; today it is verified only by the real build, because the precompiled Expo core framework does not typecheck standalone against Xcode 26's compiler.
