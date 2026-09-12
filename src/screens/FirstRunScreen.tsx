import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { GradientButton, ProgressRing } from '../components';
import { colors, fonts, shadows } from '../theme';

export interface FirstRunScreenProps {
  onStart(): void;
  onHistory?(): void;
}

export function FirstRunScreen({ onStart, onHistory }: FirstRunScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Focus</Text>
        <Text style={styles.subtitle}>Track study time on your lock screen.</Text>
      </View>

      <View style={styles.centered}>
        <View style={styles.ringWrap}>
          <ProgressRing size={76} strokeWidth={6} progress={0.18} fillColor={colors.accentStart} trackColor={colors.border} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptyBody}>
            Name what you're studying and the timer will follow you to the lock screen.
          </Text>
        </View>
      </View>

      <GradientButton label="Start a session" onPress={onStart} style={styles.startButton} />
      {onHistory && (
        <Pressable onPress={onHistory} style={styles.historyLink}>
          <Text style={styles.historyLinkText}>View history</Text>
        </Pressable>
      )}
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
    paddingHorizontal: 24,
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 30,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.inkMuted,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrap: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  copy: {
    marginTop: 14,
    gap: 14,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  historyLink: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginBottom: 4,
  },
  historyLinkText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.inkMuted,
  },
  startButton: {
    marginBottom: 12,
  },
});
