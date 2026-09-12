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
