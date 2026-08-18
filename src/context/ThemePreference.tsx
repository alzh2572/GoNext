import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_ACCENT,
  isAccentId,
  type AccentId,
  type ThemeMode,
} from '../theme';

const STORAGE_KEY = 'gonext.theme';

type StoredPrefs = {
  mode?: ThemeMode;
  accentId?: AccentId;
};

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  accentId: AccentId;
  setMode: (mode: ThemeMode) => void;
  setAccentId: (accentId: AccentId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [accentId, setAccentState] = useState<AccentId>(DEFAULT_ACCENT);

  const persist = useCallback((nextMode: ThemeMode, nextAccent: AccentId) => {
    const payload: StoredPrefs = { mode: nextMode, accentId: nextAccent };
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && stored) {
          if (stored === 'light' || stored === 'dark') {
            setModeState(stored);
          } else {
            const parsed = JSON.parse(stored) as StoredPrefs;
            if (parsed.mode === 'light' || parsed.mode === 'dark') {
              setModeState(parsed.mode);
            }
            if (parsed.accentId && isAccentId(parsed.accentId)) {
              setAccentState(parsed.accentId);
            }
          }
        }
      } catch {
        // оставляем значения по умолчанию
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      persist(next, accentId);
    },
    [accentId, persist],
  );

  const setAccentId = useCallback(
    (next: AccentId) => {
      setAccentState(next);
      persist(mode, next);
    },
    [mode, persist],
  );

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      accentId,
      setMode,
      setAccentId,
    }),
    [mode, accentId, setMode, setAccentId],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme должен вызываться внутри ThemePreferenceProvider');
  }
  return context;
}
