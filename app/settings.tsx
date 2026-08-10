import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppScreen } from '../components/AppScreen';

export default function SettingsScreen() {
  return (
    <AppScreen title="Настройки">
      <View style={styles.content}>
        <Text variant="bodyLarge" style={styles.text}>
          Настройки (заглушка для MVP).
        </Text>
        <Text variant="bodySmall" style={styles.note}>
          Версия 1.0.0
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  text: {
    opacity: 0.8,
  },
  note: {
    marginTop: 'auto',
    opacity: 0.6,
  },
});
