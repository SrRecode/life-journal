import { PhotoImg } from './ui';

const ROTATIONS = [-3.5, 1.8, -1.4, 2.6];

export function PhotoCollage({ photos = [], max = 3, className = '' }) {
  if (!photos.length) return null;
  const shown = photos.slice(0, max);
  const extra = photos.length - shown.length;
  return (
    <div className={`relative flex items-start justify-center ${className}`}>
      <div className="flex items-start">
        {shown.map((ph, i) => (
          <div
            key={ph.id ?? i}
            className={`relative rounded-[3px] bg-white p-[5px] pb-[18px] shadow-[0_2px_8px_rgba(20,20,20,0.18)] ${
              i > 0 ? '-ml-3' : ''
            }`}
            style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)` }}
          >
            {i === 1 && (
              <span className="absolute -top-2.5 left-1/2 z-10 h-[18px] w-[42px] -translate-x-1/2 -rotate-3 rounded-[1px] bg-[#f3cf23]/55" />
            )}
            <PhotoImg
              photo={ph}
              className="h-[122px] w-[96px] rounded-[1px] object-cover"
            />
          </div>
        ))}
      </div>
      {extra > 0 && (
        <span className="absolute bottom-0 right-1 rounded-full bg-[#182340] px-2 py-[3px] text-[11px] font-semibold text-white">
          +{extra} photos
        </span>
      )}
    </div>
  );
}
