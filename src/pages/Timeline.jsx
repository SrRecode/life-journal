import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { fmtHeaderDate, streakOf } from '../services/dates';
import { EntryCard, EmptyJournal } from '../components/EntryCard';
import { TopBarActions } from '../components/TopBar';

export function TimelinePage({ onOpenEntry, onNew, onSettings }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const entries = useLiveQuery(() => db.entries.orderBy('date').reverse().toArray(), []) || [];
  const photos = useLiveQuery(() => db.photos.toArray(), []) || [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...entries].sort((a, b) =>
      a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1
    );
    if (!q) return sorted;
    return sorted.filter(
      (e) =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.body || '').toLowerCase().includes(q) ||
        (e.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [entries, query]);

  const photosByEntry = useMemo(() => {
    const map = {};
    for (const p of photos) (map[p.entryId] ||= []).push(p);
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.createdAt - b.createdAt);
    return map;
  }, [photos]);

  const streak = streakOf(entries.map((e) => e.date));
  const stats = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} · ${photos.length} photos${
    streak > 0 ? ` · ${streak}-day streak` : ''
  }`;

  return (
    <div className="pb-32">
      <header className="px-4 pt-[max(env(safe-area-inset-top),16px)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] text-soft">{fmtHeaderDate()}</p>
            <h1 className="mt-0.5 font-serif text-[34px] font-semibold leading-none">
              Your journal
            </h1>
          </div>
          <TopBarActions
            searching={searching}
            onSearchToggle={() => {
              if (searching) setQuery('');
              setSearching((s) => !s);
            }}
            onSettings={onSettings}
          />
        </div>
        {searching ? (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your journal…"
            className="mt-3 w-full rounded-xl border border-line bg-field px-4 py-2.5 text-[15px] outline-none focus:border-ink/30"
          />
        ) : (
          <p className="mt-1.5 text-[13px] text-soft">{stats}</p>
        )}
      </header>

      {entries.length === 0 ? (
        <EmptyJournal onStart={onNew} />
      ) : (
        <div className="mt-6 space-y-4 px-4">
          {filtered.map((e, i) => (
            <div key={e.id}>
              {(i === 0 || filtered[i - 1].date !== e.date) && (
                <p className="mb-2 ml-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-soft">
                  {dateLabel(e.date)}
                </p>
              )}
              <EntryCard
                entry={e}
                photos={photosByEntry[e.id] || []}
                onOpen={onOpenEntry}
              />
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-[14px] text-soft">Nothing matches “{query}”.</p>
          )}
        </div>
      )}
    </div>
  );
}

function dateLabel(dateStr) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}
