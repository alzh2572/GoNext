import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppScreen } from '../components/AppScreen';

export default function NextPlaceScreen() {
  return (
    <AppScreen title="Следующее место">
      <View style={styles.content}>
        <Text variant="bodyLarge" style={styles.text}>
          Экран следующего места (заглушка).
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
