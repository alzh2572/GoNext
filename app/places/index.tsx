import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppScreen } from '../../components/AppScreen';

export default function PlacesListScreen() {
  return (
    <AppScreen title="Места">
      <View style={styles.content}>
        <Text variant="bodyLarge" style={styles.text}>
          Список мест (заглушка). Реализация — на следующем этапе.
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
