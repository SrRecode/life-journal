import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { db, moodOf } from '../database/db';
import { buildMonthGrid, iso, monthLabel, weekdayLabels } from '../services/dates';
import { useSettings } from '../services/settings';
import { EntryCard } from '../components/EntryCard';

export function CalendarPage({ onOpenEntry, onNew }) {
  const { settings } = useSettings();
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(iso(now));

  const entries = useLiveQuery(() => db.entries.toArray(), []) || [];
  const photos = useLiveQuery(() => db.photos.toArray(), []) || [];

  const byDate = useMemo(() => {
    const map = {};
    for (const e of entries) (map[e.date] ||= []).push(e);
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    }
    return map;
  }, [entries]);

  const photosByEntry = useMemo(() => {
    const map = {};
    for (const p of photos) (map[p.entryId] ||= []).push(p);
    return map;
  }, [photos]);

  const weeks = buildMonthGrid(cursor.y, cursor.m, settings.weekStartsOn);
  const today = iso(now);
  const dayEntries = byDate[selected] || [];

  const move = (delta) => {
    setCursor(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  return (
    <div className="pb-32">
      <header className="px-4 pt-[max(env(safe-area-inset-top),16px)]">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-soft">{cursor.y}</span>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Previous month" onClick={() => move(-1)} className="text-soft">
              <ChevronLeft size={20} />
            </button>
            <h1 className="font-serif text-[26px] font-semibold">{monthLabel(cursor.y, cursor.m)}</h1>
            <button type="button" aria-label="Next month" onClick={() => move(1)} className="text-soft">
              <ChevronRight size={20} />
            </button>
          </div>
          <span className="w-5" />
        </div>

        <div className="mt-4 grid grid-cols-7">
          {weekdayLabels(settings.weekStartsOn).map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-semibold text-soft">
              {d[0]}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-y-1">
          {weeks.flat().map((d, i) => {
            const key = iso(d);
            const inMonth = d.getMonth() === cursor.m;
            const dayEntries2 = byDate[key] || [];
            const isSel = key === selected;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(key)}
                className="relative mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full"
              >
                <span
                  className={`absolute inset-0 rounded-full ${
                    isSel ? 'ring-2 ring-accent' : ''
                  } ${key === today && !isSel ? 'border border-ink/25' : ''}`}
                />
                <span
                  className={`relative text-[14px] ${
                    inMonth ? 'text-ink' : 'text-soft/40'
                  } ${key === today ? 'font-bold' : ''}`}
                >
                  {d.getDate()}
                </span>
                <span className="relative mt-[3px] flex h-[5px] gap-[3px]">
                  {dayEntries2.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="h-[5px] w-[5px] rounded-full"
                      style={{ backgroundColor: moodOf(e.mood)?.color || 'var(--ink-soft)' }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <section className="mt-6 px-4">
        <h2 className="mb-3 font-serif text-[19px] font-semibold italic">
          <span className="highlight">
            {new Date(selected + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </span>
        </h2>
        {dayEntries.length > 0 ? (
          <div className="space-y-4">
            {dayEntries.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                photos={photosByEntry[e.id] || []}
                onOpen={onOpenEntry}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="card-shell px-4 py-8 text-center">
            <p className="text-[14px] text-soft">Nothing written on this day.</p>
            <button
              type="button"
              onClick={() => onNew(selected)}
              className="mt-4 rounded-xl bg-navy px-6 py-2.5 text-[14px] font-semibold text-navy-ink"
            >
              Write about this day
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
