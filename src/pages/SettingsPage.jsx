import { useEffect, useState } from 'react';
import { Check, ChevronLeft, Fingerprint, Lock, Moon, Sun, Smartphone, Trash2 } from 'lucide-react';
import { useToast, useSettings } from '../services/settings';
import { hasPlatformAuthenticator, registerFingerprint } from '../services/webauthn';
import { PinDots, PinPad } from '../components/PinPad';
import { Confirm, OfflineNote, SectionTitle, SettingRow, Toggle } from '../components/ui';
import { GuidePage } from './GuidePage';

const APPEARANCES = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'system', label: 'Match phone', Icon: Smartphone },
];

const LOCK_OPTIONS = [
  { value: 0, label: 'Immediately' },
  { value: 1, label: 'After 1 minute' },
  { value: 5, label: 'After 5 minutes' },
  { value: 15, label: 'After 15 minutes' },
  { value: -1, label: 'Only on launch' },
];

export function SettingsPage({ onClose }) {
  const { settings, set, setPin } = useSettings();
  const { showToast } = useToast();
  const [pinSetup, setPinSetup] = useState(null); // { step: 'create'|'confirm', first: null }
  const [pinError, setPinError] = useState(false);
  const [pinFilled, setPinFilled] = useState(0);
  const [authOk, setAuthOk] = useState(true);
  const [lockPicker, setLockPicker] = useState(false);
  const [confirmRemovePin, setConfirmRemovePin] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    hasPlatformAuthenticator().then(setAuthOk);
  }, []);

  useEffect(() => {
    setPinFilled(0);
  }, [pinSetup?.step]);

  const startPinSetup = () => setPinSetup({ step: 'create', first: null });

  const onPin = async (pin) => {
    if (!pinSetup) return;
    if (pinSetup.step === 'create') {
      setPinSetup({ step: 'confirm', first: pin });
      setPinError(false);
    } else if (pinSetup.first === pin) {
      await setPin(pin);
      await set('appLock', true);
      setPinSetup(null);
      showToast('App lock on');
    } else {
      setPinError(true);
      setTimeout(() => {
        setPinError(false);
        setPinSetup({ step: 'create', first: null });
      }, 500);
      showToast('PINs did not match');
    }
  };

  const removePin = async () => {
    await set('pinHash', null);
    await set('appLock', false);
    await set('fingerprint', false);
    await set('webauthnId', null);
    setConfirmRemovePin(false);
    showToast('Saved PIN removed');
  };

  const toggleLock = async (v) => {
    if (v && !settings.pinHash) {
      startPinSetup();
      return;
    }
    await set('appLock', v);
  };

  const toggleFingerprint = async (v) => {
    if (v) {
      try {
        const id = await registerFingerprint();
        await set('webauthnId', id);
        await set('fingerprint', true);
        showToast('Fingerprint unlock on');
      } catch {
        showToast('Fingerprint setup cancelled');
      }
    } else {
      await set('fingerprint', false);
      await set('webauthnId', null);
    }
  };

  return (
    <div className="fixed inset-0 z-40 mx-auto max-w-md overflow-y-auto bg-bg pb-16 anim-sheet">
      <header className="flex items-center gap-1 border-b border-line px-2 pb-3 pt-[max(env(safe-area-inset-top),14px)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-serif text-[22px] font-semibold">Settings</h1>
      </header>

      <div className="px-4">
        <SectionTitle>Appearance</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {APPEARANCES.map(({ id, label, Icon }) => {
            const on = settings.appearance === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => set('appearance', id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border py-3.5 text-[12.5px] font-medium ${
                  on ? 'border-accent ring-1 ring-accent' : 'border-line'
                }`}
              >
                <Icon size={19} />
                {label}
                {on && <Check size={13} className="text-accent-ink" />}
              </button>
            );
          })}
        </div>

        <SectionTitle>Privacy</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <SettingRow
            title="App lock"
            sub={settings.pinHash ? 'Saved PIN on this phone' : 'Choose a 4-digit PIN to turn this on'}
          >
            <Toggle checked={settings.appLock} onChange={toggleLock} label="App lock" />
          </SettingRow>
          {settings.appLock && (
            <SettingRow
              title="Lock after"
              sub={LOCK_OPTIONS.find((o) => o.value === settings.lockAfter)?.label || 'After 5 minutes'}
              onClick={() => setLockPicker(true)}
            >
              <ChevronLeft size={16} className="rotate-180 text-soft" />
            </SettingRow>
          )}
          <SettingRow
            title="Fingerprint"
            sub={authOk ? 'Unlock with this device' : 'Not available on this device'}
          >
            <Toggle
              checked={settings.fingerprint}
              onChange={toggleFingerprint}
              disabled={!authOk}
              label="Fingerprint"
            />
          </SettingRow>
          {settings.pinHash && (
            <SettingRow title="Change PIN" sub="Replace your current unlock PIN" onClick={startPinSetup}>
              <ChevronLeft size={16} className="rotate-180 text-soft" />
            </SettingRow>
          )}
          {settings.pinHash && (
            <SettingRow title="Remove saved PIN" sub="Turn off app lock and delete the PIN" onClick={() => setConfirmRemovePin(true)}>
              <Trash2 size={15} className="text-soft" />
            </SettingRow>
          )}
        </div>

        <SectionTitle>Writing</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <SettingRow title="Daily reminder" sub="A gentle nudge to write">
            <Toggle
              checked={settings.dailyReminder}
              onChange={(v) => set('dailyReminder', v)}
              label="Daily reminder"
            />
          </SettingRow>
          {settings.dailyReminder && (
            <div className="border-b border-line px-4 py-3">
              <input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => set('reminderTime', e.target.value)}
                className="rounded-lg bg-field px-3 py-1.5 text-[14.5px] outline-none"
              />
            </div>
          )}
          <SettingRow title="Week starts on" sub="Used by the calendar">
            <div className="flex overflow-hidden rounded-lg border border-line text-[12.5px] font-semibold">
              {[1, 0].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set('weekStartsOn', d)}
                  className={`px-2.5 py-1 ${settings.weekStartsOn === d ? 'bg-navy text-navy-ink' : 'text-soft'}`}
                >
                  {d === 1 ? 'Mon' : 'Sun'}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>

        <SectionTitle>Help</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <SettingRow title="Guide" sub="How to use Life Journal, step by step" onClick={() => setShowGuide(true)}>
            <ChevronLeft size={16} className="rotate-180 text-soft" />
          </SettingRow>
        </div>

        <OfflineNote>
          Life Journal works offline. Your journal never leaves this phone unless you export it.
        </OfflineNote>

        <p className="mt-6 text-center text-[12px] text-soft">
          Life Journal · v1.0.0 · Saved on this phone
        </p>
      </div>

      {showGuide && <GuidePage onClose={() => setShowGuide(false)} />}

      <Confirm
        open={confirmRemovePin}
        title="Remove saved PIN?"
        body="App lock and fingerprint unlock will be turned off. You can set up a new PIN anytime by turning App lock on again."
        confirmLabel="Remove"
        onConfirm={removePin}
        onCancel={() => setConfirmRemovePin(false)}
      />

      {pinSetup && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col items-center justify-center bg-bg px-6">
          <button
            type="button"
            onClick={() => setPinSetup(null)}
            className="absolute right-4 top-[max(env(safe-area-inset-top),16px)] text-[15px] text-soft transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <div className="mb-8 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink">
              <Lock size={24} />
            </span>
            <h2 className="font-serif text-[24px] font-semibold">
              {pinSetup.step === 'create' ? 'Choose a PIN' : 'Confirm your PIN'}
            </h2>
            <p className="mt-1 text-[13.5px] text-soft">4 digits you will remember</p>
          </div>
          <div className="mb-7">
            <PinDots length={4} filled={pinFilled} error={pinError} />
          </div>
          <div className="mb-7">
            <PinPad onComplete={onPin} onChange={setPinFilled} error={pinError} />
          </div>
        </div>
      )}

      {lockPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setLockPicker(false)}>
          <div
            className="w-full max-w-md rounded-t-2xl bg-bg p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 px-1 font-serif text-[18px] font-semibold">Lock after</h3>
            <div className="overflow-hidden rounded-xl border border-line bg-card">
              {LOCK_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={async () => {
                    await set('lockAfter', o.value);
                    setLockPicker(false);
                  }}
                  className="flex w-full items-center justify-between border-b border-line px-4 py-3 text-left text-[15px] last:border-b-0"
                >
                  {o.label}
                  {settings.lockAfter === o.value && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
