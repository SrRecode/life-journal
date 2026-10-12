import { Calendar, Download, Image as ImageIcon, List, Plus } from 'lucide-react';

const TABS = [
  { id: 'timeline', label: 'Timeline', Icon: List },
  { id: 'calendar', label: 'Calendar', Icon: Calendar },
  { id: 'photos', label: 'Photos', Icon: ImageIcon },
  { id: 'backup', label: 'Backup', Icon: Download },
];

export function BottomNav({ tab, onTab, onNew }) {
  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  const Item = ({ t }) => {
    const active = tab === t.id;
    const { Icon } = t;
    return (
      <button
        type="button"
        onClick={() => onTab(t.id)}
        className="flex flex-col items-center gap-1 pb-1 pt-2"
      >
        <Icon size={21} strokeWidth={active ? 2.4 : 1.8} className={active ? 'text-ink' : 'text-soft'} />
        <span className={`text-[11px] ${active ? 'font-semibold text-ink' : 'text-soft'}`}>
          {active ? <span className="highlight">{t.label}</span> : t.label}
        </span>
      </button>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-[max(env(safe-area-inset-bottom),10px)]">
        {left.map((t) => (
          <Item key={t.id} t={t} />
        ))}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onNew}
            aria-label="New entry"
            className="relative -translate-y-4"
          >
            <span className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-[18px] bg-accent" />
            <span className="relative flex h-[54px] w-[54px] items-center justify-center rounded-[18px] bg-navy text-navy-ink shadow-[0_4px_14px_rgba(24,35,64,0.3)]">
              <Plus size={26} strokeWidth={2.4} />
            </span>
          </button>
        </div>
        {right.map((t) => (
          <Item key={t.id} t={t} />
        ))}
      </div>
    </nav>
  );
}
