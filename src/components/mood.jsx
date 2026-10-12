import { MOODS, moodOf } from '../database/db';

export function MoodBadge({ mood, className = '' }) {
  const m = moodOf(mood);
  if (!m) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold text-[#1d1c19] ${className}`}
      style={{ backgroundColor: m.color }}
    >
      {m.label}
    </span>
  );
}

export function MoodPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOODS.map((m) => {
        const on = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(on ? null : m.id)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              on ? 'border-transparent text-[#1d1c19]' : 'border-line text-ink'
            }`}
            style={on ? { backgroundColor: m.color } : undefined}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

export function TagPill({ tag, onClick, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-[3px] text-[12px] text-soft">
      #{tag}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${tag}`} className="text-ink">
          ×
        </button>
      )}
      {onClick && <button type="button" onClick={onClick} className="-my-1 -mr-1 h-full w-full" />}
    </span>
  );
}
