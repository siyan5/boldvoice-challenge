# Journal

Chronological log of actions, bugs, and direction changes. Newest at the bottom.

## 2026-09-12

- Read the challenge spec. Found Xcode is not installed on this machine and only 9.7 GB of disk is free. Xcode plus an iOS simulator runtime needs roughly 25 GB. Plan reordered so all TypeScript work (scaffold, timer core, UI, bridge interface) happens before anything that needs Xcode.
- Created the repo with the spec copied to `docs/CHALLENGE.md`.
- Scaffolded with `create-expo-app --template blank-typescript`. Got Expo SDK 57, React Native 0.86, TypeScript 6. Dropped the Android and web config since the challenge is iOS only.
- Added `jest-expo` and `expo-dev-client`. `npx expo install --dev` did not honor the dev flag and put Jest into `dependencies`; moved it by hand.
- Step 2, timer core. A feature-builder subagent wrote `src/timer/` test-first (reducer with start/pause/resume/stop, `elapsedMs`, `formatHHMMSS`). Reviewed in the main thread and changed one thing: the agent clamped the whole elapsed value at zero on clock rollback, which would discard already-accumulated time. Changed to clamp only the running delta, in both `elapsedMs` and the `pause` transition, and adjusted the tests.
- Bug: `npm run typecheck` could not see Jest globals even with `@types/jest` installed. Cause: TypeScript 6 no longer auto-includes `@types/*`; fixed by adding `"types": ["jest"]` to `tsconfig.json`. Also pinned `@types/jest` to 29 to match Jest 29.
