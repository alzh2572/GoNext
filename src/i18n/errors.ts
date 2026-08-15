import i18n from './index';

export function messageFromError(err: unknown, fallbackKey: string): string {
  return err instanceof Error ? err.message : i18n.t(fallbackKey);
}
