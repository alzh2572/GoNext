import { ReactNode, useEffect } from 'react';
import { initI18n } from './index';

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void initI18n();
  }, []);

  return <>{children}</>;
}
