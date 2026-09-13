# Technical decisions

One entry per decision. Newest at the bottom. Format: context, decision, alternatives, consequences.

## D1. Expo with a local Expo Module for the ActivityKit bridge

- **Context:** React Native/Expo for the app, Swift/SwiftUI for the Live Activity, a clean TypeScript interface between them.
- **Decision:** Expo SDK 57 with `expo-dev-client`; the bridge is a local Expo Module in Swift under `modules/`.
- **Alternatives:** Bare React Native with a TurboModule. More boilerplate and no config-plugin story for the widget target.
- **Consequences:** Native code runs only in a dev-client build, never in Expo Go. The JS side has a no-op fallback so the timer works without native code.
## D2. Timestamps, not ticks, cross the bridge

- **Context:** ActivityKit budgets updates, and a lock-screen widget cannot receive a JS message every second while the app is backgrounded.
- **Decision:** The timer's source of truth is `{ runningSince, accumulatedMs, goalMs }`. JS sends a content state to native only on transitions (start, pause, resume, stop) plus once at the goal instant. The widget counts up on its own from a single start date.
- **Alternatives:** A JS interval calling `updateActivity` every second. Breaks the moment the app is backgrounded and burns the update budget.
- **Consequences:** Backgrounding and app death are free. The app screen and the widget derive from the same numbers, so they cannot drift while both exist. `goalMs` lives in the content state, not the fixed attributes, so a goal can change without restarting the activity.
## D3. Widget extension target via `@bacons/apple-targets`

- **Context:** Expo prebuild does not know how to add a widget extension target to the Xcode project.
- **Decision:** Use the `@bacons/apple-targets` config plugin so `npx expo prebuild --clean` regenerates the target from `targets/`.
- **Alternatives:** Check in a hand-edited `ios/` folder. Faster once, but every prebuild would wipe it.
- **Consequences:** `ios/` stays gitignored and the whole native project is reproducible from a clean clone.

## D4. Fixed 25-minute goal

Superseded by D9. The first version measured the ring against a hard-coded goal the user never saw.
## D5. `StudyTimerAttributes.swift` is duplicated, with a test that keeps the copies identical

- **Context:** The `ActivityAttributes` type must compile into both the app (inside the LiveActivity Expo module, which CocoaPods builds from `modules/live-activity/ios/`) and the widget extension (built from `targets/widget/`). CocoaPods cannot source files from outside the pod folder, and the plugin's `_shared` folder links into the app target, not into the pod.
- **Decision:** Keep one copy in each location and add `sharedAttributes.test.ts`, which fails if the two files differ.
- **Alternatives:** A symlink (git and prebuild handle them inconsistently), or a third shared pod (more plumbing than the whole feature).
- **Consequences:** Editing the contract means editing two files; the test makes forgetting impossible to miss.

## D7. The widget lets iOS render time-based content

- **Context:** A widget is not re-rendered between content-state updates. Anything computed at render time freezes until the next update from the app.
- **Decision:** The clock is one `Text(timerInterval:pauseTime:)` in both states: it counts on the system clock while running and freezes at `pauseTime` while paused. The bar and ring are `ProgressView(timerInterval:)` while running and a static value while paused. Values that must be computed at render time (the percent caption) are shown only while paused.
- **Alternatives:** Push an update every second from JS. Fails as soon as the app is backgrounded.
- **Consequences:**
  - Zero updates while running.
  - The goal instant is the one exception: the app sends a single content-identical update so the widget re-renders and switches "x left" to "x over goal"; `staleDate` is the fallback when the app is not alive.
  - The widget uses the system timer format (`7:03`, `1:23:45`), which cannot be forced to the app's zero-padded HH:MM:SS. A documented deviation from the brief's lock-screen mock.
  - In Always-On mode iOS hides timer seconds as `––` and refreshes once a minute. System behavior, left as is.
## D8. The bridge serializes every ActivityKit call

- **Context:** The hook fires bridge calls without awaiting them. A `startActivity` still in flight (ending the old activity, then requesting) can be overtaken by an `endActivity` that finds nothing to end; the request then lands after the end and leaves an activity the app believes is gone.
- **Decision:** `modules/live-activity/index.ts` chains every native call on one promise, so calls run strictly in call order, and a rejection does not break the chain. Rapid start/stop is safe by construction, not by mitigation; a unit test pins the interleaving.
- **Alternatives:** Cancellation tokens or "latest wins" logic. More code, and harder to reason about than a queue.
- **Consequences:** A hung native call would stall later calls. ActivityKit calls take milliseconds, so this is accepted. The native `startActivity` additionally leaves an existing activity untouched when its attributes and content state are identical, so relaunch after a kill does not blink the activity off and on.

## D9. Every session carries its own goal

- **Context:** A count-up timer has no end, so the first ring measured against a hidden 25-minute constant and meant nothing to the user (D4). The design handoff makes the goal part of every session (default 2h; 25m / 50m / 1h / 2h presets) and derives the ring, "x left" and "x over goal" from it.
- **Decision:** `goalMs` is part of the reducer's session fields and of the Live Activity content state. The reducer falls back to the default for invalid values. Past the goal the timer keeps counting; the widget shows time over goal.
- **Alternatives:** Keep the fixed constant (rejected by the design), or stop the session at the goal (a study timer should not cut a session short).
- **Consequences:** The goal-reached moment needs one app-sent update because widgets do not re-render on their own (see D7). A 1-minute preset exists in development builds so the moment can be demonstrated.

## D10. What was cut from the design handoff

- **Context:** The handoff is complete and high-fidelity; the challenge budget is a few hours.
- **Decision:** Cut App Intent buttons in the island (needs the intent in both targets plus native-to-JS reconciliation), the overflow menu, the custom goal wheel, Archivo inside the widget extension, the specified animations, and percent text inside rings (it cannot refresh between updates).
- **Consequences:** Everything visible in the demo matches the handoff; the cut items are the natural next features.
## D11. Goal-reached notification is a scheduled local notification

- **Context:** The widget's "over goal" switch depends on an app-sent update, which cannot happen if the app is suspended or killed.
- **Decision:** On every transition the app cancels and, while running with the goal ahead, re-schedules one local notification for the goal instant.
- **Alternatives:** Push notifications through a server (needs a backend), or nothing.
- **Consequences:** The user is told at the right moment regardless of app state. Tapping the notification brings the app forward, which fires the pending widget update.
## D12. Session history lives in AsyncStorage

- **Decision:** Completed sessions are stored under one key, newest first, capped at 500. Grouping by day and per-name totals are pure functions with tests.
- **Alternatives:** SQLite. Overkill for hundreds of rows.
- **Consequences:** Recent-name chips could later derive from history; sync and export are straightforward additions.