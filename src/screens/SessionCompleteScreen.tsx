import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { GradientButton } from '../components';
import { colors, fonts, radii, shadows, type } from '../theme';
import { formatClockTime, formatHHMMSS } from '../timer/format';
import { TimerState } from '../timer/timerReducer';

type CompletedState = Extract<TimerState, { status: 'completed' }>;

export interface SessionCompleteScreenProps {
  state: CompletedState;
  onStartAnother(): void;
  onDone(): void;
}

export function SessionCompleteScreen({ state, onStartAnother, onDone }: SessionCompleteScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={[type.uppercaseLabel, styles.kicker]}>Session ended</Text>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={styles.sessionName} numberOfLines={2}>
            {state.name}
          </Text>
        </View>

        <View style={styles.divider} />

        <View>
          <Text style={[type.uppercaseLabel, styles.mutedLabel]}>Total time</Text>
          <Text style={styles.totalTime}>{formatHHMMSS(state.accumulatedMs)}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Started</Text>
            <Text style={styles.statValue}>{formatClockTime(state.startedAt)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Ended</Text>
            <Text style={styles.statValue}>{formatClockTime(state.endedAt)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Pauses</Text>
            <Text style={styles.statValue}>{String(state.pauseCount)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <GradientButton label="Start another session" onPress={onStartAnother} />
        <GradientButton label="Done" onPress={onDone} variant="ghost" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ground,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  kicker: {
    color: colors.inkMuted,
  },
  card: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: 30,
    paddingHorizontal: 24,
    gap: 18,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.running,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    color: colors.surface,
  },
  sessionName: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.ink,
  },
  divider: {
    height: 2,
    backgroundColor: colors.dividerCard,
  },
  mutedLabel: {
    color: colors.inkMuted,
  },
  totalTime: {
    fontFamily: fonts.extrabold,
    fontSize: 52,
    color: colors.ink,
    letterSpacing: -1.56,
    fontVariant: ['tabular-nums'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: 28,
  },
  stat: {
    gap: 4,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
});
