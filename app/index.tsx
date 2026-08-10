import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'react-native-paper';
import { AppScreen } from '../components/AppScreen';

const MENU_ITEMS = [
  { label: 'Места', href: '/places' as const },
  { label: 'Поездки', href: '/trips' as const },
  { label: 'Следующее место', href: '/next' as const },
  { label: 'Настройки', href: '/settings' as const },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <AppScreen title="GoNext" showBack={false}>
      <View style={styles.content}>
        {MENU_ITEMS.map((item) => (
          <Button
            key={item.href}
            mode="contained"
            style={styles.button}
            contentStyle={styles.buttonContent}
            onPress={() => router.push(item.href)}
          >
            {item.label}
          </Button>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    height: 52,
  },
});
