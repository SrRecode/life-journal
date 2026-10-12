import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { PhotoImg } from '../components/ui';

const TABS = ['Favourites', 'Places', 'People'];

export function PhotosPage({ onOpenEntry }) {
  const [tab, setTab] = useState('Favourites');
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

  return (
    <div className="pb-32">
      <header className="px-4 pt-[max(env(safe-area-inset-top),16px)]">
        <h1 className="font-serif text-[34px] font-semibold leading-none">Photos</h1>
        <p className="mt-1.5 text-[13px] text-soft">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'} on this phone
        </p>

        <div className="mt-4 flex gap-2">
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
      </header>

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
    </div>
  );
}
