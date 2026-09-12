# Handoff: Study Timer with iOS Live Activity

## Overview

A React Native / Expo iOS study timer. The user names a session, picks a goal duration, and starts a timer that counts up. While it runs, an ActivityKit Live Activity mirrors the state on the lock screen and in the Dynamic Island, and can be paused or stopped from the expanded island without opening the app.

This handoff covers the UI design only. The native bridge architecture is up to the implementer; this document specifies exactly what each surface must display in each state.

## About the Design Files

`Study Timer.dc.html` in this bundle is a **design reference created in HTML** — a static prototype showing intended look, layout, and state coverage. It is not production code and should not be ported directly.

The target is React Native / Expo (TypeScript) for the app and SwiftUI / WidgetKit for the Live Activity. Recreate the designs in those environments using their idioms: React Native `View`/`Text`/`Pressable` with a `StyleSheet`, SwiftUI `VStack`/`HStack`/`Gauge` inside an `ActivityConfiguration`. Match the visual spec below precisely; do not attempt to reuse the HTML's DOM structure.

## Fidelity

**High-fidelity.** Colors, type, spacing, and radii below are final. Recreate pixel-for-pixel. Layout is specified at iPhone 390 × 844 pt (logical points; the HTML uses px 1:1).

The prototype file contains two turns of exploration. **Turn 2 (`#t2`, the top section, options 2a–2d) is the approved design.** Turn 1 (`#t1`) is superseded and kept only as a record — ignore it.

---

## Design Tokens

### Color

| Token | Hex | Use |
| --- | --- | --- |
| `ground` | `#eef0f4` | App screen background |
| `surface` | `#ffffff` | Cards, fields, chips |
| `surfaceAlt` | `#f2f4f8` | Selected row inside a white card (custom-goal picker) |
| `ink` | `#12141a` | Primary text, dark buttons, phone bezel |
| `inkMuted` | `#5c6472` | Secondary text, labels (4.5:1 on both ground and surface) |
| `inkDisabled` | `#c3c9d4` | Inactive picker values, paused ring arc |
| `divider` | `#d6dae2` | 2px section rules on ground |
| `dividerCard` | `#e7eaf0` | 2px rules inside white cards |
| `track` | `#e2e6ee` | Ring track (app) |
| `border` | `#dfe3ea` | 2px outline on secondary buttons |
| `accentStart` | `#f36b3c` | Gradient start (orange) |
| `accentEnd` | `#ec2f7c` | Gradient end (pink) |
| `accentTint` | `#f4835a` | Accent text on black (Dynamic Island) |
| `running` | `#16a34a` | Running status dot, Live Activity toggle |
| `runningText` | `#15803d` | "RUNNING" label text |
| `paused` | `#f59e0b` | Paused status dot |
| `pausedText` | `#b45309` | "PAUSED" label on ground |
| `pausedChipBg` / `pausedChipText` | `#fef3c7` / `#92400e` | PAUSED pill inside the ring |
| `pausedDark` | `#fcd34d` | PAUSED on black / dark surfaces |
| `lockCardBg` | `rgba(28,31,44,0.82)` | Live Activity card, over blur |
| `islandBg` | `#000000` | Dynamic Island |

**Primary gradient:** `linear-gradient(90deg, #f36b3c, #ec2f7c)` for buttons and bars; `135deg` for small square badges; diagonal (`0,0 → 1,1`) for ring strokes.

**Primary button shadow:** `0 6px 18px rgba(236,47,124,0.28)`.
**Card shadow:** `0 2px 14px rgba(16,24,40,0.07)`. Small chips/fields: `0 1px 6px rgba(16,24,40,0.06)`.

### Typography

Family: **Archivo** (weights 400/500/600/700/800). All numerals use `font-variant-numeric: tabular-nums` — in React Native use `fontVariant: ['tabular-nums']`.

| Role | Size / weight / leading | Tracking |
| --- | --- | --- |
| Sheet title | 24 / 800 / 1.2 | −0.01em |
| Session name (timer header) | 20 / 700 / 1.2 | — |
| Timer, app ring | 48 / 800 / 1.0 | −0.03em |
| Timer, island expanded | 40 / 800 / 1.0 | −0.03em |
| Timer, Live Activity row | 22 / 700 | −0.02em |
| Custom goal numerals | 64 / 800 / 1.0 | −0.03em |
| Button label | 16 / 700 | — |
| Body / row label | 14–15 / 500–600 | — |
| Secondary / meta | 12.5–13 / 400–600 | — |
| Uppercase label | 12 / 600 | 0.07em |
| Status label (uppercase) | 12 / 600 | 0.08em |
| Island region label | 11 / 600 | 0.08em |

### Spacing & radii

Screen horizontal padding 24. Card padding 22–28. Stack gap 12–20.

Radii: pill buttons `28` (h56) / `29` (h58); cards `24`; secondary cards `20–22`; fields `16`; goal chips `14`; island expanded `34`; island compact pill `20`; chips/tags `999`.

Hit targets: all buttons ≥ 52pt tall.

---

## Screens

### 1. New session (`#2a`, left frame)

Bottom sheet over a dimmed (`rgba(16,24,40,0.28)`) backdrop. Sheet corner radius 28 top. Padding 24 horizontal, 14 top. Content gap 18.

Order, top to bottom:

1. Grabber — 44 × 5, radius 3, `#cfd4dd`, centered.
2. Title "New session" — 24/800.
3. **Session name** — uppercase label `SESSION NAME` (12/600, 0.07em, `inkMuted`); text field h56, radius 16, white, shadow, padding 0 18, **2px `#f36b3c` border when focused**; value 17/600 `ink`. Placeholder when empty: "What are you studying?".
4. **Recent** chips — horizontal wrap, gap 8, each: white pill radius 999, padding 8×14, 13.5/600 `ink`, small shadow. Content shown: `Organic Chem`, `Reading`, `Problem set`. Tapping fills the name field. Populated from the last 5 distinct session names.
5. 2px `divider` rule.
6. **Goal** — label row: `GOAL` (uppercase label) left, "Fills the ring" (13/600 `inkMuted`) right. Below: 5 equal-flex tiles, gap 8, h52, radius 14 — `25m`, `50m`, `1h`, `2h`, `⋯`. Unselected: white + small shadow, 15/700 `ink`. **Selected: `ink` fill, white label. `2h` is the default selection.** The `⋯` tile is white with a 2px dashed `#c3c9d4` border and `inkMuted` label; it opens the custom picker. A goal is always required — there is no "no goal" path.
7. Primary button "Start timer" — h56, radius 28, primary gradient, shadow, white 16/700, centered label.
8. Footnote "A Live Activity will appear on your lock screen." — 12.5/400 `inkMuted`, centered.

### 2. Custom goal (`#2a`, right frame)

Same sheet. Title row: "Custom goal" left, "Cancel" (15/600 `inkMuted`) right.

White card, radius 24, padding 22, gap 18:
- Readout: `2` (64/800) + `h` (20/700 `inkMuted`, baseline-offset down 8) + `30` (64/800, 12 left margin) + `m`. Centered.
- 2px `dividerCard` rule.
- Two equal wheel columns, gap 24, each headed `HOURS` / `MINUTES` (11/600, 0.08em, `inkMuted`, centered). Each shows prev / selected / next: neighbours 18/500 `inkDisabled`; selected 26/700 `ink` on `surfaceAlt` radius 12, padding 4×18–22. Implement as a native picker wheel.

Primary button "Set goal".

### 3. Timer — running (`#2b`, left frame)

Screen padding 24, content top 24.

- **Header row**: session name 20/700 left; overflow button right — 34 circle, white, small shadow, `⋯` 15/700 `inkMuted` (opens rename / change goal).
- **Status row**, 8 gap, 8 margin-top: 8px dot `running`; text `RUNNING · STARTED 8:18 AM` uppercase 12/600 0.08em `runningText`.
- **Ring**, flex-centered in remaining space, 286 × 286:
  - Track: circle r=128, fill `#ffffff`, stroke `track` width 16.
  - Progress: same circle, stroke = accent gradient, width 16, round cap, rotated −90°, `strokeDasharray 804`, offset = `804 × (1 − progress)`. At 62%, offset 306.
  - Center stack: elapsed `01:23:45` at 48/800 `ink`; below (gap 8) "36 min left of 2h" 13/600 `inkMuted`.
  - Progress = `elapsed / goal`, clamped to 1.
- **Controls**, gap 12, h58, radius 29: "Pause" — `ink` fill, white label. "Stop" — white fill, 2px `border`, `ink` label. Equal flex.
- 2px `divider`; row "Start new session" (15/600) with a `+` (18/700 `accentEnd`) right, padding 16 vertical; 2px `divider`.
- Spacer, then **Live Activity status card** pinned bottom: white, radius 20, padding 14×18, gap 14 — 36 circle with `135deg` violet gradient (`#4f46e5 → #7c3aed`); "Live Activity is on" 14/600 + "Showing on the lock screen" 12.5/400 `inkMuted`; toggle 46×28 radius 14, `running` fill, 22 white knob right. Toggling off ends the Live Activity but not the timer.

### 4. Timer — paused (`#2b`, right frame)

Identical layout, with:
- Status dot `paused`, text `PAUSED · 9:41 AM` in `pausedText`.
- Ring progress stroke becomes flat `inkDisabled` (no gradient); arc holds at its value.
- Elapsed time in `inkMuted`; the "36 min left" line is replaced by a `PAUSED` pill — 11/700, 0.14em, `pausedChipText` on `pausedChipBg`, radius 999, padding 6×12.
- Left button becomes "Resume" with the primary gradient + shadow; "Stop" unchanged.
- Status card: grey `#e7eaf0` circle, "Live Activity paused" / "Still visible, time frozen".

### 5. Live Activity — lock screen (`#2c`)

Card inset 16 from screen edges, 20 from the bottom. Radius 22, padding 16×18, gap 12. Background `rgba(28,31,44,0.82)` over a material blur, 1px `rgba(255,255,255,0.08)` border.

- **Row 1**: 30 × 30 app badge, radius 9, `135deg` accent gradient, white `F` 14/700 — replace with the real app icon. Session name 15/600 white, single line, truncating. Elapsed `01:23:45` 22/700 white, tabular, right.
- **Row 2**: bar h5 radius 3, track `rgba(255,255,255,0.16)`, fill accent gradient at the goal percentage.
- **Row 3**: "62% of 2h goal" left, "36 min left" right — both 12/500 `rgba(255,255,255,0.65)`.

Paused variant: badge goes `rgba(255,255,255,0.14)`; name and time drop to 80% white; a `PAUSED` label (11/700, 0.14em, `pausedDark`) sits between name and time; bar fill becomes flat `rgba(255,255,255,0.5)`; right meta reads "Paused 9:41 AM".

The lock screen keeps the **linear bar**, not a ring — a ring is unreadable at this scale.

### 6. Dynamic Island (`#2d`)

Three presentations, each with a running and a paused state.

**Compact** — default whenever another app is frontmost.
- Leading: session name, truncated (`Chapter 5…`), 13/700, `accentTint`.
- Trailing: elapsed time, 13/700 white, tabular. Drop the hours field below 1h (`23:45`).
- No progress indicator — the pill is too narrow.
- Paused: name goes `pausedDark`, time drops to `rgba(255,255,255,0.7)` and stops advancing.

**Minimal** — shown when a second Live Activity shares the island; ours collapses to a circle.
- Content is the ring alone, ~21pt: track `rgba(255,255,255,0.2)` width 3.5, progress arc in the accent gradient, round cap, rotated −90°.
- No text.
- Paused: arc holds and turns flat `pausedDark`.

**Expanded** — long-press. Width 314, radius 34, padding 18/20/20, gap 14, black.
- **Leading region**: 62pt progress ring — track `rgba(255,255,255,0.18)` width 7, gradient arc, round cap, `strokeDasharray 170`, offset `170 × (1 − progress)`; percentage centered inside at 14/700 white.
- **Center**: `STUDYING` 11/600 0.08em `accentTint`; session name 17/700 white; "2h goal · 36 min left" 12.5/500 `rgba(255,255,255,0.6)`.
- Below: elapsed `01:23:45` 40/800 white, tabular.
- **Bottom region**: two equal buttons, h38 radius 19, gap 10 — "Pause" and "Stop", `rgba(255,255,255,0.16)`, white 14/700. Wire both as App Intents so the session is controlled without launching the app.
- Paused: ring arc and percentage go `pausedDark` / 80% white; the kicker becomes `PAUSED` (11/700, 0.12em, `pausedDark`); name and time drop to 82% white; the left button becomes "Resume" with the primary gradient.

### 7. Session complete (`#1a`, last frame — carried forward from turn 1)

Screen padding 24. Kicker `SESSION ENDED` uppercase label. White card, radius 24, padding 30×24, gap 18:
- Row: 44 green (`#16a34a`) circle with a white ✓ 20/800; session name 19/700.
- 2px `dividerCard`.
- `TOTAL TIME` label; `01:47:12` at 52/800 −0.03em.
- Three stats, gap 28 — Started / Ended / Pauses, each label 12/500 `inkMuted` over value 15/700 `ink`.

Below, gap 12: primary "Start another session" (h56 gradient) and a ghost "Done" (h56, transparent, 16/700 `inkMuted`).

### 8. First run (`#1a`, first frame — carried forward from turn 1)

Title "Focus" 30/800, subtitle "Track study time on your lock screen." 15/400 `inkMuted`. Centered block: 132 white circle with a 76 inner ring (6px `#dfe3ea` track, `accentStart` top segment); "No sessions yet" 18/700 and a 14/400 `inkMuted` line. Primary "Start a session" pinned above the home indicator.

---

## Interactions & Behavior

**Flow.** First run → tap "Start a session" → new-session sheet → (optional custom goal) → "Start timer" → running → Pause/Resume → Stop → session complete → "Start another session" returns to the sheet, "Done" returns to the timer screen in its empty state.

**Validation.** "Start timer" is disabled (45% opacity) until the name field is non-empty. A goal is always set — 2h by default — so it can never block submission. Trim whitespace; cap the name at 60 characters.

**Transitions.** Sheet presents from the bottom, ~300ms ease-out, backdrop fading to 0.28 alpha. Ring arc animates its `strokeDashoffset` over 400ms ease-out on goal change, and steps once per second while running (no per-frame animation). Pause/Resume cross-fades the arc color over 200ms. Button press: scale 0.97 + 150ms opacity, or the platform's default pressed state.

**Live Activity lifecycle.**
- Start timer → request the activity immediately; if the user has Live Activities disabled, the app timer still runs and the status card shows an off state with a link to Settings.
- Update the activity on every state transition (pause, resume, goal change) and let the widget drive its own seconds display from `ActivityAttributes` start/pause timestamps rather than pushing an update per second.
- Stop → end the activity with an immediate dismissal policy.
- App backgrounded → the widget keeps counting from its timestamps; no updates needed.
- App killed → the activity persists with its last state; on next launch, reconcile: if a stored session is still running, resume it; if it was stopped, end any orphaned activity.
- Rapid start/stop → keep a single activity token; before requesting a new one, end any existing activity and await the result so no zombies remain.

## State Management

```ts
type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';

type Session = {
  id: string;
  name: string;
  goalSeconds: number;      // default 7200
  startedAt: number;        // epoch ms
  accumulatedMs: number;    // time banked before the current run segment
  resumedAt: number | null; // epoch ms of the current run segment
  pauseCount: number;
  endedAt: number | null;
  status: SessionStatus;
};
```

Derive elapsed as `accumulatedMs + (resumedAt ? now - resumedAt : 0)` — never increment a counter, so backgrounding cannot drift. Progress is `elapsed / (goalSeconds * 1000)`, clamped to 1. Persist the active session and the recent-names list to storage on every transition so a cold launch can reconcile.

Transitions: `idle → running` (start), `running ⇄ paused` (pause/resume, incrementing `pauseCount` on pause), `running|paused → completed` (stop, setting `endedAt` and ending the activity).

No network or data fetching.

## Assets

The app badge in the Live Activity and the violet circle in the status card are placeholders — substitute the real app icon and a lucide `bell`/`activity` glyph. Icons throughout should come from lucide (`more-horizontal`, `plus`, `check`, `pause`, `square`). Archivo is available on Google Fonts; bundle the variable font rather than loading it at runtime.

## Files

- `Study Timer.dc.html` — the design reference. Open in a browser. **Turn 2 at the top (2a–2d) is the approved design**; turn 1 below it is superseded and kept only as history. Section anchors: `#2a` new session + custom goal, `#2b` running + paused, `#2c` lock screen Live Activity, `#2d` Dynamic Island spec.
- `live-activities-challenge.md` — the original brief this design answers.
- `screenshots/` — rendered captures at 2x:
  - `2a-new-session.png` — new session sheet + custom goal picker
  - `2b-timer-ring.png` — running and paused timer
  - `2c-live-activity.png` — lock screen Live Activity, running and paused
  - `2d-dynamic-island.png` — compact / minimal / expanded spec board
  - `1a-first-run-and-complete.png` — turn 1 board; use only the **first frame (first run)** and the **last frame (session complete)**, which carry forward. The three middle frames are superseded by 2a/2b.
