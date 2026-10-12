import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { sha256Hex } from './crypto';

export const DEFAULT_SETTINGS = {
  appearance: 'system',
  weekStartsOn: 1,
  appLock: false,
  pinHash: null,
  lockAfter: 5,
  fingerprint: false,
  webauthnId: null,
  dailyReminder: false,
  reminderTime: '20:00',
  onboarded: false,
  lastBackupAt: null,
};

const SettingsContext = createContext(null);
const ToastContext = createContext(null);

export function SettingsProvider({ children }) {
  const rows = useLiveQuery(() => db.settings.toArray(), []);
  const [toast, setToast] = useState(null);

  const settings = useMemo(() => {
    const out = { ...DEFAULT_SETTINGS };
    for (const r of rows || []) out[r.key] = r.value;
    return out;
  }, [rows]);

  const ready = rows !== undefined;

  const set = useCallback((key, value) => db.settings.put({ key, value }), []);

  const showToast = useCallback((message) => {
    setToast({ message, at: Date.now() });
    setTimeout(() => setToast((t) => (t && Date.now() - t.at >= 1900 ? null : t)), 2000);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark =
        settings.appearance === 'dark' ||
        (settings.appearance === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [settings.appearance]);

  const setPin = useCallback(
    async (pin) => {
      await set('pinHash', await sha256Hex(`lj::${pin}`));
    },
    [set]
  );

  const verifyPin = useCallback(
    async (pin) => {
      const hash = await sha256Hex(`lj::${pin}`);
      return hash === settings.pinHash;
    },
    [settings.pinHash]
  );

  const value = useMemo(
    () => ({ settings, ready, set, setPin, verifyPin }),
    [settings, ready, set, setPin, verifyPin]
  );
  const toastValue = useMemo(() => ({ toast, showToast }), [toast, showToast]);

  return (
    <SettingsContext.Provider value={value}>
      <ToastContext.Provider value={toastValue}>{children}</ToastContext.Provider>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function useToast() {
  return useContext(ToastContext);
}
