import Dexie from 'dexie';
import { fmtTime } from '../services/dates';

export const db = new Dexie('life-journal');

db.version(1).stores({
  entries: '++id, date, createdAt, mood, favourite, *tags',
  photos: '++id, entryId, createdAt',
  settings: 'key',
});

export const MOODS = [
  { id: 'calm', label: 'Calm', color: 'var(--color-mood-calm)' },
  { id: 'happy', label: 'Happy', color: 'var(--color-mood-happy)' },
  { id: 'proud', label: 'Proud', color: 'var(--color-mood-proud)' },
  { id: 'tired', label: 'Tired', color: 'var(--color-mood-tired)' },
  { id: 'low', label: 'Low', color: 'var(--color-mood-low)' },
];

export const moodOf = (id) => MOODS.find((m) => m.id === id) || null;

export function defaultTime() {
  return fmtTime(new Date());
}

export async function saveEntry({ id, title, body, date, time, mood, tags, location, favourite, photos }) {
  const now = Date.now();
  let entryId = id;
  if (id) {
    const existing = await db.entries.get(id);
    await db.entries.update(id, {
      title, body, date, time, mood, tags, location,
      favourite: !!favourite,
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
    });
  } else {
    entryId = await db.entries.add({
      title, body, date, time, mood, tags, location,
      favourite: !!favourite,
      createdAt: now,
      updatedAt: now,
    });
  }
  if (photos) {
    const keep = new Set(photos.filter((p) => p.id).map((p) => p.id));
    const existing = await db.photos.where('entryId').equals(entryId).toArray();
    for (const ph of existing) {
      if (!keep.has(ph.id)) await db.photos.delete(ph.id);
    }
    for (const ph of photos) {
      if (!ph.id) {
        await db.photos.add({
          entryId,
          blob: ph.blob,
          width: ph.width,
          height: ph.height,
          createdAt: now,
        });
      }
    }
  }
  return entryId;
}

export async function deleteEntry(id) {
  await db.photos.where('entryId').equals(id).delete();
  await db.entries.delete(id);
}
