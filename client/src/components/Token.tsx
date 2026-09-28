import { motion } from 'framer-motion';
import { colorFor } from '../lib/theme';

/** A member's avatar "ladle token". Ticked once they've voted; the vote itself stays secret until close. */
export function Token({ name, voted, size = 48 }: { name: string; voted?: boolean; size?: number }) {
  return (
    <div className="relative" title={name} style={{ width: size, height: size }}>
      <div
        className="font-display grid size-full place-items-center rounded-full border-[3px] border-char font-extrabold text-cream"
        style={{ background: colorFor(name), fontSize: size * 0.42, opacity: voted === false ? 0.55 : 1 }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      {voted && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 14 }}
          className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border-2 border-char bg-ugu text-[11px] text-white"
        >
          ✓
        </motion.span>
      )}
    </div>
  );
}
