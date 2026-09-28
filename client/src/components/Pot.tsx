import { motion } from 'framer-motion';

/** The reveal pot: closed and wobbling while voting is open; the lid lifts (with steam) when results land. */
export function Pot({ open, size = 180 }: { open: boolean; size?: number }) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size * 0.85 }}>
      {open &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute bottom-[55%] text-3xl"
            style={{ left: `${28 + i * 20}%` }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -70, opacity: [0, 0.9, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }}
            aria-hidden
          >
            ☁️
          </motion.span>
        ))}
      <svg viewBox="0 0 200 170" className="size-full overflow-visible" role="img" aria-label="Cooking pot">
        <motion.g
          animate={open ? { y: -34, rotate: -14, x: 22 } : { y: 0, rotate: 0, x: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 12 }}
          style={{ transformOrigin: '100px 70px' }}
        >
          <ellipse cx="100" cy="66" rx="70" ry="14" fill="#A92510" stroke="#231A14" strokeWidth="6" />
          <rect x="92" y="42" width="16" height="20" rx="8" fill="#FFC933" stroke="#231A14" strokeWidth="6" />
        </motion.g>
        <motion.g
          animate={open ? { rotate: 0 } : { rotate: [-1.5, 1.5, -1.5] }}
          transition={open ? {} : { duration: 1.4, repeat: Infinity }}
          style={{ transformOrigin: '100px 150px' }}
        >
          <path d="M30 70 h140 v50 a40 40 0 0 1 -40 40 h-60 a40 40 0 0 1 -40 -40z" fill="#231A14" />
          <path d="M30 70 h140 v50 a40 40 0 0 1 -40 40 h-60 a40 40 0 0 1 -40 -40z" fill="#F28C1B" stroke="#231A14" strokeWidth="6" />
          <circle cx="36" cy="92" r="9" fill="none" stroke="#231A14" strokeWidth="6" />
          <circle cx="164" cy="92" r="9" fill="none" stroke="#231A14" strokeWidth="6" />
          <path d="M55 110 q15 -10 30 0 t30 0 t30 0" fill="none" stroke="#FFC933" strokeWidth="6" strokeLinecap="round" />
        </motion.g>
      </svg>
    </div>
  );
}
