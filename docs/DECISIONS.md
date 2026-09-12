# Technical decisions

One entry per decision. Newest at the bottom. Format: context, decision, alternatives, consequences.

## D1. Expo with a local Expo Module for the ActivityKit bridge

- **Context:** The spec requires React Native/Expo for the app and Swift/SwiftUI for the Live Activity, with a clean TypeScript interface between them.
- **Decision:** Expo SDK 57 (blank TypeScript template, `expo-dev-client`), with the bridge written as a local Expo Module in Swift under `modules/`.
- **Alternatives:** Bare React Native with a TurboModule. More boilerplate and no config-plugin story for the widget target.
- **Consequences:** Native code only runs in a dev client build, never in Expo Go. The JS side ships a no-op fallback so the timer UI still works without native code.

## D2. Timestamps, not ticks, cross the bridge

- **Context:** ActivityKit budgets updates, and a lock screen widget cannot receive a JS message every second while the app is backgrounded.
- **Decision:** The timer's source of truth is `{ startedAt, accumulatedMs, pausedAt }`. JS sends these to native only on state transitions (start, pause, resume, stop). The widget renders the running time with SwiftUI `Text(timerInterval:)`, which counts up on its own with zero updates.
- **Alternatives:** A JS interval calling `updateActivity` every second. Breaks the moment the app is backgrounded and burns the update budget.
- **Consequences:** Backgrounding is free. Pause sends one update with a frozen elapsed value. The same state shape drives the RN screen, so the two views cannot drift. Since the design update the content state also carries `goalMs`, so a goal can change without restarting the activity; only the name lives in the fixed attributes.

## D3. Widget extension target via `@bacons/apple-targets`

- **Context:** Expo prebuild does not know how to add a widget extension target to the Xcode project.
- **Decision:** Use the `@bacons/apple-targets` config plugin so `npx expo prebuild --clean` regenerates the target from `targets/`.
- **Alternatives:** Check in a hand-edited `ios/` folder. Faster once, but every prebuild would wipe it.
- **Consequences:** `ios/` stays gitignored and the whole native project is reproducible from a clean clone.

## D4. Progress ring measures a fixed 25-minute goal (superseded by D9)

- **Context:** The spec asks for a progress ring in the expanded Dynamic Island, but a count-up timer has no natural end.
- **Decision:** The ring shows elapsed time as a fraction of a fixed 25-minute focus goal, clamped at 100%.
- **Alternatives:** A user-selected goal at session start. More UI for little demo value.
- **Consequences:** Documented assumption; trivial to make configurable later since the goal is a single constant passed in the activity attributes.

## D5. `StudyTimerAttributes.swift` is duplicated, with a test that keeps the copies identical

- **Context:** The `ActivityAttributes` type must compile into both the app (inside the LiveActivity Expo module, which CocoaPods builds from `modules/live-activity/ios/`) and the widget extension (built from `targets/widget/`). CocoaPods cannot source files from outside the pod folder, and the plugin's `_shared` folder links into the app target, not into the pod.
- **Decision:** Keep one copy in each location and add `sharedAttributes.test.ts`, which fails if the two files differ.
- **Alternatives:** A symlink (git and prebuild handle them inconsistently), or a third shared pod (more plumbing than the whole feature).
- **Consequences:** Editing the contract means editing two files; the test makes forgetting impossible to miss.

## D6. Walking skeleton before polish

- **Context:** The risk in this project is build wiring (second target, entitlements, shared type), not SwiftUI.
- **Decision:** Ship the thinnest end-to-end slice first: start and end only, minimal views in all Live Activity regions. Then pause/resume, then edge cases, then the ring and styling.
- **Consequences:** The first Live Activity milestone is reached before any visual work.

## D7. The widget lets iOS render time-based content

- **Context:** A widget extension is not re-rendered between content-state updates. Anything computed at render time (elapsed seconds, a progress fraction) freezes until the next update from the app.
- **Decision:** The count-up clock is a single `Text(timerInterval:pauseTime:countsDown:false)` in both states: while running it counts on the system clock; while paused, `pauseTime` freezes it at the stored elapsed value, so the format is identical across a pause. The progress bar and ring are `ProgressView(timerInterval:countsDown:false)` while running and a static value from the frozen `elapsedMs` while paused.
- **Alternatives:** Push an `updateActivity` every second from JS. Fails as soon as the app is backgrounded and burns the ActivityKit update budget.
- **Consequences:** Zero updates while running, so backgrounding and app death cost nothing. One exception: the goal instant. A widget never re-renders on its own, so the app sends a single content-identical update when the goal is reached (only possible while the app is alive; `staleDate` is the fallback), and the widget picks "left" versus "over goal" by comparing the clock with the goal end at render time. The widget shows elapsed time in the system timer format (`7:03`, `1:23:45`), which cannot be forced to the zero-padded HH:MM:SS the app uses; this is a documented deviation from the brief's lock-screen mock. Any value computed at render time (the percent-of-goal caption) is shown only while paused, where it is genuinely fixed. Known platform limitation: in the Always-On (dimmed) lock screen, iOS shows timer seconds as `––` and refreshes once per minute. This is system behavior for all apps and is left as is. See the journal entry for 2026-09-12.

## D8. The bridge serializes every ActivityKit call

- **Context:** The hook fires bridge calls without awaiting them. A `startActivity` still in flight (ending the old activity, then requesting) can be overtaken by an `endActivity` that finds nothing to end; the request then lands after the end and leaves an activity the app believes is gone.
- **Decision:** `modules/live-activity/index.ts` chains every native call on one promise, so calls run strictly in call order, and a rejection does not break the chain. Rapid start/stop is safe by construction, not by mitigation; a unit test pins the interleaving.
- **Alternatives:** Cancellation tokens or "latest wins" logic. More code, and harder to reason about than a queue.
- **Consequences:** A hung native call would stall later calls. ActivityKit calls take milliseconds, so this is accepted. The native `startActivity` additionally leaves an existing activity untouched when its attributes and content state are identical, so relaunch after a kill does not blink the activity off and on.

## D9. Every session carries its own goal

- **Context:** The design handoff makes the goal a first-class part of a session (default 2h; 25m / 50m / 1h / 2h presets) and derives the ring, "time left" and "over goal" from it. Supersedes D4.
- **Decision:** `goalMs` is part of the reducer's session fields and of the Live Activity content state. The reducer falls back to the default for invalid values. Past the goal the timer keeps counting; the widget shows time over goal.
- **Alternatives:** Keep the fixed constant (rejected by the design), or stop the session at the goal (a study timer should not cut a session short).
- **Consequences:** The goal-reached moment needs one app-sent update because widgets do not re-render on their own (see D7). A 1-minute preset exists in development builds so the moment can be demonstrated.

## D10. What was cut from the design handoff, and why

- **Context:** The handoff is complete and high-fidelity; the challenge budget is a few hours.
- **Decision:** Cut App Intent Pause/Stop buttons in the island (needs the intent compiled into both targets, background app launch and a native-to-JS reconciliation path), the overflow menu (rename, change goal), the custom goal wheel (a dependency and a modal inside a modal), Archivo inside the widget extension (font bundling in an extension), the specified animations, and the percentage text inside rings (it cannot refresh between updates and would read stale).
- **Consequences:** Everything visible in a demo matches the handoff; the cut items are the natural next features. Rename and change-goal are cheap now that `goalMs` is in the content state.

## D11. Goal-reached notification is a scheduled local notification

- **Context:** The widget's "over goal" switch depends on an app-sent update at the goal instant, which cannot happen if the app is suspended or killed (D7, D9).
- **Decision:** On every transition the app cancels and, while running with the goal ahead, re-schedules one local notification (`expo-notifications`, fixed identifier) for the goal instant. Permission is requested on the first session start. The banner is shown even in the foreground.
- **Alternatives:** Push notifications through a server (works everywhere but needs a backend), or nothing (the widget then only updates when the app returns).
- **Consequences:** The user is told at the right moment regardless of app state. The widget still needs the app-sent update to switch its own copy; tapping the notification brings the app forward, which fires the pending timer.

## D12. Session history lives in AsyncStorage, newest first, capped

- **Context:** The summary screen already computed everything a record needs; users asked for history.
- **Decision:** `src/history/` stores `SessionRecord`s (id, name, goal, start, end, total, pauses) under one key, newest first, deduped by id, capped at 500; grouping by local day and per-name totals are pure functions with tests. A record is appended when a session reaches `completed`.
- **Alternatives:** SQLite (overkill for hundreds of rows), or deriving history from nothing (there was no store).
- **Consequences:** Recent-name chips could later derive from history instead of their own list. Sync and export are straightforward additions.
