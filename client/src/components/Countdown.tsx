import { useEffect, useState } from 'react';

const fmt = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * Ticks against the SERVER's clock (offset measured from serverTime), so a wrong phone clock can't
 * make voting look open or closed when it isn't.
 */
export function Countdown({ closesAt, serverTime, onDone }: { closesAt: string; serverTime: string; onDone?: () => void }) {
  const [offset] = useState(() => Date.parse(serverTime) - Date.now());
  const [left, setLeft] = useState(() => Date.parse(closesAt) - (Date.now() + offset));

  useEffect(() => {
    const tick = () => {
      const remaining = Date.parse(closesAt) - (Date.now() + offset);
      setLeft(remaining);
      if (remaining <= 0) onDone?.();
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closesAt, offset, onDone]);

  const urgent = left < 5 * 60_000;
  const closeTime = new Date(closesAt).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' });

  return (
    <div
      className={`font-display inline-flex items-center gap-2 rounded-full border-[3px] border-char px-4 py-1.5 text-sm font-extrabold ${
        urgent ? 'animate-pulse bg-pepper text-cream' : 'bg-plantain'
      }`}
    >
      <span aria-hidden>⏳</span>
      <span>{left > 0 ? `Closes in ${fmt(left)}` : 'Closing…'}</span>
      <span className="font-medium opacity-70">· {closeTime}</span>
    </div>
  );
}
