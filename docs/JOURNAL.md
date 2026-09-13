# Journal

What was built, what broke, and what was learned. Newest at the bottom. Environment setup and tooling notes are left out; the README's simulator notes carry the ones that matter.

## Bugs worth discussing

The five that changed the design or the process, in the order they were found.

1. **The timer looked frozen on the lock screen and in the Dynamic Island.** Framebuffer captures showed the banner byte-identical across 24 seconds. Two causes: the simulator had dimmed into Always-On mode, where iOS hides timer seconds as `––` and refreshes once a minute (system behavior, not a bug), and the progress bar really was frozen because `ProgressView(value:)` is computed once at render and a widget never re-renders on its own. The bar became a `ProgressView(timerInterval:)` that iOS animates. This was the moment the rule "nothing computed at render time may change over time" (D7) was understood rather than assumed.
2. **The progress bar had no meaning.** The brief asks for a ring, but a count-up timer has no end, so the first version measured against a hard-coded 25 minutes that the user never saw. The design update made the goal part of every session (D9), with presets and a visible "x left" caption, so the bar and ring measure something the user chose.
3. **Past the goal, the widget kept saying "x left".** The remaining text used a relative date, which counts up again once its date is in the past, and the `staleDate` re-render that was supposed to switch the copy never arrived on time. Fix: a countdown timer before the goal, a count-up "x over goal" after it, chosen by comparing the clock with the goal end at render time, plus one app-sent update at the goal instant so the widget re-renders while the app is alive. A follow-up bug: re-adopting a session already past its goal requested an activity with a `staleDate` in the past, which iOS accepts and silently never shows.
4. **The session name was truncated when there was room for it.** Two separate causes. The compact island capped the name at the design spec's 72pt, so "ios app building" became "ios app b…" while the island had space; the cap was raised and iOS truncates on its own. On the lock screen, `Text(timerInterval:)` claims all the width it is offered, so the name lost the layout contest and sat next to empty space; the name now has `layoutPriority(1)` and the timer a minimum width.
5. **The coding agent kept getting stuck.** Several times it had to be asked "are you stuck?". It ran `npx expo run:ios` in the background and waited for it to finish, but that command never exits: it becomes the Metro server after installing the app. Twice it also piped the build log through a block-buffered filter, so the log looked empty mid-build. The fix was procedural: build with `xcodebuild`, which exits; run Metro separately and never wait on it; poll for concrete signals (a process, a file) with bounded loops; report status after every background step.

## 2026-09-12, timer core and bridge

- Timer core written test-first as a pure reducer that takes `now` as an argument. One review change: the agent clamped the whole elapsed value at zero on clock rollback, which would discard already-banked time; only the running delta is clamped now.
- The bridge contract was specified with a wrong example value for `timerStartMs`, and the agent implemented the formula that matched the wrong number. Caught in review; the formula is `runningSince - accumulatedMs`.
- `npx expo install --dev` put Jest in `dependencies`; moved by hand. TypeScript 6 no longer auto-includes `@types/*`; `types: ["jest"]` added to the tsconfig.
- First simulator run verified the timer screen. Swift Expo module and widget target added against a shared `StudyTimerAttributes.swift`; `@bacons/apple-targets` generated the widget target from `targets/`. Live Activity and Dynamic Island working end to end on the first build.
- The Expo module cannot be typechecked standalone: the precompiled Expo core framework was built with a different Swift version than Xcode 26's compiler. The widget files can; the module is verified only by the real build.
- Verified the brief's demo flow: start shows the island and the lock-screen banner, pause freezes both, stop removes the activity, a paused session survived reinstall and was re-adopted with the right elapsed time.
- Bug 1 above: the frozen lock-screen timer and progress bar.

## 2026-09-12, design update

- Received the design handoff. Cut up front: App Intent buttons in the island, the overflow menu, the custom goal wheel, Archivo inside the widget, animations, and percent text inside rings (D10).
- Reducer gained a per-session goal, a `completed` state and a `dismiss` action (bug 2 above). `goalMs` moved from the fixed attributes into the content state so it can change without restarting the activity.
- Two React Native gotchas fixed on first run: `fontWeight` next to a custom `fontFamily` silently falls back to the system font, and `SafeAreaView` on iOS replaces any padding with the safe-area insets.
- SwiftUI timer text and relative dates claim the full row width, so nothing right-aligns until the text alignment is set explicitly, and then the same fix has to be undone where content should be leading.
- Bug 5 above: the agent hanging on `expo run:ios`. Process changed from here on.
- Edge cases: the bridge now serializes every ActivityKit call through one promise chain (D8) with a unit test for the exact race; the native start leaves an identical surviving activity alone so relaunch after a kill does not blink it. Verified: force-kill while paused, relaunch, activity count stayed 1; three rapid start/stop cycles, count returned to 0 each time.
- Bug 3 above: "x left" past the goal, and the past `staleDate` follow-up.
- Bug 4 above, first half: the compact island name cap.
- Not verifiable in the simulator: the minimal island presentation (needs a second app's Live Activity; the simulator's Clock app does not launch) and Live Activities switched off at the OS level (Settings does not index the app).

## 2026-09-12, review fixes

- Bugs from the user's screenshots. The paused clock read `00:01:18` next to a running `1:18` because the paused branch used a hand-written formatter while the running branch was the system timer; both are now one `Text(timerInterval:pauseTime:)`, so the number keeps its shape across a pause. The lock-screen percent caption froze at "0%" because it was computed at render time (the same class as bug 1); it is shown only while paused now. Bug 4 above, second half: the lock-screen name.
- Verified after rebuild with a 1-minute goal: paused `0:11`, running `0:16` with the full name, expanded island `0:21` and `0:39 left`, then `0:21 over goal` with the bar full.

## 2026-09-12, goal notification and history

- Added a scheduled local notification at the goal instant (D11), since the widget's own copy can only switch when the app is alive, and a session history in AsyncStorage (D12). Verified: the permission prompt on first start, the banner at the goal instant with the app backgrounded, and the History screen after a stop.
- Clean-clone check: `npm ci`, tests (129), typecheck, `expo prebuild --clean`, `xcodebuild` all pass from a fresh checkout.
- Design note after a user question: a killed app does not end the session. iOS gives no kill callback, so it could not be done reliably anyway; the session, the activity and the notification all persist, and relaunch re-adopts them.
