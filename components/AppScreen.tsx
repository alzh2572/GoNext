import { ReactNode } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar } from 'react-native-paper';

const backgroundImage = require('../assets/backgrounds/gonext-bg.png');

type AppScreenProps = {
  title: string;
  children: ReactNode;
  showBack?: boolean;
  actions?: ReactNode;
};

export function AppScreen({
  title,
  children,
  showBack = true,
  actions,
}: AppScreenProps) {
  const router = useRouter();

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.container}
      resizeMode="cover"
    >
      <Appbar.Header style={styles.header}>
        {showBack ? (
          <Appbar.BackAction
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
          />
        ) : null}
        <Appbar.Content title={title} />
        {actions}
      </Appbar.Header>
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
});
