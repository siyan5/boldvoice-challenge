import { LinearGradient } from 'expo-linear-gradient';
import { Linking, Pressable, SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native';
import { GradientButton, Pill, ProgressRing } from '../components';
import { colors, fonts, gradient, radii, spacing, type } from '../theme';
import { formatClockTime, formatGoal, formatHHMMSS, formatRemaining } from '../timer/format';
import { TimerState } from '../timer/timerReducer';

type ActiveState = Extract<TimerState, { status: 'running' | 'paused' }>;

export interface TimerScreenProps {
  state: ActiveState;
  elapsedMs: number;
  remainingMs: number;
  liveActivityEnabled: boolean;
  liveActivitySupported: boolean;
  onPause(): void;
  onResume(): void;
  onStop(): void;
  onNewSession(): void;
  onToggleLiveActivity(enabled: boolean): void;
}

export function TimerScreen({
  state,
  elapsedMs,
  remainingMs,
  liveActivityEnabled,
  liveActivitySupported,
  onPause,
  onResume,
  onStop,
  onNewSession,
  onToggleLiveActivity,
}: TimerScreenProps) {
  const isRunning = state.status === 'running';

  let statusText: string;
  let statusTextColor: string;
  let dotColor: string;
  if (state.status === 'running') {
    statusText = `RUNNING · STARTED ${formatClockTime(state.startedAt)}`;
    statusTextColor = colors.runningText;
    dotColor = colors.running;
  } else {
    statusText = `PAUSED · ${formatClockTime(state.pausedAt)}`;
    statusTextColor = colors.pausedText;
    dotColor = colors.paused;
  }

  const progress = elapsedMs / state.goalMs;

  let caption;
  if (state.status === 'running') {
    const remaining = formatRemaining(remainingMs);
    const text = remaining === 'Goal reached' ? remaining : `${remaining} of ${formatGoal(state.goalMs)}`;
    caption = <Text style={styles.caption}>{text}</Text>;
  } else {
    caption = <Pill label="PAUSED" bg={colors.pausedChipBg} color={colors.pausedChipText} />;
  }

  let liveTitle: string;
  let liveSubtitle: string;
  let liveIcon;
  if (!liveActivitySupported) {
    liveTitle = 'Live Activities are off';
    liveSubtitle = 'Enable them in Settings';
    liveIcon = <View style={[styles.liveIcon, styles.liveIconNeutral]} />;
  } else if (!liveActivityEnabled) {
    liveTitle = 'Live Activity is off';
    liveSubtitle = 'Timer keeps running in the app';
    liveIcon = <View style={[styles.liveIcon, styles.liveIconNeutral]} />;
  } else if (isRunning) {
    liveTitle = 'Live Activity is on';
    liveSubtitle = 'Showing on the lock screen';
    liveIcon = (
      <LinearGradient
        colors={['#4f46e5', '#7c3aed']}
        start={gradient.diagonal.start}
        end={gradient.diagonal.end}
        style={styles.liveIcon}
      />
    );
  } else {
    liveTitle = 'Live Activity paused';
    liveSubtitle = 'Still visible, time frozen';
    liveIcon = <View style={[styles.liveIcon, styles.liveIconNeutral]} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sessionName} numberOfLines={1}>
          {state.name}
        </Text>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={[styles.statusLabel, { color: statusTextColor }]}>{statusText}</Text>
      </View>

      <View style={styles.ringWrap}>
        <ProgressRing progress={progress} variant={isRunning ? 'gradient' : 'paused'}>
          <Text style={[styles.timer, { color: isRunning ? colors.ink : colors.inkMuted }]}>
            {formatHHMMSS(elapsedMs)}
          </Text>
          <View style={styles.captionWrap}>{caption}</View>
        </ProgressRing>
      </View>

      <View style={styles.controls}>
        <GradientButton
          label={isRunning ? 'Pause' : 'Resume'}
          variant={isRunning ? 'dark' : 'gradient'}
          onPress={isRunning ? onPause : onResume}
          style={styles.controlButton}
        />
        <GradientButton label="Stop" variant="outline" onPress={onStop} style={styles.controlButton} />
      </View>

      <View style={styles.divider} />
      <Pressable style={styles.newSessionRow} onPress={onNewSession}>
        <Text style={styles.newSessionLabel}>Start new session</Text>
        <Text style={styles.newSessionPlus}>+</Text>
      </Pressable>
      <View style={[styles.divider, styles.dividerBottom]} />

      <View style={styles.liveCard}>
        {liveIcon}
        <View style={styles.liveTextWrap}>
          <Text style={styles.liveTitle}>{liveTitle}</Text>
          {liveActivitySupported ? (
            <Text style={styles.liveSubtitle}>{liveSubtitle}</Text>
          ) : (
            <Pressable onPress={() => Linking.openSettings()}>
              <Text style={styles.liveSubtitle}>{liveSubtitle}</Text>
            </Pressable>
          )}
        </View>
        {liveActivitySupported && (
          <Switch
            trackColor={{ true: colors.running, false: colors.inkDisabled }}
            value={liveActivityEnabled}
            onValueChange={onToggleLiveActivity}
          />
        )}
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  container: {
    flex: 1,
    backgroundColor: colors.ground,
    paddingHorizontal: spacing.screenH,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionName: {
    ...type.sessionName,
    color: colors.ink,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    ...type.statusLabel,
  },
  ringWrap: {
    flex: 1,
    minHeight: 286,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    ...type.timerRing,
    fontVariant: ['tabular-nums'],
  },
  captionWrap: {
    marginTop: 8,
  },
  caption: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  controlButton: {
    flex: 1,
    height: 58,
  },
  divider: {
    height: 2,
    backgroundColor: colors.divider,
  },
  dividerBottom: {
    marginBottom: 16,
  },
  newSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  newSessionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
  },
  newSessionPlus: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.accentEnd,
  },
  liveCard: {
    marginTop: 'auto',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.cardSm,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  liveIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  liveIconNeutral: {
    backgroundColor: '#e7eaf0',
  },
  liveTextWrap: {
    flex: 1,
  },
  liveTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  liveSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.inkMuted,
  },
});
