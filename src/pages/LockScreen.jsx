import { useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { useSettings, useToast } from '../services/settings';
import { verifyFingerprint } from '../services/webauthn';
import { readBackupFile, unlockBackup, restoreBackup } from '../services/backup';
import { PinDots, PinPad } from '../components/PinPad';

export function LockScreen() {
  const { settings, set, verifyPin } = useSettings();
  const { showToast } = useToast();
  const [error, setError] = useState(false);
  const [filled, setFilled] = useState(0);
  const [pwPrompt, setPwPrompt] = useState(false);
  const [pending, setPending] = useState(null);
  const [pw, setPw] = useState('');
  const fileRef = useRef(null);

  const onComplete = async (pin) => {
    const ok = await verifyPin(pin);
    if (ok) {
      window.dispatchEvent(new CustomEvent('journal-unlock'));
    } else {
      setError(true);
      setFilled(0);
      setTimeout(() => setError(false), 450);
    }
  };

  const onBiometric = async () => {
    if (!settings.webauthnId) return;
    try {
      await verifyFingerprint(settings.webauthnId);
      window.dispatchEvent(new CustomEvent('journal-unlock'));
    } catch {
      showToast('Fingerprint did not match');
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const res = await readBackupFile(file);
      if (res.encrypted) {
        setPending(res.bytes);
        setPwPrompt(true);
      } else {
        await restoreAndUnlock(res.data);
      }
    } catch {
      showToast('That file is not a journal backup');
    }
  };

  const restoreAndUnlock = async (data) => {
    await restoreBackup(data);
    await set('appLock', false);
    await set('fingerprint', false);
    await set('webauthnId', null);
    window.dispatchEvent(new CustomEvent('journal-unlock'));
    showToast('Backup restored');
  };

  const unlockFile = async () => {
    try {
      const data = await unlockBackup(pending, pw);
      await restoreAndUnlock(data);
    } catch {
      showToast('Wrong password');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0c1322] px-8 text-[#f2f1ec]">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3cf23] text-[#182340]">
        <Lock size={28} />
      </span>
      <h1 className="mt-5 font-serif text-[27px] font-semibold italic">Journal locked</h1>
      <p className="mt-1 text-[13.5px] text-[#98a1b6]">Enter your PIN to open it</p>

      <div className="mb-8 mt-7">
        <PinDots length={4} filled={filled} error={error} dark />
      </div>

      <PinPad
        dark
        onComplete={onComplete}
        onChange={setFilled}
        error={error}
        onBiometric={settings.fingerprint && settings.webauthnId ? onBiometric : undefined}
        biometricLabel="Unlock with fingerprint"
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="mt-9 text-[13.5px] text-[#98a1b6] underline underline-offset-4"
      >
        Forgot PIN? Restore from a backup file
      </button>

      <input ref={fileRef} type="file" accept=".json,.ljournal,application/json" hidden onChange={onFile} />

      {pwPrompt && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 px-8">
          <div className="w-full max-w-[320px] rounded-2xl bg-[#131c30] p-5">
            <h3 className="font-serif text-[19px] font-semibold">This backup is locked</h3>
            <p className="mt-1 text-[13.5px] text-[#98a1b6]">
              Restoring it will replace this journal and turn off the app lock.
            </p>
            <input
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Backup password"
              className="mt-3 w-full rounded-lg bg-[#0f1829] px-3 py-2.5 text-[15px] text-[#f2f1ec] outline-none"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPwPrompt(false);
                  setPending(null);
                  setPw('');
                }}
                className="flex-1 rounded-xl border border-[#24304d] py-2.5 text-[14px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={unlockFile}
                className="flex-1 rounded-xl bg-[#f3cf23] py-2.5 text-[14px] font-semibold text-[#182340]"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
