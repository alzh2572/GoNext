import { ReactNode } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar, useTheme } from 'react-native-paper';
import { useAppTheme } from '../src/context/ThemePreference';

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
  const { isDark } = useAppTheme();
  const theme = useTheme();

  const body = (
    <>
      <Appbar.Header
        style={[
          styles.header,
          {
            backgroundColor: isDark
              ? theme.colors.surface
              : 'rgba(255,255,255,0.88)',
          },
        ]}
      >
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
    </>
  );

  if (isDark) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {body}
      </View>
    );
  }

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.container}
      resizeMode="cover"
    >
      {body}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    elevation: 0,
  },
  content: {
    flex: 1,
  },
});
