import { motion } from 'framer-motion';
import { ButtonLink, Logo } from '../components/ui';
import { Pot } from '../components/Pot';

export default function Landing() {
  return (
    <div className="min-h-dvh bg-cream">
      <div className="ankara h-5 border-b-[3px] border-char" aria-hidden />
      <main className="mx-auto flex max-w-md flex-col gap-8 px-4 py-8">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="text-center">
          <Pot open={false} size={170} />
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-display mt-4 text-5xl leading-[0.95] font-extrabold tracking-tight"
          >
            What are we <span className="text-pepper">chopping</span> today?
          </motion.h1>
          <p className="mx-auto mt-4 max-w-xs text-lg">
            Stop spending 30 minutes deciding. Invite your people, everybody votes, the pot decides.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <ButtonLink to="/create">Start a household</ButtonLink>
          <p className="text-center text-sm font-medium">
            Got an invite link? Just open it — no sign-up needed.
          </p>
        </div>

        <ol className="grid gap-3 text-sm font-bold">
          {[
            ['1', 'Create a household', 'bg-plantain'],
            ['2', 'Share the link on WhatsApp', 'bg-ugu text-white'],
            ['3', 'Three meals, one vote each', 'bg-palmoil'],
            ['4', 'Lift the lid on the winner', 'bg-pepper text-cream'],
          ].map(([n, text, cls]) => (
            <li key={n} className="flex items-center gap-3 rounded-2xl border-[3px] border-char bg-white p-3 shadow-chunk-sm">
              <span className={`font-display grid size-8 place-items-center rounded-full border-[3px] border-char text-base font-extrabold ${cls}`}>
                {n}
              </span>
              {text}
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
