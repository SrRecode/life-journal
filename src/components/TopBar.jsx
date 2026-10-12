import { Search, Settings as SettingsIcon, X } from 'lucide-react';

export function TopBarActions({ searching = false, onSearchToggle, onSettings, showSearch = true }) {
  return (
    <div className="flex gap-2 pt-1">
      {showSearch && (
        <button
          type="button"
          aria-label={searching ? 'Close search' : 'Search'}
          onClick={onSearchToggle}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-card active:bg-field"
        >
          {searching ? <X size={18} /> : <Search size={18} />}
        </button>
      )}
      <button
        type="button"
        aria-label="Settings"
        onClick={onSettings}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-card active:bg-field"
      >
        <SettingsIcon size={18} />
      </button>
    </div>
  );
}
