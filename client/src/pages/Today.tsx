import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ApiError, api, type Breakdown, type Meal, type Today as TodayData } from '../lib/api';
import { fireConfetti } from '../lib/confetti';
import { ChopCard } from '../components/ChopCard';
import { Countdown } from '../components/Countdown';
import { Pot } from '../components/Pot';
import { Token } from '../components/Token';
import { Button, ErrorNote, Loading, Logo, Page, Panel } from '../components/ui';

const asChop = (m: Meal) => ({ ...m, imageUrl: m.image?.url });
const revealedKey = (roundId: string) => `mv_revealed_${roundId}`;
const seen = (roundId: string) => {
  try {
    return localStorage.getItem(revealedKey(roundId)) === '1';
  } catch {
    return false;
  }
};
const markSeen = (roundId: string) => {
  try {
    localStorage.setItem(revealedKey(roundId), '1');
  } catch {
    /* private mode: the reveal simply replays */
  }
};

const prettyDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

export default function Today() {
  const { householdId = '' } = useParams();
  const qc = useQueryClient();
  const key = ['today', householdId];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: key,
    queryFn: () => api.getToday(householdId),
    // Live while open (who has voted, early close); no need to poll once decided.
    refetchInterval: (q) => (q.state.data?.round.isOpen || q.state.data?.round.status === 'CALCULATING' ? 4000 : false),
  });

  const vote = useMutation({
    mutationFn: ({ roundId, mealId }: { roundId: string; mealId: string }) => api.vote(householdId, roundId, mealId),
    onSuccess: (fresh) => qc.setQueryData(key, fresh),
    onError: () => refetch(), // e.g. voting just closed: show the real state
  });
  const another = useMutation({
    mutationFn: () => api.startAnotherRound(householdId),
    onSuccess: (fresh) => qc.setQueryData(key, fresh),
  });

  if (isLoading) return <Page wide><Loading label="Checking the pot…" /></Page>;
  if (error instanceof ApiError && error.status === 401) return <Navigate to="/" replace />;
  if (error || !data) {
    return (
      <Page wide>
        <Panel>
          <p className="font-bold">{error?.message ?? 'Something went wrong'}</p>
          <Link className="mt-3 block underline" to={`/household/${householdId}/meals`}>Open the meal library</Link>
        </Panel>
      </Page>
    );
  }

  const { round } = data;
  return (
    <Page wide>
      <div className="mb-5 flex items-center justify-between">
        <Logo />
        <Link to={`/household/${householdId}`} className="text-sm font-bold underline">← Home</Link>
      </div>

      <Header data={data} onDone={refetch} />
      {data.previousRounds.length > 0 && <Standoff data={data} />}
      {data.libraryShortfall && (
        <p className="mb-4 rounded-xl border-[3px] border-plantain bg-plantain/30 px-3 py-2 text-sm font-bold">
          Only {round.options.length} eligible meal{round.options.length === 1 ? '' : 's'} today. Add or switch on more in the meal library.
        </p>
      )}

      {round.isOpen ? (
        <Voting data={data} onPick={(mealId) => vote.mutate({ roundId: round.id, mealId })} pending={vote.isPending} error={vote.error?.message} />
      ) : round.status === 'COMPLETED' && data.result ? (
        <Result data={data} />
      ) : round.status === 'NO_VOTES' ? (
        <Panel className="text-center">
          <Pot open={false} size={130} />
          <h2 className="font-display mt-2 text-2xl font-extrabold">Nobody voted 😅</h2>
          <p className="mt-1 mb-4">The pot won't pick for you. {data.canStartAnotherRound ? 'Start a fresh round with new options.' : 'Ask the owner to start a fresh round.'}</p>
          {data.canStartAnotherRound && (
            <Button onClick={() => another.mutate()} disabled={another.isPending}>{another.isPending ? 'Stirring…' : 'Start another round'}</Button>
          )}
          {another.error && <div className="mt-3"><ErrorNote message={another.error.message} /></div>}
        </Panel>
      ) : (
        <Loading label="Counting the votes…" />
      )}
    </Page>
  );
}

function Header({ data, onDone }: { data: TodayData; onDone: () => void }) {
  const { round } = data;
  const standoff = round.roundNumber > 1;
  return (
    <div className="ankara mb-5 rounded-3xl border-[3px] border-char p-1 shadow-chunk">
      <div className="rounded-[20px] bg-cream p-4 text-center">
        <p className="font-display text-sm font-extrabold tracking-wide text-pepper uppercase">
          {prettyDate(data.date)}
          {standoff && ` · Round ${round.roundNumber}`}
        </p>
        <h1 className="font-display text-4xl leading-none font-extrabold tracking-tight">
          {standoff && round.isOpen ? 'Kitchen standoff!' : 'What are we chopping?'}
        </h1>
        <div className="mt-3">
          {round.isOpen ? (
            <Countdown closesAt={round.closesAt} serverTime={data.serverTime} onDone={onDone} />
          ) : (
            <span className="font-display inline-block rounded-full border-[3px] border-char bg-cream-deep px-4 py-1.5 text-sm font-extrabold">Voting closed</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Voting({ data, onPick, pending, error }: { data: TodayData; onPick: (mealId: string) => void; pending: boolean; error?: string }) {
  const { round } = data;
  const { householdId = '' } = useParams();
  const voted = round.myVoteMealId !== null;
  return (
    <>
      <div className="mb-5">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {round.members.map((m) => (
            <div key={m.id} className="flex flex-col items-center gap-1">
              <Token name={m.displayName} voted={m.hasVoted} />
              <span className="max-w-16 truncate text-xs font-bold">{m.displayName}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-sm font-bold">
          {round.votedCount} of {round.eligibleCount} voted · picks stay secret until voting closes
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {round.options.map((o) => (
          <ChopCard
            key={o.meal.id}
            meal={asChop(o.meal)}
            letter={o.letter}
            selected={round.myVoteMealId === o.meal.id}
            dimmed={voted && round.myVoteMealId !== o.meal.id}
            onPick={pending ? undefined : () => onPick(o.meal.id)}
          />
        ))}
      </div>

      <div className="mt-6 text-center" aria-live="polite">
        {error && <ErrorNote message={error} />}
        {!error && (
          <motion.p key={String(voted)} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-lg font-extrabold">
            {voted ? 'Ladle dropped! 🥄 You can change your pick until voting closes.' : 'Tap a card to drop your ladle 🥄'}
          </motion.p>
        )}
        {round.eligibleCount < 2 && (
          <p className="mt-2 text-sm">
            Only you're here so far. <Link className="font-bold underline" to={`/household/${householdId}`}>Share the invite</Link> so others can vote.
          </p>
        )}
      </div>
    </>
  );
}

function Result({ data }: { data: TodayData }) {
  const { round, result } = data;
  const [phase, setPhase] = useState<'suspense' | 'revealed'>(() => (seen(round.id) ? 'revealed' : 'suspense'));
  const fired = useRef(false);

  useEffect(() => {
    if (phase !== 'suspense') return;
    const id = setTimeout(() => setPhase('revealed'), 1700);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'revealed' && !fired.current) {
      fired.current = true;
      if (!seen(round.id)) fireConfetti();
      markSeen(round.id);
    }
  }, [phase, round.id]);

  if (!result) return null;
  const votersOf = (id: string) => result.breakdown.find((b: Breakdown) => b.mealId === id)?.voters ?? [];

  return (
    <AnimatePresence mode="wait">
      {phase === 'suspense' ? (
        <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10 text-center">
          <Pot open={false} size={220} />
          <p className="font-display mt-4 animate-pulse text-3xl font-extrabold">Lifting the lid…</p>
        </motion.div>
      ) : (
        <motion.div key="r" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Panel className="mb-6 text-center">
            <Pot open size={150} />
            <p className="font-display text-sm font-extrabold tracking-wide text-ugu uppercase">Today's meal 🎉</p>
            <h2 className="font-display text-4xl leading-tight font-extrabold tracking-tight">{result.winner.name}</h2>
            <p className="mt-2 font-bold">
              {result.selectionMethod === 'MAJORITY'
                ? `${result.winningVotes} of ${result.eligibleCount} voted for this. Enjoy your meal! 🍽️`
                : 'Still tied after two rounds, so the pot chose.'}
            </p>
            {result.selectionMethod === 'FALLBACK' && (
              <p className="mx-auto mt-2 max-w-sm text-sm">
                It picked the tied meal you've gone longest without —{' '}
                {result.daysSinceEaten === null ? "you've never had it together yet." : `${result.daysSinceEaten} days since you last ate it.`}
              </p>
            )}
          </Panel>

          <h3 className="font-display mb-3 text-center text-xl font-extrabold">Who picked what</h3>
          <div className="grid gap-5 sm:grid-cols-3">
            {round.options.map((o) => (
              <ChopCard
                key={o.meal.id}
                meal={asChop(o.meal)}
                letter={o.letter}
                winner={o.meal.id === result.winner.id}
                dimmed={o.meal.id !== result.winner.id}
                voters={votersOf(o.meal.id)}
              />
            ))}
          </div>
          <p className="mt-6 text-center text-sm font-bold">Come back tomorrow for a fresh set of three.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Standoff({ data }: { data: TodayData }) {
  const prev = data.previousRounds[data.previousRounds.length - 1];
  const nameOf = (id: string) => prev.options.find((m) => m.id === id)?.name ?? 'Meal';
  return (
    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="mb-5 rounded-2xl border-[3px] border-char bg-plantain p-4">
      <p className="font-display text-lg font-extrabold">⚔️ Round {prev.roundNumber} ended without a majority</p>
      <p className="mb-2 text-sm font-medium">Fresh options below. Here's how the first round split:</p>
      <ul className="grid gap-1 text-sm font-bold">
        {prev.breakdown.map((b) => (
          <li key={b.mealId}>
            {nameOf(b.mealId)}: {b.voters.length ? b.voters.join(', ') : 'no votes'}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
