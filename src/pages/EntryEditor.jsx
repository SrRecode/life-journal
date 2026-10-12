import { useEffect, useRef, useState } from 'react';
import { ImagePlus, MapPin, X } from 'lucide-react';
import { db, saveEntry, defaultTime } from '../database/db';
import { fileToPhoto } from '../services/photos';
import { longDate } from '../services/dates';
import { useToast } from '../services/settings';
import { MoodPicker, TagPill } from '../components/mood';
import { PhotoImg, Sheet } from '../components/ui';

export function EntryEditor({ entry, date, onClose, onSaved }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState(entry?.title || '');
  const [body, setBody] = useState(entry?.body || '');
  const [mood, setMood] = useState(entry?.mood ?? null);
  const [tags, setTags] = useState(entry?.tags || []);
  const [tagDraft, setTagDraft] = useState('');
  const [location, setLocation] = useState(entry?.location || '');
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const entryDate = entry?.date || date;
  const entryTime = entry?.time || defaultTime();

  useEffect(() => {
    if (!entry?.id) return;
    let alive = true;
    db.photos
      .where('entryId')
      .equals(entry.id)
      .toArray()
      .then((rows) => {
        if (alive) setPhotos((prev) => (prev.some((p) => p.id) ? prev : rows));
      });
    return () => {
      alive = false;
    };
  }, [entry?.id]);

  const addTag = () => {
    const t = tagDraft.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagDraft('');
  };

  const onFiles = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    const added = [];
    for (const f of files.slice(0, 8)) {
      try {
        const { blob, width, height } = await fileToPhoto(f);
        added.push({ blob, width, height, createdAt: Date.now() + added.length, isNew: true });
      } catch {
        showToast('Could not read that image');
      }
    }
    setPhotos((p) => [...p, ...added]);
  };

  const removePhoto = async (i) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  };

  const save = async () => {
    if (!title.trim() && !body.trim() && photos.length === 0) {
      showToast('Nothing to save yet');
      onClose();
      return;
    }
    setBusy(true);
    try {
      const id = await saveEntry({
        id: entry?.id,
        date: entryDate,
        time: entryTime,
        title: title.trim(),
        body: body.trim(),
        mood,
        tags,
        location: location.trim(),
        favourite: entry?.favourite ?? false,
        createdAt: entry?.createdAt,
      });
      const existing = await db.photos.where('entryId').equals(id).toArray();
      const keepIds = new Set(photos.filter((p) => !p.isNew).map((p) => p.id));
      for (const p of existing) {
        if (!keepIds.has(p.id)) await db.photos.delete(p.id);
      }
      for (const p of photos) {
        if (p.isNew) {
          await db.photos.add({ entryId: id, blob: p.blob, width: p.width, height: p.height, createdAt: p.createdAt });
        }
      }
      showToast('Saved on this phone');
      onSaved?.(id);
    } catch {
      showToast('Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet>
      <div className="sticky top-0 z-10 mx-auto flex max-w-md items-center justify-between border-b border-line bg-bg px-4 pb-3 pt-[max(env(safe-area-inset-top),16px)]">
        <button type="button" onClick={onClose} className="text-[15px] text-soft">
          Cancel
        </button>
        <span className="text-[11.5px] text-soft">Saved on this phone</span>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="text-[15px] font-semibold disabled:opacity-50"
        >
          Save
        </button>
      </div>

      <div className="mx-auto max-w-md px-4 pb-28 pt-5">
        <div className="flex items-center gap-1.5 text-[13.5px] text-soft">
          <span className="font-medium text-ink">{longDate(entryDate)}</span>
          <span>·</span>
          <span>{entryTime}</span>
        </div>

        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={1}
          placeholder="Give the day a name"
          className="mt-3 w-full resize-none bg-transparent font-serif text-[27px] font-semibold italic leading-tight outline-none placeholder:text-soft/50"
        />
        {title.trim() && (
          <div className="-mt-2 mb-1 h-[18px]">
            <span className="highlight text-[11px] text-soft">{title.length} chars</span>
          </div>
        )}

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="How was your day?"
          className="mt-2 min-h-[220px] w-full resize-none bg-transparent text-[16px] leading-[1.7] outline-none placeholder:text-soft/60"
        />

        <div className="mt-6">
          <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-soft">
            How did it feel?
          </p>
          <MoodPicker value={mood} onChange={setMood} />
        </div>

        <div className="mt-6">
          <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-soft">
            Photos
          </p>
          <div className="flex flex-wrap gap-2.5">
            {photos.map((p, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg bg-field">
                <PhotoImg photo={p} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-soft"
            >
              <ImagePlus size={19} />
              <span className="text-[10.5px]">Add</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
        </div>

        <div className="mt-6">
          <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-soft">
            Tags
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((t) => (
              <TagPill key={t} tag={t} onRemove={() => setTags(tags.filter((x) => x !== t))} />
            ))}
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              placeholder="Add tag"
              className="min-w-[110px] flex-1 border-b border-line bg-transparent py-1 text-[13.5px] outline-none placeholder:text-soft/70"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 border-b border-line pb-2">
          <MapPin size={16} className="text-soft" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add a place"
            className="flex-1 bg-transparent py-1 text-[14.5px] outline-none placeholder:text-soft/70"
          />
        </div>
      </div>
    </Sheet>
  );
}
