# Study Timer with Live Activities

A React Native (Expo) iOS study timer. The app controls the timer; a SwiftUI Live Activity mirrors it on the lock screen and in the Dynamic Island. Built for the challenge in [docs/CHALLENGE.md](docs/CHALLENGE.md).

## Status (2026-09-12)

Complete for the challenge's must-haves, verified in the iOS 26 simulator on an iPhone 17 Pro:

- First-run screen, new-session sheet (name, recent names, goal of 25m / 50m / 1h / 2h), timer screen with a progress ring, pause / resume / stop, session summary with total time, start and end times, and pause count.
- Live Activity on the lock screen: name, live count-up, goal bar, goal and time remaining; paused state frozen with a PAUSED label and the percent of goal; "x over goal" once the goal passes. The clock uses the system timer format (`7:03`, `1:23:45`) in both states, one view with `pauseTime`, so it does not change shape on pause.
- Dynamic Island: compact (name and time), expanded (ring, kicker, name, goal and remaining, large timer), minimal (ring). Paused states in amber.
- Sessions survive backgrounding, force-kill, relaunch and reinstall. Rapid start/stop leaves no orphaned activities.
- A Live Activity toggle in the app ends and restarts the activity without touching the timer.

Design follows the Claude Design handoff in `docs/design/`. Deliberately cut from the handoff: App Intent buttons in the island, the overflow menu (rename, change goal), the custom goal wheel, Archivo in the widget, animations, and percentage text inside rings. In development builds a 1-minute goal tile is added for testing. Setup steps below were exercised on the development machine, not yet from a clean clone.

## Setup

Requirements: macOS with Xcode 26 and an iOS 26 simulator runtime, Node 20+, CocoaPods 1.16+ (`brew install cocoapods`). An Apple developer account is not needed for the simulator.

```bash
npm install
npx expo prebuild --platform ios --clean
npx expo run:ios
```

`prebuild` generates the `ios/` folder (gitignored), including the widget extension target, from `app.json` and `targets/widget/`. `run:ios` builds with Xcode, installs on the default booted simulator, and starts Metro. The first build takes about 10 minutes.

Use an iPhone with a Dynamic Island (iPhone 15 Pro or newer). To target a specific simulator:

```bash
npx expo run:ios --device "iPhone 17 Pro"
```

Keep the simulator unlocked while `run:ios` finishes, otherwise its final "open app" step fails with `LSApplicationWorkspaceErrorDomain error 115` and Metro is not started. If that happens, run `npx expo start --dev-client` and pick the server in the app's launcher.

Tests and typecheck:

```bash
npm test
npm run typecheck
```

For iteration after the first run, a plain Xcode build exits when done and keeps Metro separate, which is easier to script:

```bash
xcodebuild -workspace ios/StudyTimer.xcworkspace -scheme StudyTimer -configuration Debug -sdk iphonesimulator -destination 'name=iPhone 17 Pro' build
```

Then `xcrun simctl install booted <path to StudyTimer.app in DerivedData>` and open the dev client; keep `npx expo start --dev-client` running in another terminal. JavaScript changes hot reload; Swift changes need the build.

## Live demo script

1. Launch the app on the simulator. First-run screen. Tap "Start a session", type a name, pick a goal (the 1m tile exists only in development builds), "Start timer". Tap Allow on the one-time Live Activities prompt.
2. `Cmd+Shift+H` for the home screen: compact island with the name and a live timer. Click and hold the island: expanded view with the animated ring, "STUDYING", goal and time remaining, large timer.
3. `Cmd+L`: lock-screen card with the gradient bar and "x left". Wake the screen (move the mouse) if it has dimmed into Always-On, where iOS hides timer seconds.
4. Back in the app, Pause: ring goes grey, PAUSED pill; island and lock screen freeze and turn amber. Resume.
5. With a 1m goal, wait for it to pass: the ring fills, the app says "Goal reached", the island and lock screen say "x over goal" and keep counting.
6. Kill the app from the app switcher: the island keeps the activity. Relaunch: the session is re-adopted with the correct elapsed time and the activity is untouched.
7. Stop: the activity disappears immediately; the summary screen shows total time, start and end, and the pause count.

## Simulator notes

- The Simulator menus are in the Mac menu bar: Device > Home (`Cmd+Shift+H`), Device > Lock (`Cmd+L`). Unlock by pressing Home and dragging up from the bottom edge.
- A few seconds after locking, the simulator dims into Always-On mode. In that mode iOS renders every timer with the seconds as `––` and refreshes once per minute. This is system behavior, not the app. Move the mouse or press a key to wake the display and the seconds return.
- The simulator's default keyboard may be a pinyin layout, which inserts spaces between syllables when text is injected. Type session names by hand, or tap a recent-name chip.
- The minimal island presentation appears only when another app's Live Activity shares the island. The simulator's Clock app does not launch, so it was not observed; the view exists and typechecks.
- The OS-level Live Activities switch (Settings > Study Timer) was not reached in the simulator. When it is off, the app's status card reads "Live Activities are off" with a link to Settings, and requests fail quietly.

## How it works

```
src/timer/timerReducer.ts       pure state machine: idle | running | paused | completed, timestamps only
src/timer/useTimer.ts           React hook: reducer, clock tick, persistence, Live Activity sync, goal-instant update
src/timer/liveActivitySync.ts   pure rule: which ActivityKit call a transition needs (start / update / end / none)
src/timer/liveActivityState.ts  maps timer state to the ActivityKit attributes and content state
src/timer/persistence.ts        AsyncStorage: session, recent names, Live Activity toggle, with shape guards
src/timer/format.ts             HH:MM:SS, goal labels, remaining time, clock times
src/screens/                    FirstRun, NewSessionSheet, Timer, SessionComplete (presentational)
src/components/                 GradientButton, ProgressRing (SVG), Pill
src/theme.ts                    design tokens from the handoff
App.tsx                         the state machine is the router
modules/live-activity/          local Expo module: serialized TypeScript API + Swift ActivityKit bridge
targets/widget/                 widget extension: Live Activity + Dynamic Island views (SwiftUI)
```

The key idea is that timestamps, not ticks, cross the bridge. The timer state is `{ runningSince, accumulatedMs, goalMs }`. On start, pause, resume, and stop the app sends one update to the Live Activity, plus one at the instant the goal is reached. While running, the widget uses `Text(timerInterval:)` and `ProgressView(timerInterval:)`, so iOS animates the clock, bar and ring itself. Backgrounding or killing the app costs nothing.

Every bridge call is queued behind the previous one, so rapid start/stop cannot interleave and leave an orphaned activity. On relaunch, the native start recognises an identical surviving activity and leaves it alone.

`StudyTimerAttributes.swift` is the contract shared by the app and the widget. It exists in both `modules/live-activity/ios/` and `targets/widget/`, and a Jest test fails if the copies differ.

The widget target is generated by the `@bacons/apple-targets` config plugin from `targets/widget/expo-target.config.js`, so a clean prebuild reproduces the whole native project.

## Must-have checklist

| Requirement | How it is satisfied | Verified |
| --- | --- | --- |
| Start a session with a custom name | New-session sheet; name trimmed and capped at 60 characters, recent names offered as chips | Simulator |
| Elapsed time in HH:MM:SS | `formatHHMMSS` over timestamp-derived elapsed; ring clock ticks every 250 ms. The widget uses the system timer format instead (D7) | Unit tests, simulator |
| Pause / resume | Reducer transitions; elapsed is banked on pause, never a running counter | Unit tests, simulator |
| Stop ends the timer and the Live Activity | Stop moves to `completed`; the sync planner issues `end` | Unit tests, simulator |
| Live Activity appears on start, shows name and elapsed | ActivityKit request on the `start` plan; widget renders name and `Text(timerInterval:)` | Simulator |
| Updates in real time | The widget's clock and bar are system-driven from timestamps, so no updates are needed while running | Simulator |
| Disappears on stop | `end(dismissalPolicy: .immediate)` | Simulator |
| Reflects pause / resume | One `update` per transition with `isPaused` and the frozen elapsed | Simulator |
| Expo module with a clean TypeScript interface | `modules/live-activity`: `startActivity`, `updateActivity`, `endActivity`, `isLiveActivitySupported`, `getActivityCount` | Typecheck, unit tests |
| Backgrounded: activity keeps showing | Nothing runs in JS while running; the widget counts on its own | Simulator |
| Killed: activity persists with last state | Session persisted on every transition; on relaunch the app re-adopts it, and the native start leaves an identical surviving activity untouched | Simulator: `simctl terminate` while paused, relaunch, activity count stayed 1 |
| Rapid start / stop: no zombies | Bridge calls are serialized through one promise chain, and every start ends existing activities first | Unit test for the interleaving; simulator: three rapid cycles, OS count returned to 0 each time |
| Dynamic Island compact / expanded / minimal | Name and timer; ring, kicker, name, goal, remaining, large timer; ring only | Compact and expanded in the simulator; minimal needs a second app's Live Activity, which the simulator cannot provide |
| Goal reached | Ring caps at 100%; remaining text switches to "x over goal" and counts up; the app sends one update at the goal instant | Simulator with the dev 1-minute goal |
| Live Activity toggle | Off ends the activity, timer keeps running; on restarts it; state persisted | Simulator |

## Documentation

- [docs/DISCUSSION.md](docs/DISCUSSION.md): the review talking points: architecture and why, what was hardest, what the AI got wrong, what to improve.
- [docs/DECISIONS.md](docs/DECISIONS.md): architecture decisions with alternatives and consequences.
- [docs/JOURNAL.md](docs/JOURNAL.md): chronological log of actions, bugs, environment problems, and mistakes.
- [docs/design/HANDOFF.md](docs/design/HANDOFF.md): the design spec the UI follows, with screenshots alongside.
- [docs/CHALLENGE.md](docs/CHALLENGE.md): the original brief.

## Assumptions

- A count-up timer has no natural end, so every session carries a goal (default 2h, presets 25m / 50m / 1h / 2h) that the bar and ring measure against. Past the goal the timer keeps counting and the widget shows time over goal (decision D9).
- Only one session, and therefore one Live Activity, exists at a time. Starting a new session ends the previous activity first.
- When the app is killed, the activity persists with its last state rather than ending; the challenge allows either.
- Simulator only; no physical device was used, which the challenge allows. Live Activities cannot be started while the app is in the background, which matters only for the goal-instant update (see decision D7).
