import { useState } from 'react';
import { DEFAULT_GOAL_MS } from '../timer/constants';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TimerController } from '../timer/useTimer';
import { formatHHMMSS } from '../timer/format';

const ACCENT = '#4A6CF7';

export function TimerScreen({ state, elapsedMs, start, pause, resume, stop }: TimerController) {
  const [name, setName] = useState('');

  if (state.status === 'idle') {
    const submit = () => {
      start(name, DEFAULT_GOAL_MS);
      setName('');
    };
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Study Timer</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Session name"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Pressable style={styles.primaryButton} onPress={submit}>
            <Text style={styles.primaryButtonText}>Start</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isPaused = state.status === 'paused';
  const progress = Math.min(1, elapsedMs / state.goalMs);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <Text style={styles.sessionName}>{state.name}</Text>
        <Text style={styles.time}>{formatHHMMSS(elapsedMs)}</Text>
        {isPaused && <Text style={styles.pausedLabel}>Paused</Text>}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.row}>
          <Pressable style={styles.secondaryButton} onPress={isPaused ? resume : pause}>
            <Text style={styles.secondaryButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={stop}>
            <Text style={styles.secondaryButtonText}>Stop</Text>
          </Pressable>
        </View>
        <View style={styles.divider} />
        <Pressable onPress={stop}>
          <Text style={styles.linkText}>Start New Session</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D0D4E4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: ACCENT,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  time: {
    fontSize: 48,
    fontVariant: ['tabular-nums'],
    color: '#1A1A2E',
  },
  pausedLabel: {
    fontSize: 14,
    color: '#8A8FA3',
    marginTop: 4,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E3EF',
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ACCENT,
  },
  row: {
    flexDirection: 'row',
    marginTop: 28,
    gap: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: ACCENT,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: ACCENT,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    width: 160,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D0D4E4',
    marginTop: 28,
    marginBottom: 16,
  },
  linkText: {
    color: '#8A8FA3',
    fontSize: 14,
  },
});
