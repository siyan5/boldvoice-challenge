import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GradientButton } from '../components';
import { colors, fonts, radii, shadows, type } from '../theme';
import { DEFAULT_GOAL_MS, DEV_GOAL_PRESET_MS, GOAL_PRESETS_MS, MAX_NAME_LENGTH } from '../timer/constants';

const PRESETS: readonly number[] = __DEV__ ? [DEV_GOAL_PRESET_MS, ...GOAL_PRESETS_MS] : GOAL_PRESETS_MS;
import { formatGoal } from '../timer/format';

export interface NewSessionSheetProps {
  visible: boolean;
  recentNames: string[];
  onStart(name: string, goalMs: number): void;
  onClose(): void;
}

export function NewSessionSheet({ visible, recentNames, onStart, onClose }: NewSessionSheetProps) {
  const [name, setName] = useState('');
  const [goalMs, setGoalMs] = useState<number>(DEFAULT_GOAL_MS);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!visible) {
      setName('');
      setGoalMs(DEFAULT_GOAL_MS);
    }
  }, [visible]);

  const trimmedName = name.trim();

  const handleStart = () => {
    onStart(trimmedName, goalMs);
    setName('');
    setGoalMs(DEFAULT_GOAL_MS);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        style={styles.avoider}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={type.sheetTitle}>New session</Text>

          <View style={styles.section}>
            <Text style={[type.uppercaseLabel, styles.mutedLabel]}>Session name</Text>
            <TextInput
              style={[styles.input, focused && styles.inputFocused]}
              value={name}
              onChangeText={setName}
              placeholder="What are you studying?"
              placeholderTextColor={colors.inkMuted}
              maxLength={MAX_NAME_LENGTH}
              returnKeyType="done"
              autoFocus={visible}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>

          {recentNames.length > 0 && (
            <View style={styles.chipsRow}>
              {recentNames.map((recent) => (
                <Pressable key={recent} style={styles.chip} onPress={() => setName(recent)}>
                  <Text style={styles.chipLabel}>{recent}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.goalHeaderRow}>
              <Text style={[type.uppercaseLabel, styles.mutedLabel]}>Goal</Text>
              <Text style={styles.fillsRing}>Fills the ring</Text>
            </View>
            <View style={styles.goalRow}>
              {PRESETS.map((preset) => {
                const selected = preset === goalMs;
                return (
                  <Pressable
                    key={preset}
                    style={[styles.goalTile, selected ? styles.goalTileSelected : styles.goalTileUnselected]}
                    onPress={() => setGoalMs(preset)}
                  >
                    <Text style={[styles.goalTileLabel, selected && styles.goalTileLabelSelected]}>
                      {formatGoal(preset)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <GradientButton label="Start timer" onPress={handleStart} disabled={trimmedName.length === 0} />

          <Text style={styles.footnote}>A Live Activity will appear on your lock screen.</Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(16,24,40,0.28)',
  },
  avoider: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.ground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 34,
    gap: 18,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#cfd4dd',
    alignSelf: 'center',
  },
  section: {
    gap: 10,
  },
  mutedLabel: {
    color: colors.inkMuted,
  },
  input: {
    height: 56,
    borderRadius: radii.field,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.ink,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.chip,
  },
  inputFocused: {
    borderColor: colors.accentStart,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radii.round,
    paddingVertical: 8,
    paddingHorizontal: 14,
    ...shadows.chip,
  },
  chipLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.ink,
  },
  divider: {
    height: 2,
    backgroundColor: colors.divider,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fillsRing: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  goalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  goalTile: {
    flex: 1,
    height: 52,
    borderRadius: radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTileUnselected: {
    backgroundColor: colors.surface,
    ...shadows.chip,
  },
  goalTileSelected: {
    backgroundColor: colors.ink,
  },
  goalTileLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  goalTileLabelSelected: {
    color: colors.surface,
  },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
