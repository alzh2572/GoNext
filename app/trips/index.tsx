import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppScreen } from '../../components/AppScreen';

export default function TripsListScreen() {
  return (
    <AppScreen title="Поездки">
      <View style={styles.content}>
        <Text variant="bodyLarge" style={styles.text}>
          Список поездок (заглушка). Реализация — на следующих этапах.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  text: {
    opacity: 0.8,
  },
});
