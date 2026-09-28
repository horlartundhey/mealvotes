import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type HistoryDay } from '../lib/api';
import { categoryMeta } from '../lib/theme';
import { Loading, Logo, Page, Panel } from '../components/ui';

const lagosToday = () => new Date(Date.now() + 3600_000).toISOString().slice(0, 10);
const shiftMonth = (month: string, by: number) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + by, 1)).toISOString().slice(0, 7);
};
const monthLabel = (month: string) =>
  new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-NG', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function History() {
  const { householdId = '' } = useParams();
  const today = lagosToday();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [picked, setPicked] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({ queryKey: ['history', householdId, month], queryFn: () => api.getHistory(householdId, month) });
  const byDate = useMemo(() => new Map((data?.days ?? []).map((d) => [d.date, d])), [data]);

  // Monday-first grid with leading blanks
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const dateOf = (day: number) => `${month}-${String(day).padStart(2, '0')}`;
  const detail = picked ? byDate.get(picked) : undefined;

  return (
    <Page wide>
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <Link to={`/household/${householdId}`} className="text-sm font-bold underline">← Home</Link>
      </div>

      <h1 className="font-display text-4xl font-extrabold tracking-tight">Chop log</h1>
      <p className="mb-5 font-bold">{data ? `${data.days.length} meal${data.days.length === 1 ? '' : 's'} decided in ${monthLabel(month)}` : ' '}</p>

      <div className="mb-4 flex items-center justify-between">
        <button aria-label="Previous month" className="chunk font-display size-11 cursor-pointer rounded-xl bg-white text-xl font-extrabold" onClick={() => { setMonth(shiftMonth(month, -1)); setPicked(null); }}>‹</button>
        <h2 className="font-display text-2xl font-extrabold">{monthLabel(month)}</h2>
        <button aria-label="Next month" disabled={month >= today.slice(0, 7)} className="chunk font-display size-11 cursor-pointer rounded-xl bg-white text-xl font-extrabold disabled:opacity-40" onClick={() => { setMonth(shiftMonth(month, 1)); setPicked(null); }}>›</button>
      </div>

      {isLoading ? <Loading label="Opening the log…" /> : error ? <Panel>{error.message}</Panel> : (
        <>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-extrabold uppercase">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="font-display">{d}</span>)}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => day === null ? <span key={`b${i}`} /> : <Day key={day} day={day} date={dateOf(day)} entry={byDate.get(dateOf(day))} isToday={dateOf(day) === today} active={picked === dateOf(day)} onPick={() => setPicked(dateOf(day))} />)}
          </div>

          {data?.days.length === 0 && (
            <Panel className="mt-6 text-center">
              <p className="text-4xl" aria-hidden>📖</p>
              <p className="font-display mt-1 text-xl font-extrabold">Nothing here yet</p>
              <p className="text-sm">Every meal the household decides lands here as a sticker.</p>
              <Link to={`/household/${householdId}/today`} className="mt-3 inline-block font-bold underline">Vote on today's meal</Link>
            </Panel>
          )}

          {detail && (
            <Panel className="mt-6">
              <p className="font-display text-sm font-extrabold tracking-wide text-pepper uppercase">
                {new Date(`${detail.date}T12:00:00Z`).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
              </p>
              <h3 className="font-display text-2xl font-extrabold">{detail.meal.name}</h3>
              <p className="text-sm font-bold">
                {detail.selectionMethod === 'MAJORITY' ? `Won with ${detail.winningVotes} votes` : 'Picked by the pot after a second tie'}
              </p>
            </Panel>
          )}
        </>
      )}
    </Page>
  );
}

function Day({ day, entry, isToday, active, onPick }: { day: number; date: string; entry?: HistoryDay; isToday: boolean; active: boolean; onPick: () => void }) {
  const cat = entry ? categoryMeta[entry.meal.category] : null;
  return (
    <button
      disabled={!entry}
      onClick={onPick}
      aria-label={entry ? `${day}: ${entry.meal.name}` : `${day}: no meal`}
      className={`relative aspect-square overflow-hidden rounded-xl border-[3px] text-left ${entry ? 'cursor-pointer border-char' : 'border-char/20'} ${isToday ? 'ring-4 ring-plantain' : ''} ${active ? 'ring-4 ring-pepper' : ''}`}
      style={{ background: cat?.color ?? 'transparent' }}
    >
      {entry?.meal.image?.url && <img src={entry.meal.image.url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />}
      <span className="font-display absolute top-0.5 left-1 rounded bg-cream/90 px-1 text-[10px] leading-tight font-extrabold">{day}</span>
      {entry && !entry.meal.image?.url && (
        <span className="font-display absolute inset-x-0 bottom-0.5 line-clamp-2 px-1 text-[9px] leading-tight font-extrabold" style={{ color: cat!.ink }}>{entry.meal.name}</span>
      )}
      {entry?.selectionMethod === 'FALLBACK' && <span className="absolute right-0.5 bottom-0.5 text-[10px]" title="Chosen by the pot">🎲</span>}
    </button>
  );
}
