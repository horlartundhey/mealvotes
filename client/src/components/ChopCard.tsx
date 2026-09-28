import { motion } from 'framer-motion';
import { categoryMeta, type Category } from '../lib/theme';
import { Token } from './Token';

export interface ChopMeal {
  id: string;
  name: string;
  category: Category;
  prepMinutes: number;
  estimatedCost: number;
  imageUrl?: string | null;
}

interface Props {
  meal: ChopMeal;
  letter: string; // A / B / C
  selected?: boolean;
  dimmed?: boolean;
  winner?: boolean;
  voters?: string[]; // revealed only after close
  onPick?: () => void;
}

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

/** Meals are collectible "Chop Cards": category colour frame, photo (or a patterned placeholder), stat chips. */
export function ChopCard({ meal, letter, selected, dimmed, winner, voters, onPick }: Props) {
  const cat = categoryMeta[meal.category];
  return (
    <motion.button
      type="button"
      onClick={onPick}
      disabled={!onPick}
      aria-pressed={selected}
      whileHover={onPick ? { y: -4, rotate: -0.6 } : undefined}
      whileTap={onPick ? { scale: 0.97 } : undefined}
      animate={{ opacity: dimmed ? 0.45 : 1, scale: winner ? 1.04 : 1, y: selected ? -6 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative block w-full overflow-hidden rounded-3xl border-[3px] border-char bg-white text-left ${
        onPick ? 'cursor-pointer' : 'cursor-default'
      } ${selected ? 'ring-4 ring-plantain' : ''}`}
      style={{ boxShadow: winner ? `0 6px 0 0 var(--color-ugu)` : selected ? '0 8px 0 0 var(--color-char)' : '0 5px 0 0 var(--color-char)' }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: cat.color }}>
        {meal.imageUrl ? (
          <img src={meal.imageUrl} alt={meal.name} loading="lazy" className="size-full object-cover" />
        ) : (
          <Placeholder color={cat.color} ink={cat.ink} />
        )}
        <span
          className="font-display absolute top-3 left-3 grid size-9 place-items-center rounded-full border-[3px] border-char bg-cream text-lg font-extrabold"
        >
          {letter}
        </span>
        <span
          className="font-display absolute top-3 right-3 rounded-full border-[3px] border-char px-3 py-0.5 text-xs font-extrabold tracking-wide uppercase"
          style={{ background: cat.color, color: cat.ink }}
        >
          {cat.label}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-display text-xl leading-tight font-extrabold">{meal.name}</h3>
        <div className="mt-2 flex flex-wrap gap-2 text-sm font-bold">
          <span className="rounded-full bg-cream-deep px-3 py-1">⏱ {meal.prepMinutes} min</span>
          <span className="rounded-full bg-cream-deep px-3 py-1">≈ {naira(meal.estimatedCost)}</span>
        </div>

        {voters && voters.length > 0 && (
          <div className="mt-3 flex -space-x-2">
            {voters.map((v, i) => (
              <motion.div key={v} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 * i, type: 'spring' }}>
                <Token name={v} size={34} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className="font-display absolute right-3 bottom-3 rounded-full border-[3px] border-char bg-plantain px-3 py-1 text-sm font-extrabold"
        >
          Your pick 🥄
        </motion.div>
      )}
      {winner && (
        <div className="font-display absolute right-3 bottom-3 rounded-full border-[3px] border-char bg-ugu px-3 py-1 text-sm font-extrabold text-white">
          Today's meal 🎉
        </div>
      )}
    </motion.button>
  );
}

/** Shown until a real photo exists (missing image or slow network): the Ankara motif over the category colour. */
function Placeholder({ color, ink }: { color: string; ink: string }) {
  return (
    <div className="relative grid size-full place-items-center" style={{ background: color }}>
      <svg viewBox="0 0 80 80" className="absolute inset-0 size-full opacity-25" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="3" fill={ink} />
            <circle cx="0" cy="0" r="2" fill={ink} />
            <circle cx="16" cy="16" r="2" fill={ink} />
          </pattern>
        </defs>
        <rect width="80" height="80" fill="url(#dots)" />
      </svg>
      <span className="relative text-6xl drop-shadow" aria-hidden>
        🍽️
      </span>
    </div>
  );
}
