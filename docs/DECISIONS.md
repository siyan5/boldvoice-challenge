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
- **Consequences:** Backgrounding is free. Pause sends one update with a frozen elapsed value. The same state shape drives the RN screen, so the two views cannot drift.

## D3. Widget extension target via `@bacons/apple-targets`

- **Context:** Expo prebuild does not know how to add a widget extension target to the Xcode project.
- **Decision:** Use the `@bacons/apple-targets` config plugin so `npx expo prebuild --clean` regenerates the target from `targets/`.
- **Alternatives:** Check in a hand-edited `ios/` folder. Faster once, but every prebuild would wipe it.
- **Consequences:** `ios/` stays gitignored and the whole native project is reproducible from a clean clone.

## D4. Progress ring measures a fixed 25-minute goal

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
- **Decision:** While running, the count-up clock is `Text(timerInterval:countsDown:false)` and the progress bar is `ProgressView(timerInterval:countsDown:false)`. Both are driven by the system clock. While paused, both are static values from the frozen `elapsedMs`.
- **Alternatives:** Push an `updateActivity` every second from JS. Fails as soon as the app is backgrounded and burns the ActivityKit update budget.
- **Consequences:** Zero updates while running, so backgrounding and app death cost nothing. Known platform limitation: in the Always-On (dimmed) lock screen, iOS shows timer seconds as `––` and refreshes once per minute. This is system behavior for all apps and is left as is. See the journal entry for 2026-09-12.

## D8. The bridge serializes every ActivityKit call

- **Context:** The hook fires bridge calls without awaiting them. A `startActivity` still in flight (ending the old activity, then requesting) can be overtaken by an `endActivity` that finds nothing to end; the request then lands after the end and leaves an activity the app believes is gone.
- **Decision:** `modules/live-activity/index.ts` chains every native call on one promise, so calls run strictly in call order, and a rejection does not break the chain. Rapid start/stop is safe by construction, not by mitigation; a unit test pins the interleaving.
- **Alternatives:** Cancellation tokens or "latest wins" logic. More code, and harder to reason about than a queue.
- **Consequences:** A hung native call would stall later calls. ActivityKit calls take milliseconds, so this is accepted. The native `startActivity` additionally leaves an existing activity untouched when its attributes and content state are identical, so relaunch after a kill does not blink the activity off and on.
