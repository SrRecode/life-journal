import { useState } from 'react';
import { Delete, Fingerprint } from 'lucide-react';

export function PinDots({ length = 4, filled = 0, error = false, dark = false }) {
  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length }, (_, i) => (
        <span
          key={i}
          className={`h-3 w-3 rounded-full transition-colors ${
            error
              ? 'bg-danger'
              : i < filled
                ? 'bg-accent'
                : dark
                  ? 'bg-white/25'
                  : 'bg-line'
          }`}
        />
      ))}
    </div>
  );
}

export function PinPad({
  length = 4,
  onComplete,
  onChange,
  error = false,
  onBiometric,
  biometricLabel,
  dark = false,
}) {
  const [pin, setPin] = useState('');

  const push = (d) => {
    if (error) return;
    const next = (pin + d).slice(0, length);
    setPin(next);
    onChange?.(next.length);
    if (next.length === length) {
      onComplete(next);
      setTimeout(() => {
        setPin('');
        onChange?.(0);
      }, 250);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const keyClass = dark
    ? 'bg-white/10 text-white hover:bg-white/15 active:bg-white/20'
    : 'bg-card/80 text-ink hover:bg-card active:bg-field';

  return (
    <div className="mx-auto w-[264px]">
      <div className="grid grid-cols-3 gap-3">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => push(k)}
            className={`flex h-16 items-center justify-center rounded-2xl text-[24px] font-medium transition-colors ${keyClass}`}
          >
            {k}
          </button>
        ))}
        <span className="flex h-16 items-center justify-center">
          {onBiometric && (
            <button
              type="button"
              onClick={onBiometric}
              aria-label={biometricLabel}
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                dark ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-card/80'
              }`}
            >
              <Fingerprint size={27} />
            </button>
          )}
        </span>
        <button
          type="button"
          onClick={() => push('0')}
          className={`flex h-16 items-center justify-center rounded-2xl text-[24px] font-medium transition-colors ${keyClass}`}
        >
          0
        </button>
        <button
          type="button"
          onClick={() => setPin((p) => p.slice(0, -1))}
          aria-label="Delete"
          className={`flex h-16 items-center justify-center rounded-2xl transition-colors ${
            dark ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-card/80'
          }`}
        >
          <Delete size={22} />
        </button>
      </div>
    </div>
  );
}
