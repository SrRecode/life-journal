import { useState } from 'react';
import { CalendarDays, Camera, ChevronDown, ChevronLeft, Lock, PenLine, Save, Search, Sun, Tag, WifiOff } from 'lucide-react';

const SECTIONS = [
  {
    id: 'write',
    title: 'Write your first entry',
    Icon: PenLine,
    items: [
      'Tap the yellow + button in the bottom bar.',
      'Give the day a name, write as much or as little as you want, pick a mood and press Save.',
      'New entries appear at the top of your Timeline, older ones below.',
    ],
  },
  {
    id: 'moods',
    title: 'Moods, tags, time & place',
    Icon: Tag,
    items: [
      'Every entry can have a mood (Calm, Low, Proud and more), a time and a place.',
      'Add tags like #slowmorning while writing — they show up as tappable chips and make entries easy to find.',
      'Open any entry later to edit or delete it.',
    ],
  },
  {
    id: 'photos',
    title: 'Photos & favourites',
    Icon: Camera,
    items: [
      'Add photos while writing an entry — they stay on this phone.',
      'Tap the star on an entry to favourite it; its photos appear in the Photos tab under Favourites.',
      'Places and People filters are coming soon.',
    ],
  },
  {
    id: 'search',
    title: 'Search your journal',
    Icon: Search,
    items: ['Tap the magnifier at the top of the Timeline to search titles, text and tags.'],
  },
  {
    id: 'calendar',
    title: 'Calendar',
    Icon: CalendarDays,
    items: [
      'The Calendar tab shows which days have entries.',
      'Use the arrows to move between months; tap a day to read or write for that day.',
      'Choose Monday or Sunday as your first day of the week in Settings.',
    ],
  },
  {
    id: 'backup',
    title: 'Back up & restore',
    Icon: Save,
    items: [
      'Open the Backup tab and press Create backup; optionally add a password before saving the file.',
      'Save the file somewhere safe — Google Drive, your computer, a USB stick.',
      'To restore: Welcome screen → "Restore from a backup file", or the lock screen → "Forgot PIN?".',
      'Back up after any day you would hate to lose.',
    ],
  },
  {
    id: 'lock',
    title: 'App lock, PIN & fingerprint',
    Icon: Lock,
    items: [
      'Settings → Privacy → App lock: turn it on and create a 4-digit PIN.',
      'Your PIN is saved on this phone — it stays even if you turn the lock off, so you can change or remove it later from Settings.',
      'Optionally enable fingerprint unlock, and pick how long the journal waits before locking again (Lock after).',
    ],
  },
  {
    id: 'theme',
    title: 'Light & dark mode',
    Icon: Sun,
    items: ['Settings → Appearance: Light, Dark, or Match phone.'],
  },
  {
    id: 'offline',
    title: 'Offline & private',
    Icon: WifiOff,
    items: [
      'No account and no login — the journal works without internet.',
      'Add it to your home screen from your browser to use it like an app.',
      'Your entries never leave this phone unless you export a backup.',
    ],
  },
];

export function GuidePage({ onClose }) {
  const [openIds, setOpenIds] = useState(() => new Set(['write']));

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="fixed inset-0 z-[45] mx-auto max-w-md overflow-y-auto bg-bg pb-16 anim-sheet">
      <header className="flex items-center gap-1 border-b border-line px-2 pb-3 pt-[max(env(safe-area-inset-top),14px)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-serif text-[22px] font-semibold">Guide</h1>
      </header>

      <div className="px-4">
        <p className="mt-4 text-[14.5px] leading-relaxed text-soft">
          Everything in Life Journal in one place. Tap a topic to open it.
        </p>

        <div className="mt-4 space-y-2">
          {SECTIONS.map(({ id, title, Icon, items }) => {
            const open = openIds.has(id);
            return (
              <div key={id} className="overflow-hidden rounded-2xl border border-line bg-card">
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-field text-ink">
                    <Icon size={15} />
                  </span>
                  <span className="flex-1 text-[15px] font-semibold">{title}</span>
                  <ChevronDown
                    size={17}
                    className={`shrink-0 text-soft transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <ul className="space-y-2 border-t border-line px-4 py-3.5 text-[14px] leading-relaxed text-soft">
                    {items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-soft" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[12px] text-soft">Life Journal · Everything stays on this phone</p>
      </div>
    </div>
  );
}
