import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';
import { AppScreen } from '../components/AppScreen';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const menuItems = [
    { label: t('home.places'), href: '/places' as const },
    { label: t('home.trips'), href: '/trips' as const },
    { label: t('home.next'), href: '/next' as const },
    { label: t('home.settings'), href: '/settings' as const },
  ];

  return (
    <AppScreen title="GoNext" showBack={false}>
      <View style={styles.content}>
        {menuItems.map((item) => (
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
