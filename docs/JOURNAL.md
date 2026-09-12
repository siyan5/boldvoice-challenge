# Journal

Chronological log of actions, bugs, and direction changes. Newest at the bottom.

## 2026-09-12

- Read the challenge spec. Found Xcode is not installed on this machine and only 9.7 GB of disk is free. Xcode plus an iOS simulator runtime needs roughly 25 GB. Plan reordered so all TypeScript work (scaffold, timer core, UI, bridge interface) happens before anything that needs Xcode.
- Created the repo with the spec copied to `docs/CHALLENGE.md`.
- Scaffolded with `create-expo-app --template blank-typescript`. Got Expo SDK 57, React Native 0.86, TypeScript 6. Dropped the Android and web config since the challenge is iOS only.
- Added `jest-expo` and `expo-dev-client`. `npx expo install --dev` did not honor the dev flag and put Jest into `dependencies`; moved it by hand.
