import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native-paper';
import { AppScreen } from '../../components/AppScreen';

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <AppScreen title="Поездка">
      <View style={styles.content}>
        <Text variant="bodyLarge">Детали поездки / маршрут (заглушка).</Text>
        <Text variant="bodyMedium" style={styles.meta}>
          id: {id}
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  meta: {
    opacity: 0.7,
  },
});
