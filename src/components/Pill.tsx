import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { fonts, radii } from '../theme';

type Props = {
  label: string;
  bg: string;
  color: string;
  style?: StyleProp<ViewStyle>;
};

export function Pill({ label, bg, color, style }: Props) {
  return (
    <View style={[styles.base, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.round,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
