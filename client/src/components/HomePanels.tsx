import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Pot } from './Pot';
import { Panel } from './ui';

/** Home-screen summary of today's pot. Opening it is what creates today's round on first visit. */
export function TodayCard({ householdId }: { householdId: string }) {
  const { data, error } = useQuery({
    queryKey: ['today', householdId],
    queryFn: () => api.getToday(householdId),
    refetchInterval: (q) => (q.state.data?.round.isOpen ? 8000 : false),
  });

  const r = data?.round;
  const decided = r?.status === 'COMPLETED' && data?.result;
  const title = error ? 'The pot needs ingredients' : decided ? data!.result!.winner.name : r?.status === 'NO_VOTES' ? 'Nobody voted yet' : r?.isOpen ? (r.myVoteMealId ? 'Your ladle is in 🥄' : 'Voting is open!') : 'Warming up…';

  return (
    <Panel className="text-center">
      <Pot open={Boolean(decided)} size={130} />
      <p className="font-display mt-2 text-sm font-extrabold tracking-wide text-pepper uppercase">Today's meal</p>
      <h2 className="font-display text-2xl leading-tight font-extrabold">{title}</h2>
      {error && <p className="mt-1 text-sm">{error.message}</p>}
      {r?.isOpen && (
        <p className="mt-1 text-sm font-bold">
          {r.votedCount} of {r.eligibleCount} voted{r.roundNumber > 1 ? ` · round ${r.roundNumber}` : ''}
        </p>
      )}
      {decided && <p className="mt-1 text-sm font-bold">Decided by {data!.result!.selectionMethod === 'MAJORITY' ? `${data!.result!.winningVotes} of ${data!.result!.eligibleCount} votes` : 'the pot'} 🎉</p>}
      <Link
        to={`/household/${householdId}/today`}
        className="chunk font-display mt-4 block rounded-2xl bg-pepper px-5 py-3.5 text-lg font-extrabold text-cream"
      >
        {decided ? 'See the result' : r?.isOpen && r.myVoteMealId ? 'Change my vote' : 'Vote now'}
      </Link>
    </Panel>
  );
}

/** Household streak, personal XP/level, and badges: all derived from real votes on the server. */
export function StatsPanel({ householdId }: { householdId: string }) {
  const { data } = useQuery({ queryKey: ['stats', householdId], queryFn: () => api.getStats(householdId), refetchInterval: 30_000 });
  if (!data) return null;

  return (
    <Panel className="mt-6">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <motion.div
            animate={data.streak > 0 ? { scale: [1, 1.12, 1], rotate: [-3, 3, -3] } : {}}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="text-5xl"
            aria-hidden
          >
            {data.streak > 0 ? '🔥' : '🪵'}
          </motion.div>
        </div>
        <div className="flex-1">
          <p className="font-display text-3xl leading-none font-extrabold">{data.streak}-day streak</p>
          <p className="text-sm font-bold">
            {data.streak > 0 ? 'Keep the pot burning: decide a meal every day.' : 'Decide today’s meal to light the fire.'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-lg font-extrabold">Level {data.level}</p>
          <p className="text-xs font-bold">{data.xpIntoLevel}/{data.xpPerLevel} XP</p>
        </div>
        <div className="mt-1 h-4 overflow-hidden rounded-full border-[3px] border-char bg-cream-deep" role="progressbar" aria-valuenow={data.xpIntoLevel} aria-valuemax={data.xpPerLevel} aria-label="XP to next level">
          <motion.div className="h-full bg-ugu" initial={{ width: 0 }} animate={{ width: `${(data.xpIntoLevel / data.xpPerLevel) * 100}%` }} transition={{ type: 'spring', stiffness: 80 }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {data.badges.map((b) => (
          <div key={b.id} title={`${b.name}: ${b.description}`} className={`grid place-items-center rounded-xl border-[3px] border-char py-2 ${b.earned ? 'bg-plantain' : 'bg-cream-deep opacity-50 grayscale'}`}>
            <span className="text-2xl" aria-hidden>{b.emoji}</span>
            <span className="sr-only">{b.name}{b.earned ? ' (earned)' : ' (locked)'}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-bold">
        {data.badges.filter((b) => b.earned).length} of {data.badges.length} badges · hover for details
      </p>
    </Panel>
  );
}
