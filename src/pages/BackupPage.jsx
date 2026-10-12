import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download, Upload } from 'lucide-react';
import { db } from '../database/db';
import { useSettings, useToast } from '../services/settings';
import { exportBackup, downloadBlob, readBackupFile, unlockBackup, restoreBackup, backupSize } from '../services/backup';
import { OfflineNote, SettingRow, Toggle } from '../components/ui';
import { TopBarActions } from '../components/TopBar';

function relTime(ts) {
  if (!ts) return 'never';
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export function BackupPage({ onSettings }) {
  const { settings, set } = useSettings();
  const { showToast } = useToast();
  const fileRef = useRef(null);
  const [withPassword, setWithPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [includePhotos, setIncludePhotos] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const [restorePw, setRestorePw] = useState('');

  const entriesCount = useLiveQuery(() => db.entries.count(), []) ?? 0;
  const photosCount = useLiveQuery(() => db.photos.count(), []) ?? 0;
  const [size, setSize] = useState({ bytes: 0 });

  useEffect(() => {
    backupSize(includePhotos).then(setSize).catch(() => {});
  }, [includePhotos, entriesCount, photosCount]);

  const mb =
    size.bytes < 104857.6
      ? '< 0.1 MB'
      : `${(size.bytes / 1048576).toFixed(1)} MB`;

  const doExport = async () => {
    if (withPassword && password.length < 4) {
      showToast('Password needs at least 4 characters');
      return;
    }
    setBusy(true);
    try {
      const { blob, filename, entryCount } = await exportBackup({
        includePhotos,
        password: withPassword ? password : '',
      });
      downloadBlob(blob, filename);
      await set('lastBackupAt', Date.now());
      showToast(`Saved · ${entryCount} entries`);
      setPassword('');
    } catch (e) {
      showToast('Export failed');
    } finally {
      setBusy(false);
    }
  };

  const pickFile = () => fileRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const res = await readBackupFile(file);
      if (res.encrypted) {
        setPending(res.bytes);
      } else {
        await restoreBackup(res.data);
        showToast('Backup restored');
      }
    } catch {
      showToast('That file is not a journal backup');
    }
  };

  const confirmRestore = async () => {
    try {
      const data = await unlockBackup(pending, restorePw);
      await restoreBackup(data);
      setPending(null);
      setRestorePw('');
      showToast('Backup restored');
    } catch {
      showToast('Wrong password');
    }
  };

  return (
    <div className="pb-32">
      <header className="px-4 pt-[max(env(safe-area-inset-top),16px)]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-[34px] font-semibold leading-none">Backup</h1>
            <p className="mt-1.5 text-[13px] text-soft">Saved only on this phone</p>
          </div>
          <TopBarActions showSearch={false} onSettings={onSettings} />
        </div>
      </header>

      <section className="mx-4 mt-5 card-shell paper px-4 py-4">
        <p className="text-[15px]">
          Last backup: <span className="highlight font-semibold">{relTime(settings.lastBackupAt)}</span>
        </p>
        <p className="mt-1.5 text-[13.5px] leading-snug text-soft">
          Export a single file with everything in it, then keep it wherever you like — a folder,
          a drive, a USB stick.
        </p>
        <p className="mt-3 text-[12.5px] text-soft">
          {entriesCount} entries · {photosCount} photos ·{' '}
          {size.bytes < 104857.6 ? 'under 0.1 MB' : `about ${mb}`}
        </p>
      </section>

      <div className="mx-4 mt-4 overflow-hidden rounded-2xl border border-line bg-card">
        <SettingRow title="Protect with a password" sub="Encrypts the file with AES-GCM">
          <Toggle checked={withPassword} onChange={setWithPassword} label="Protect with a password" />
        </SettingRow>
        {withPassword && (
          <div className="border-b border-line px-4 py-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Backup password"
              className="w-full rounded-lg bg-field px-3 py-2 text-[15px] outline-none"
            />
          </div>
        )}
        <SettingRow title="Include photos">
          <Toggle checked={includePhotos} onChange={setIncludePhotos} label="Include photos" />
        </SettingRow>
        <SettingRow title="Weekly reminder" sub="A nudge on Sunday evening">
          <Toggle
            checked={settings.weeklyBackupReminder ?? true}
            onChange={(v) => set('weeklyBackupReminder', v)}
            label="Weekly reminder"
          />
        </SettingRow>
      </div>

      <div className="mx-4 mt-5 space-y-3">
        <button
          type="button"
          onClick={doExport}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-3.5 text-[15px] font-semibold text-navy-ink disabled:opacity-60"
        >
          <Download size={18} />
          {busy ? 'Exporting…' : 'Export backup'}
        </button>
        <button
          type="button"
          onClick={pickFile}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3.5 text-[15px] font-semibold text-ink"
        >
          <Upload size={18} />
          Restore from file
        </button>
      </div>

      <OfflineNote>
        Works offline. Your journal never leaves this phone unless you export it.
      </OfflineNote>

      <input ref={fileRef} type="file" accept=".json,.ljournal,application/json" hidden onChange={onFile} />

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="card-shell w-full max-w-[320px] p-5">
            <h3 className="font-serif text-[19px] font-semibold">This backup is locked</h3>
            <p className="mt-1 text-[13.5px] text-soft">Enter the password it was exported with.</p>
            <input
              type="password"
              autoFocus
              value={restorePw}
              onChange={(e) => setRestorePw(e.target.value)}
              className="mt-3 w-full rounded-lg bg-field px-3 py-2.5 text-[15px] outline-none"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPending(null);
                  setRestorePw('');
                }}
                className="flex-1 rounded-xl border border-line py-2.5 text-[14px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRestore}
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
