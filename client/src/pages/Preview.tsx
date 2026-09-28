import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { ChopCard, type ChopMeal } from '../components/ChopCard';
import { Pot } from '../components/Pot';
import { Token } from '../components/Token';
import { Button, Logo, Page, Panel } from '../components/ui';

const meals: ChopMeal[] = [
  { id: 'a', name: 'Jollof Rice + Chicken', category: 'rice', prepMinutes: 75, estimatedCost: 9000 },
  { id: 'b', name: 'Beans + Fried Plantain', category: 'beans', prepMinutes: 90, estimatedCost: 5000 },
  { id: 'c', name: 'Yam + Egg Sauce', category: 'yam', prepMinutes: 40, estimatedCost: 4500 },
];

// Simulated household: two teammates who have "voted" already, plus you.
const others = [
  { name: 'Olatunde', pick: 'a' },
  { name: 'Bola', pick: 'c' },
];

type Phase = 'voting' | 'suspense' | 'revealed';

/** Static design sandbox for the Naija-kitchen look. Not wired to the API. */
export default function Preview() {
  const [pick, setPick] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('voting');

  const tally = (id: string) => [...others.filter((o) => o.pick === id).map((o) => o.name), ...(pick === id ? ['You'] : [])];
  const winnerId = meals.map((m) => m.id).sort((x, y) => tally(y).length - tally(x).length)[0];

  const reveal = () => {
    setPhase('suspense');
    setTimeout(() => {
      setPhase('revealed');
      const end = Date.now() + 900;
      (function frame() {
        confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.8 }, colors: ['#D9381E', '#F28C1B', '#FFC933', '#2E8B57'] });
        confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.8 }, colors: ['#D9381E', '#F28C1B', '#FFC933', '#2E8B57'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }, 1600);
  };

  const reset = () => {
    setPick(null);
    setPhase('voting');
  };

  return (
    <Page wide>
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <span className="font-display rounded-full border-[3px] border-char bg-plantain px-3 py-1 text-xs font-extrabold uppercase">Design preview</span>
      </div>

      <div className="ankara mb-6 rounded-3xl border-[3px] border-char p-1 shadow-chunk">
        <div className="rounded-[20px] bg-cream p-4 text-center">
          <p className="font-display text-sm font-extrabold tracking-wide text-pepper uppercase">Monday · 28 September</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">What are we chopping?</h1>
          <p className="mt-1 text-sm font-bold">
            {phase === 'voting' ? 'Voting closes at 12:00 PM, or when everyone has voted' : 'Voting closed'}
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-center gap-3">
        <Token name="Olatunde" voted />
        <Token name="Bola" voted />
        <Token name="You" voted={pick !== null ? true : false} />
        <p className="ml-2 text-sm font-bold">{2 + (pick ? 1 : 0)} of 3 voted</p>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'suspense' ? (
          <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10 text-center">
            <Pot open={false} size={220} />
            <p className="font-display mt-4 animate-pulse text-3xl font-extrabold">Lifting the lid…</p>
          </motion.div>
        ) : (
          <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-5 sm:grid-cols-3">
            {meals.map((m, i) => (
              <ChopCard
                key={m.id}
                meal={m}
                letter={'ABC'[i]}
                selected={phase === 'voting' && pick === m.id}
                winner={phase === 'revealed' && m.id === winnerId}
                dimmed={phase === 'revealed' && m.id !== winnerId}
                voters={phase === 'revealed' ? tally(m.id) : undefined}
                onPick={phase === 'voting' ? () => setPick(m.id) : undefined}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 grid gap-3">
        {phase === 'voting' && (
          <>
            <p className="text-center text-sm font-bold">
              {pick ? 'Vote locked in. You can change it until voting closes.' : 'Tap a card to drop your ladle 🥄'}
            </p>
            <Button disabled={!pick} onClick={reveal}>
              Simulate: everyone voted → reveal
            </Button>
          </>
        )}
        {phase === 'revealed' && (
          <Panel className="text-center">
            <Pot open size={150} />
            <h2 className="font-display text-3xl font-extrabold">{meals.find((m) => m.id === winnerId)?.name}</h2>
            <p className="font-bold">{tally(winnerId).length} of 3 votes · Enjoy your meal! 🍽️</p>
            <div className="mt-4">
              <Button variant="secondary" onClick={reset}>Play again</Button>
            </div>
          </Panel>
        )}
      </div>
    </Page>
  );
}
