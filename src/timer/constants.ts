// Progress ring / bar goal. See docs/DECISIONS.md D4.
export const DEFAULT_GOAL_MS = 2 * 60 * 60 * 1000;
export const GOAL_PRESETS_MS = [25 * 60_000, 50 * 60_000, 60 * 60_000, 120 * 60_000] as const; // 25m, 50m, 1h, 2h
export const MAX_RECENT_NAMES = 5;
export const MAX_NAME_LENGTH = 60;
export const DEFAULT_SESSION_NAME = 'Study Session';
