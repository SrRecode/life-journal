import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { PhotoImg } from '../components/ui';
import { TopBarActions } from '../components/TopBar';

const TABS = ['Favourites', 'Places', 'People'];

export function PhotosPage({ onOpenEntry, onSettings }) {
  const [tab, setTab] = useState('Favourites');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const photos = useLiveQuery(() => db.photos.toArray(), []) || [];
  const entries = useLiveQuery(() => db.entries.toArray(), []) || [];

  const entryMap = useMemo(() => Object.fromEntries(entries.map((e) => [e.id, e])), [entries]);

  const groups = useMemo(() => {
    const list = [...photos].sort((a, b) => b.createdAt - a.createdAt);
    const map = new Map();
    for (const p of list) {
      const e = entryMap[p.entryId];
      if (tab === 'Favourites' && !e?.favourite) continue;
      if (tab === 'Places' || tab === 'People') continue;
      const d = new Date(p.createdAt);
      const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(p);
    }
    return [...map.entries()];
  }, [photos, entryMap, tab]);

  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [...photos]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((p) => {
        const e = entryMap[p.entryId];
        if (!e) return false;
        return (
          (e.title || '').toLowerCase().includes(q) ||
          (e.body || '').toLowerCase().includes(q) ||
          (e.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      });
  }, [photos, entryMap, query]);

  return (
    <div className="pb-32">
      <header className="px-4 pt-[max(env(safe-area-inset-top),16px)]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-[34px] font-semibold leading-none">Photos</h1>
            <p className="mt-1.5 text-[13px] text-soft">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'} on this phone
            </p>
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
            placeholder="Search by title, writing or tags…"
            className="mt-3 w-full rounded-xl border border-line bg-field px-4 py-2.5 text-[15px] outline-none focus:border-ink/30"
          />
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
                tab === t ? 'bg-navy text-navy-ink' : 'border border-line text-soft'
              } ${t !== 'Favourites' ? 'opacity-60' : ''}`}
            >
              {t}
              {t !== 'Favourites' && <span className="ml-1 text-[10px]">SOON</span>}
            </button>
            ))}
          </div>
        )}
      </header>

      {searching ? (
        <section className="mt-5 px-4">
          {query.trim() === '' ? (
            <p className="py-12 text-center text-[14px] text-soft">
              Type to find photos from matching entries.
            </p>
          ) : searchMatches.length === 0 ? (
            <p className="py-12 text-center text-[14px] text-soft">Nothing matches “{query}”.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {searchMatches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenEntry(p.entryId)}
                  className="aspect-square overflow-hidden rounded-md bg-field"
                >
                  <PhotoImg photo={p} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {tab === 'Favourites' ? (
            groups.length === 0 ? (
              <p className="px-4 py-12 text-center text-[14px] text-soft">
                No photos in favourites yet. Star an entry to keep its photos here.
              </p>
            ) : (
              <div className="mt-5 space-y-6 px-4">
                {groups.map(([label, list]) => (
                  <section key={label}>
                    <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-soft">
                      {label}
                    </h2>
                    <div className="grid grid-cols-3 gap-1.5">
                      {list.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onOpenEntry(p.entryId)}
                          className="aspect-square overflow-hidden rounded-md bg-field"
                        >
                          <PhotoImg photo={p} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )
          ) : (
            <div className="px-4 py-12 text-center">
              <p className="text-[15px] font-medium">Coming soon</p>
              <p className="mt-1 text-[13.5px] text-soft">
                {tab} will group your journal photos automatically.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
