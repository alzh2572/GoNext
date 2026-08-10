import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar } from 'react-native-paper';

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
    <View style={styles.container}>
      <Appbar.Header>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
