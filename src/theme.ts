// Design tokens from docs/design/HANDOFF.md.
import type { TextStyle } from 'react-native';

const TABULAR: TextStyle['fontVariant'] = ['tabular-nums'];

export const colors = {
  ground: '#eef0f4',
  surface: '#ffffff',
  surfaceAlt: '#f2f4f8',
  ink: '#12141a',
  inkMuted: '#5c6472',
  inkDisabled: '#c3c9d4',
  divider: '#d6dae2',
  dividerCard: '#e7eaf0',
  track: '#e2e6ee',
  border: '#dfe3ea',
  accentStart: '#f36b3c',
  accentEnd: '#ec2f7c',
  accentTint: '#f4835a',
  running: '#16a34a',
  runningText: '#15803d',
  paused: '#f59e0b',
  pausedText: '#b45309',
  pausedChipBg: '#fef3c7',
  pausedChipText: '#92400e',
  pausedDark: '#fcd34d',
  lockCardBg: 'rgba(28,31,44,0.82)',
  islandBg: '#000000',
} as const;

export const gradient = {
  colors: [colors.accentStart, colors.accentEnd] as const,
  horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
} as const;

export const fonts = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extrabold: 'Archivo_800ExtraBold',
} as const;

export const type = {
  sheetTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    letterSpacing: -0.24,
  },
  sessionName: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  timerRing: {
    fontFamily: fonts.extrabold,
    fontSize: 48,
    letterSpacing: -1.44,
    fontVariant: TABULAR,
  },
  buttonLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  secondary: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  uppercaseLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.84,
    textTransform: 'uppercase' as const,
  },
  statusLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.96,
    textTransform: 'uppercase' as const,
  },
} as const;

export const radii = {
  pill: 28,
  card: 24,
  cardSm: 20,
  field: 16,
  chip: 14,
  round: 999,
} as const;

export const shadows = {
  primaryButton: {
    shadowColor: 'rgba(236,47,124,0.28)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
  },
  card: {
    shadowColor: 'rgba(16,24,40,0.07)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 14,
  },
  chip: {
    shadowColor: 'rgba(16,24,40,0.06)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
} as const;

export const spacing = {
  screenH: 24,
  cardPad: 22,
  gap: 12,
  gapLg: 20,
} as const;
