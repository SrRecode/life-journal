import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, MapPin, Pencil, Share2, Star, Trash2 } from 'lucide-react';
import { db, deleteEntry } from '../database/db';
import { fmtDayMeta, longDateTime, wordCount } from '../services/dates';
import { useToast } from '../services/settings';
import { MoodBadge, TagPill } from '../components/mood';
import { PhotoCollage } from '../components/PhotoCollage';
import { Confirm, Sheet } from '../components/ui';

export function EntryDetail({ entryId, onClose, onEdit }) {
  const { showToast } = useToast();
  const [confirm, setConfirm] = useState(false);

  const entry = useLiveQuery(() => db.entries.get(entryId), [entryId]);
  const photos = useLiveQuery(
    () => db.photos.where('entryId').equals(entryId).toArray(),
    [entryId]
  ) || [];

  if (!entry) return null;

  const toggleFav = async () => {
    await db.entries.update(entryId, { favourite: !entry.favourite, editedAt: Date.now() });
    showToast(entry.favourite ? 'Removed from favourites' : 'Added to favourites');
  };

  const share = async () => {
    const text = `${entry.title || 'Journal entry'}\n\n${entry.body || ''}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: entry.title, text });
        return;
      } catch (e) {
        if (e?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
    } catch {
      showToast('Could not share');
    }
  };

  const remove = async () => {
    await deleteEntry(entryId);
    showToast('Entry deleted');
    onClose();
  };

  const paragraphs = (entry.body || '').split(/\n{2,}/).filter(Boolean);
  const words = wordCount(entry.body || '');

  return (
    <Sheet className="anim-sheet">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg px-3 pb-2.5 pt-[max(env(safe-area-inset-top),14px)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleFav}
            aria-label="Favourite"
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              entry.favourite ? 'bg-accent text-accent-ink' : 'border border-line text-ink'
            }`}
          >
            <Star size={17} fill={entry.favourite ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={share}
            aria-label="Share"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink"
          >
            <Share2 size={17} />
          </button>
          <button
            type="button"
            onClick={() => setConfirm(true)}
            aria-label="Delete"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      <article className="mx-auto max-w-[560px] px-4 pb-32 pt-6">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] text-soft">{fmtDayMeta(entry.date, entry.time)}</span>
          <MoodBadge mood={entry.mood} />
        </div>

        {entry.title && (
          <h1 className="mt-3 font-serif text-[30px] font-semibold italic leading-[1.15]">
            <span className="highlight">{entry.title}</span>
          </h1>
        )}

        {entry.location && (
          <p className="mt-2.5 flex items-center gap-1 text-[13.5px] text-soft">
            <MapPin size={14} /> {entry.location}
          </p>
        )}

        {photos.length > 0 && <PhotoCollage photos={photos} className="my-7" max={3} />}

        <div className="mt-5 space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[16.5px] leading-[1.75] text-ink">
              {p}
            </p>
          ))}
        </div>

        {entry.tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {entry.tags.map((t) => (
              <TagPill key={t} tag={t} />
            ))}
          </div>
        )}

        <p className="mt-8 text-[12.5px] leading-relaxed text-soft">
          Written {longDateTime(entry.createdAt)}
          {entry.editedAt ? ` · Edited ${longDateTime(entry.editedAt)}` : ''}
          {words > 0 ? ` · ${words} words` : ''}
        </p>

        <button
          type="button"
          onClick={() => onEdit(entry)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-[15px] font-semibold text-accent-ink"
        >
          <Pencil size={17} />
          Edit entry
        </button>
      </article>

      <Confirm
        open={confirm}
        title="Delete this entry?"
        body="It will be removed from this phone. Photos in it are deleted too."
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
    </Sheet>
  );
}
