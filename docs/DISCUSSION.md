# Discussion notes for the review

## Architecture decisions and why

- **Timestamps cross the bridge, not ticks.** The timer state is `{ runningSince, accumulatedMs, goalMs }`. The app talks to ActivityKit only on transitions and once at the goal instant; the widget renders time with `Text(timerInterval:)` and `ProgressView(timerInterval:)`, which iOS animates itself. This is what makes backgrounding and app death free, and the app and the widget cannot drift because they derive from the same numbers. (D2, D7)
- **A pure reducer is the source of truth, and the state machine is the router.** The reducer takes `now` as an argument, so every transition is unit-tested with hand-picked timestamps, including clock rollback. A second pure function decides which ActivityKit call a transition needs, so hydration, the toggle, and "start replaces a live session" are tested without a simulator. `App.tsx` picks the screen from `state.status`.
- **The bridge serializes every call.** One promise chain in the Expo module means rapid start/stop cannot interleave and leave an orphaned activity. Safe by construction, with a unit test pinning the exact race. (D8)
- **Local Expo module plus `@bacons/apple-targets`.** Swift lives in `modules/` and `targets/`; a clean prebuild regenerates the whole Xcode project including the widget extension. Nothing in `ios/` is hand-edited or committed. (D1, D3)

## What was hardest

- **The timer looked frozen, and only half of it was a bug.** The lock-screen banner did not change across 24 seconds of captures. Part was Always-On mode hiding seconds, which is system behavior. Part was real: the progress bar was computed once at render, and a widget never re-renders on its own. The rule that came out of it: nothing computed at render time may change over time. Everything time-based in the widget is now a system-driven view, and the one thing that must switch at a moment, "x left" to "x over goal", gets a single app-sent update at the goal instant with `staleDate` as the fallback.
- **A count-up timer has no end, so the ring meant nothing.** The brief asks for a progress ring. The first version measured against a hidden 25-minute constant. Making the goal part of every session, with presets and an "x left" caption, turned the ring from decoration into information. (D9)
- **SwiftUI's timer text owns both its width and its format.** It claims all the width it is offered, so the session name lost the layout contest and truncated next to empty space until it got layout priority. And it renders `7:03`, never `00:07:03`, so the paused clock had to become the same view with `pauseTime` rather than a hand-formatted string. (D7)

## What the AI got wrong and had to be fixed

- **It waited on commands that never exit.** `npx expo run:ios` becomes the Metro server after installing the app, so the agent sat waiting for a completion signal that could never come, and twice piped the build log through a buffered filter that made it look empty. Fixed by process, not code: build with `xcodebuild`, which exits; run Metro separately; poll for concrete signals with bounded loops; report after every background step.
- **It followed the literal example over the stated intent, twice.** Given a wrong example value for `timerStartMs` alongside the correct formula, it implemented the formula that matched the number. Given a 72pt name width in the design spec, it applied the cap inside the island, which already limits width, and truncated normal names.
- **It computed time-varying values at render time, three times.** The static progress bar, a relative date that counted up again past the goal, and a percent caption frozen at "0%". Same mistake, same fix each time; it took three rounds before it became a rule.
- **It clamped the whole elapsed value on clock rollback**, discarding time already banked. A logic bug caught in review; only the running delta is clamped now.

## What to improve next

- App Intents for Pause, Resume and Stop in the island, with native-to-JS reconciliation.
- Rename and change-goal from the overflow menu; the content state already carries `goalMs`.
- Push-driven updates so the goal-reached switch does not depend on the app being alive.
- A test target for the Swift module; today it is verified only by the real build.
