import { useEffect, useState } from 'react';
import { db, saveEntry } from './database/db';
import { SettingsProvider, useSettings, useToast } from './services/settings';
import { todayIso, iso } from './services/dates';
import { makeDemoPhoto } from './services/photos';
import { BottomNav } from './components/BottomNav';
import { TimelinePage } from './pages/Timeline';
import { CalendarPage } from './pages/CalendarPage';
import { PhotosPage } from './pages/PhotosPage';
import { BackupPage } from './pages/BackupPage';
import { EntryEditor } from './pages/EntryEditor';
import { EntryDetail } from './pages/EntryDetail';
import { SettingsPage } from './pages/SettingsPage';
import { Welcome } from './pages/Welcome';
import { LockScreen } from './pages/LockScreen';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
}

async function seedDemo() {
  if (!import.meta.env.DEV || localStorage.getItem('lj-seeded')) return;
  try {
    if ((await db.entries.count()) > 0) {
      localStorage.setItem('lj-seeded', '1');
      return;
    }
    const now = Date.now();
    const demo = [
      {
        date: daysAgo(0),
        title: 'Slow Monday',
        body: 'Rain since morning, so I kept the window open and let the day go at half speed. Made proper coffee instead of the instant stuff and actually tasted it.\n\nFinished the chapter I had been avoiding for a week. Nothing dramatic happened, and that was exactly the point.',
        mood: 'calm',
        tags: ['slowmorning', 'reading'],
        favourite: false,
        createdAt: now - 3600000,
        photos: [
          ['#c8d6e8', '#8fa9c9'],
          ['#e8dcc0', '#c9b48f'],
          ['#d9e4d0', '#9fbc93'],
        ],
      },
      {
        date: daysAgo(1),
        title: 'Rain on the window',
        body: 'Walked home without an umbrella and got soaked, which turned out to be the best part of the day. The whole street smelled like wet stone.',
        mood: 'low',
        tags: ['walk'],
        favourite: false,
        createdAt: now - 90000000,
        photos: [],
      },
      {
        date: daysAgo(3),
        title: 'Small wins',
        body: 'Shipped the thing I had been putting off for two months. Celebrated with samosas from the corner place.',
        mood: 'proud',
        tags: ['work'],
        favourite: true,
        createdAt: now - 260000000,
        photos: [['#f0d9a8', '#e0a458']],
      },
    ];
    for (const e of demo) {
      const { photos, ...rest } = e;
      const id = await saveEntry({ ...rest, time: '9:12 pm', location: '' });
      for (const colors of photos) {
        const blob = await makeDemoPhoto(colors);
        await db.photos.add({
          entryId: id,
          blob,
          width: 480,
          height: 600,
          createdAt: Date.now(),
        });
      }
    }
    localStorage.setItem('lj-seeded', '1');
  } catch {
    /* seeding is best-effort */
  }
}

function Shell() {
  const { settings, ready, set } = useSettings();
  const { toast } = useToast();
  const [tab, setTab] = useState('timeline');
  const [editor, setEditor] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    if (ready) seedDemo();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    if (!settings.appLock) setLocked(false);
    else setLocked(true);
  }, [ready, settings.appLock]);

  useEffect(() => {
    const onUnlock = () => setLocked(false);
    window.addEventListener('journal-unlock', onUnlock);
    return () => window.removeEventListener('journal-unlock', onUnlock);
  }, []);

  useEffect(() => {
    if (!ready || !settings.appLock || locked) return undefined;
    const after = settings.lockAfter ?? 5;
    if (after === 0) {
      const onHide = () => {
        if (document.hidden) setLocked(true);
      };
      document.addEventListener('visibilitychange', onHide);
      return () => document.removeEventListener('visibilitychange', onHide);
    }
    if (after < 0) return undefined;
    let timer = setTimeout(() => setLocked(true), after * 60000);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setLocked(true), after * 60000);
    };
    const events = ['pointerdown', 'keydown', 'wheel'];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [ready, settings.appLock, settings.lockAfter, locked]);

  if (!ready) return null;
  if (!settings.onboarded) return <Welcome />;

  const openEditor = (opts = {}) => {
    setShowSettings(false);
    setDetailId(null);
    setEditor({ date: todayIso(), ...opts });
  };

  const pages = {
    timeline: (
      <TimelinePage
        onOpenEntry={setDetailId}
        onNew={() => openEditor()}
        onSettings={() => setShowSettings(true)}
      />
    ),
    calendar: <CalendarPage onOpenEntry={setDetailId} onNew={(date) => openEditor({ date })} />,
    photos: <PhotosPage onOpenEntry={setDetailId} />,
    backup: <BackupPage />,
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      {pages[tab]}

      <BottomNav tab={tab} onTab={setTab} onNew={() => openEditor()} />

      {editor && (
        <EntryEditor
          entry={editor.entry}
          date={editor.date}
          onClose={() => setEditor(null)}
          onSaved={(id) => {
            setEditor(null);
            if (id) setDetailId(id);
          }}
        />
      )}

      {detailId != null && (
        <EntryDetail
          entryId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(entry) => openEditor({ entry })}
        />
      )}

      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}

      {locked && settings.appLock && <LockScreen />}

      {toast && (
        <div className="anim-toast fixed bottom-[100px] left-1/2 z-[60] max-w-[86vw] -translate-x-1/2 rounded-full bg-navy px-4 py-2 text-[13.5px] font-medium text-navy-ink shadow-lg">
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  );
}
