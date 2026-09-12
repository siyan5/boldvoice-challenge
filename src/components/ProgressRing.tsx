import { ReactNode, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, gradient } from '../theme';

export type ProgressRingVariant = 'gradient' | 'paused';

// Handoff spec pins the default ring to size 286 / strokeWidth 16 / r 128
// (circumference 804, per docs/design/HANDOFF.md). The circle radius isn't
// simply (size - strokeWidth) / 2 in the design, so this inset preserves
// that exact geometry for the default case.
const RING_INSET = 7;

type Props = {
  size?: number;
  strokeWidth?: number;
  progress: number;
  variant?: ProgressRingVariant;
  trackColor?: string;
  fillColor?: string;
  children?: ReactNode;
};

export function ProgressRing({
  size = 286,
  strokeWidth = 16,
  progress,
  variant = 'gradient',
  trackColor = colors.track,
  fillColor,
  children,
}: Props) {
  const gradientId = `progress-ring-gradient-${useId()}`;
  const center = size / 2;
  const radius = size / 2 - strokeWidth / 2 - RING_INSET;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const dashoffset = circumference * (1 - clamped);
  const stroke = fillColor ?? (variant === 'gradient' ? `url(#${gradientId})` : colors.inkDisabled);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient
            id={gradientId}
            x1={gradient.diagonal.start.x}
            y1={gradient.diagonal.start.y}
            x2={gradient.diagonal.end.x}
            y2={gradient.diagonal.end.y}
          >
            <Stop offset="0" stopColor={colors.accentStart} />
            <Stop offset="1" stopColor={colors.accentEnd} />
          </LinearGradient>
        </Defs>
        <Circle cx={center} cy={center} r={radius} fill={colors.surface} stroke={trackColor} strokeWidth={strokeWidth} />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {children != null && <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
