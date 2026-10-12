import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useSettings, useToast } from '../services/settings';
import { readBackupFile, unlockBackup, restoreBackup } from '../services/backup';

const BULLETS = ['No account and no login', 'Works without internet', 'Backed up to a file you control'];

export function Welcome() {
  const { set } = useSettings();
  const { showToast } = useToast();
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null);
  const [pw, setPw] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const res = await readBackupFile(file);
      if (res.encrypted) setPending(res.bytes);
      else {
        await restoreBackup(res.data);
        await set('onboarded', true);
        showToast('Backup restored');
      }
    } catch {
      showToast('That file is not a journal backup');
    }
  };

  const unlock = async () => {
    try {
      const data = await unlockBackup(pending, pw);
      await restoreBackup(data);
      await set('onboarded', true);
      showToast('Backup restored');
    } catch {
      showToast('Wrong password');
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-8 text-center">
      <div className="relative mb-8 h-44 w-48" aria-hidden>
        <span className="absolute left-1/2 top-0 h-4 w-28 -translate-x-1/2 rounded-t-sm bg-accent/70" />
        <span className="absolute left-2 top-7 h-32 w-36 rotate-[-5deg] rounded-md bg-card shadow-[0_3px_16px_rgba(20,20,20,0.12)] ring-1 ring-line" />
        <span className="absolute right-2 top-5 h-32 w-36 rotate-[4deg] rounded-md bg-card shadow-[0_3px_16px_rgba(20,20,20,0.12)] ring-1 ring-line" />
        <span className="absolute left-1/2 top-[70px] z-10 h-1.5 w-10 -translate-x-1/2 rounded-full bg-[#182340]" />
      </div>

      <h1 className="max-w-[300px] font-serif text-[32px] font-semibold italic leading-[1.15]">
        Your days, kept on your phone.
      </h1>

      <ul className="mt-7 space-y-3">
        {BULLETS.map((b) => (
          <li key={b} className="flex items-center justify-center gap-2.5 text-[14.5px]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-ink">
              <Check size={13} strokeWidth={3} />
            </span>
            {b}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => set('onboarded', true)}
        className="mt-10 w-full max-w-[320px] rounded-xl bg-navy py-3.5 text-[15.5px] font-semibold text-navy-ink"
      >
        Start writing
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="mt-4 text-[14px] text-soft underline underline-offset-4"
      >
        Restore from a backup file
      </button>

      <input ref={fileRef} type="file" accept=".json,.ljournal,application/json" hidden onChange={onFile} />

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="card-shell w-full max-w-[320px] p-5 text-left">
            <h3 className="font-serif text-[19px] font-semibold">This backup is locked</h3>
            <input
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Backup password"
              className="mt-3 w-full rounded-lg bg-field px-3 py-2.5 text-[15px] outline-none"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="flex-1 rounded-xl border border-line py-2.5 text-[14px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={unlock}
                className="flex-1 rounded-xl bg-navy py-2.5 text-[14px] font-semibold text-navy-ink"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
