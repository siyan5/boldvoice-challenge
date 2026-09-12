import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, gradient, radii, shadows, type } from '../theme';

export type GradientButtonVariant = 'gradient' | 'dark' | 'outline' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: GradientButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function GradientButton({ label, onPress, variant = 'gradient', disabled, style }: Props) {
  const labelStyle = [
    styles.label,
    variant === 'gradient' || variant === 'dark' ? styles.labelLight : null,
    variant === 'outline' ? styles.labelInk : null,
    variant === 'ghost' ? styles.labelMuted : null,
  ];

  const content = <Text style={labelStyle}>{label}</Text>;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'dark' && styles.dark,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        variant === 'gradient' && shadows.primaryButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {variant === 'gradient' ? (
        <LinearGradient
          colors={gradient.colors}
          start={gradient.horizontal.start}
          end={gradient.horizontal.end}
          style={styles.fill}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radii.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dark: {
    backgroundColor: colors.ink,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...type.buttonLabel,
  },
  labelLight: {
    color: colors.surface,
  },
  labelInk: {
    color: colors.ink,
  },
  labelMuted: {
    color: colors.inkMuted,
  },
});
