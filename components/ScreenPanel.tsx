import { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';
import { cardShape } from '../src/theme';

type ScreenPanelProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function ScreenPanel({ children, style }: ScreenPanelProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.colors.surface },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type EmptyStateProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <ScreenPanel>
        <Text variant="titleMedium">{title}</Text>
        {message ? (
          <Text variant="bodyMedium" style={styles.muted}>
            {message}
          </Text>
        ) : null}
        {actionLabel && onAction ? (
          <Button mode="contained" onPress={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </ScreenPanel>
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={styles.center}>
      <ActivityIndicator animating size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    ...cardShape,
    gap: 10,
  },
  wrap: {
    margin: 16,
  },
  muted: {
    opacity: 0.75,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
