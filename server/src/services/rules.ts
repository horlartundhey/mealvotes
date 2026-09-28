/**
 * Pure business rules. No database, no clock reads: everything is passed in, so it is trivial to unit test.
 * The server is the only place these run, so a client can never influence a result.
 */
import { addDays, atLagos, daysBetween, lagosDate, lagosHour } from '../lib/lagos';

export const OPTIONS_PER_ROUND = 3;
export const MAX_REGULAR_ROUNDS = 2; // a tie in round 2 goes to the deterministic fallback

/** More than half of eligible voters: floor(n / 2) + 1 */
export const calculateMajority = (eligibleVoters: number) => Math.floor(eligibleVoters / 2) + 1;

export interface Tally {
  mealId: string;
  count: number;
}

export const tallyVotes = (votes: { mealId: string }[]): Tally[] => {
  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v.mealId, (counts.get(v.mealId) ?? 0) + 1);
  return [...counts].map(([mealId, count]) => ({ mealId, count })).sort((a, b) => b.count - a.count);
};

/** The meal holding a strict majority, or null. */
export function determineWinner(votes: { mealId: string }[], eligibleVoters: number) {
  const tally = tallyVotes(votes);
  const top = tally[0];
  if (top && top.count >= calculateMajority(eligibleVoters)) return { mealId: top.mealId, votes: top.count };
  return null;
}

export const shouldTriggerRevote = (roundNumber: number) => roundNumber < MAX_REGULAR_ROUNDS;

/**
 * Voting window. Opened before `lateStartHour` (default 11:00 Lagos) → closes at `closeHour` (12:00).
 * Opened later → there wouldn't be a fair window, so it closes 2 hours after opening instead.
 * Either way it closes as soon as everyone has voted (handled by the settle step).
 */
export function computeClosesAt(now: Date, opts: { closeHour: number; lateStartHour: number }) {
  const date = lagosDate(now);
  if (lagosHour(now) < opts.lateStartHour) return atLagos(date, opts.closeHour);
  return new Date(now.getTime() + 2 * 60 * 60 * 1000);
}

export interface CandidateMeal {
  id: string;
  category: string;
  mealType?: string;
  isActive: boolean;
}

export interface HistoryEntry {
  mealId: string;
  date: string; // YYYY-MM-DD
}

/** Won within the cooldown window? With a 5-day cooldown, a Sept 20 winner returns on Sept 25. */
export const isInCooldown = (mealId: string, today: string, history: HistoryEntry[], cooldownDays: number) =>
  history.some((h) => h.mealId === mealId && h.date < today && daysBetween(h.date, today) < cooldownDays);

export function isMealEligible(
  meal: CandidateMeal,
  ctx: { today: string; history: HistoryEntry[]; cooldownDays: number; exclude?: Set<string> },
) {
  return (
    meal.isActive &&
    (meal.mealType ?? 'major') === 'major' &&
    !ctx.exclude?.has(meal.id) &&
    !isInCooldown(meal.id, ctx.today, ctx.history, ctx.cooldownDays)
  );
}

/** mulberry32: small seeded PRNG so tests can be deterministic. */
export const seededRng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function shuffle<T>(items: T[], rng: () => number) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks up to three eligible meals, preferring a different category for each so the choice is real.
 * Returns fewer than three (never invents meals) when the library runs short.
 */
export function generateMealOptions(
  meals: CandidateMeal[],
  ctx: { today: string; history: HistoryEntry[]; cooldownDays: number; exclude?: Set<string>; rng?: () => number; count?: number },
): CandidateMeal[] {
  const count = ctx.count ?? OPTIONS_PER_ROUND;
  const pool = shuffle(meals.filter((m) => isMealEligible(m, ctx)), ctx.rng ?? Math.random);
  const picked: CandidateMeal[] = [];
  const usedCategories = new Set<string>();

  for (const m of pool) {
    if (picked.length === count) break;
    if (!usedCategories.has(m.category)) {
      picked.push(m);
      usedCategories.add(m.category);
    }
  }
  for (const m of pool) {
    if (picked.length === count) break;
    if (!picked.includes(m)) picked.push(m);
  }
  return picked;
}

/**
 * Deterministic tie-break: of the tied meals, the one that has gone longest without being eaten.
 * A meal never eaten counts as longest. Remaining ties fall back to option order, so the result is explainable.
 */
export function selectFallbackMeal(
  tied: { mealId: string; order: number }[],
  today: string,
  history: HistoryEntry[],
): { mealId: string; daysSinceEaten: number | null } {
  const lastEaten = new Map<string, string>();
  for (const h of history) {
    if (!lastEaten.has(h.mealId) || h.date > lastEaten.get(h.mealId)!) lastEaten.set(h.mealId, h.date);
  }
  const ranked = tied
    .map((t) => {
      const last = lastEaten.get(t.mealId);
      return { ...t, days: last ? daysBetween(last, today) : Number.POSITIVE_INFINITY };
    })
    .sort((a, b) => b.days - a.days || a.order - b.order);
  const best = ranked[0];
  return { mealId: best.mealId, daysSinceEaten: Number.isFinite(best.days) ? best.days : null };
}

/** Consecutive decided days ending today (or yesterday, so the streak doesn't reset before today's vote). */
export function currentStreak(decidedDates: string[], today: string) {
  const set = new Set(decidedDates);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
