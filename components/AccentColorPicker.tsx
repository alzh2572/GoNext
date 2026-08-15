import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { ACCENT_COLORS, type AccentId } from '../src/theme';

type AccentColorPickerProps = {
  value: AccentId;
  onChange: (id: AccentId) => void;
};

export function AccentColorPicker({ value, onChange }: AccentColorPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {ACCENT_COLORS.map((accent) => {
        const selected = accent.id === value;
        const circleColor = theme.dark ? accent.dark : accent.light;

        return (
          <Pressable
            key={accent.id}
            accessibilityRole="button"
            accessibilityLabel={`Основной цвет ${accent.id}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(accent.id)}
            style={[
              styles.swatch,
              {
                backgroundColor: circleColor,
                borderColor: selected ? theme.colors.onSurface : 'transparent',
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
  },
});
