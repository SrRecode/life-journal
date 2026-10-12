import { fmtDayMeta, wordCount } from '../services/dates';
import { MoodBadge, TagPill } from './mood';
import { PhotoCollage } from './PhotoCollage';

export function EntryCard({ entry, photos = [], onOpen, rail = true, compact = false }) {
  return (
    <div className="relative">
      {rail && (
        <>
          <span className="absolute bottom-[-18px] left-[7px] top-[-18px] w-px bg-line" />
          <span className="absolute left-[4px] top-[18px] h-[7px] w-[7px] rounded-full bg-ink" />
        </>
      )}
      <button
        type="button"
        onClick={() => onOpen?.(entry.id)}
        className={`card-shell paper block px-4 pb-4 pt-3 text-left transition-shadow hover:shadow-[0_2px_14px_rgba(25,25,25,0.06)] ${
          rail ? 'ml-5 w-[calc(100%-1.25rem)]' : 'w-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12.5px] text-soft">{fmtDayMeta(entry.date, entry.time)}</span>
          <MoodBadge mood={entry.mood} />
        </div>
        {entry.title && (
          <h3 className="mt-1.5 font-serif text-[21px] font-semibold italic leading-tight">
            <span className="highlight">{entry.title}</span>
          </h3>
        )}
        {photos.length > 0 && <PhotoCollage photos={photos} className="my-4" />}
        {entry.body && !compact && (
          <p className="mt-2 line-clamp-3 text-[14.5px] leading-[1.6] text-ink/90">{entry.body}</p>
        )}
        {entry.body && compact && (
          <p className="mt-2 line-clamp-2 text-[14.5px] leading-[1.6] text-ink/90">{entry.body}</p>
        )}
        {entry.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {entry.tags.map((t) => (
              <TagPill key={t} tag={t} />
            ))}
          </div>
        )}
      </button>
    </div>
  );
}

export function EmptyJournal({ onStart }) {
  return (
    <div className="card-shell mx-4 mt-10 px-6 py-10 text-center">
      <div className="mx-auto mb-5 flex w-fit flex-col items-center">
        <span className="h-3 w-14 rounded-t-sm bg-accent/60" />
        <span className="h-20 w-24 rotate-[-4deg] rounded-sm bg-card shadow-[0_2px_10px_rgba(20,20,20,0.12)]" />
        <span className="-mt-14 h-20 w-24 rotate-[3deg] rounded-sm bg-card shadow-[0_2px_10px_rgba(20,20,20,0.12)]" />
      </div>
      <h2 className="font-serif text-[24px] font-semibold italic leading-tight">
        <span className="highlight">Your days, kept on your phone.</span>
      </h2>
      <p className="mx-auto mt-2 max-w-[260px] text-[13.5px] leading-snug text-soft">
        Write your first entry — it saves on this phone, no account needed.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-6 rounded-xl bg-navy px-8 py-3 text-[15px] font-semibold text-navy-ink"
      >
        Start writing
      </button>
    </div>
  );
}

export function previewWords(entry) {
  return wordCount(entry.body || '');
}
