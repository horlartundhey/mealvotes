import { describe, expect, it } from 'vitest';
import {
  calculateMajority,
  computeClosesAt,
  currentStreak,
  determineWinner,
  generateMealOptions,
  isInCooldown,
  seededRng,
  selectFallbackMeal,
  shouldTriggerRevote,
} from '../src/services/rules';

const meal = (id: string, category = 'rice', extra = {}) => ({ id, category, isActive: true, mealType: 'major', ...extra });
const opts = { closeHour: 12, lateStartHour: 11 };

describe('majority', () => {
  it('is more than half of eligible voters', () => {
    expect([1, 2, 3, 4, 5, 6].map(calculateMajority)).toEqual([1, 2, 2, 3, 3, 4]);
  });

  it('determineWinner needs a strict majority of ELIGIBLE voters, not of votes cast', () => {
    expect(determineWinner([{ mealId: 'a' }, { mealId: 'a' }, { mealId: 'b' }], 3)).toEqual({ mealId: 'a', votes: 2 });
    expect(determineWinner([{ mealId: 'a' }, { mealId: 'a' }], 3)).toEqual({ mealId: 'a', votes: 2 }); // non-voter doesn't block
    expect(determineWinner([{ mealId: 'a' }, { mealId: 'b' }, { mealId: 'c' }], 3)).toBeNull();
    expect(determineWinner([{ mealId: 'a' }], 3)).toBeNull(); // 1 of 3 is not a majority
    expect(determineWinner([{ mealId: 'a' }, { mealId: 'a' }, { mealId: 'b' }, { mealId: 'b' }], 4)).toBeNull();
  });

  it('only the first tie triggers a revote', () => {
    expect(shouldTriggerRevote(1)).toBe(true);
    expect(shouldTriggerRevote(2)).toBe(false);
  });
});

describe('voting window (Africa/Lagos)', () => {
  it('opened before 11:00 closes at 12:00 that day', () => {
    expect(computeClosesAt(new Date('2026-09-28T08:00:00+01:00'), opts).toISOString()).toBe(new Date('2026-09-28T12:00:00+01:00').toISOString());
    expect(computeClosesAt(new Date('2026-09-28T10:59:00+01:00'), opts).getTime()).toBe(new Date('2026-09-28T12:00:00+01:00').getTime());
  });

  it('opened at or after 11:00 gets a 2 hour window', () => {
    const t = new Date('2026-09-28T11:00:00+01:00');
    expect(computeClosesAt(t, opts).getTime()).toBe(t.getTime() + 2 * 3600_000);
    const late = new Date('2026-09-28T18:30:00+01:00');
    expect(computeClosesAt(late, opts).getTime()).toBe(late.getTime() + 2 * 3600_000);
  });
});

describe('meal repetition', () => {
  const history = [{ mealId: 'jollof', date: '2026-09-20' }];
  it('a Sept 20 winner is blocked Sept 21–24 and back on Sept 25 (5-day cooldown)', () => {
    expect(isInCooldown('jollof', '2026-09-21', history, 5)).toBe(true);
    expect(isInCooldown('jollof', '2026-09-24', history, 5)).toBe(true);
    expect(isInCooldown('jollof', '2026-09-25', history, 5)).toBe(false);
  });

  it('cooldown is configurable', () => {
    expect(isInCooldown('jollof', '2026-09-23', history, 2)).toBe(false);
    expect(isInCooldown('jollof', '2026-09-23', history, 7)).toBe(true);
  });
});

describe('generateMealOptions', () => {
  const library = [
    meal('r1', 'rice'), meal('r2', 'rice'), meal('r3', 'rice'),
    meal('b1', 'beans'), meal('s1', 'swallow'), meal('y1', 'yam'),
    meal('off', 'pasta', { isActive: false }),
    meal('snack', 'other', { mealType: 'light' }),
  ];
  const base = { today: '2026-09-28', history: [], cooldownDays: 5 };

  it('returns three distinct meals from different categories when possible', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const picked = generateMealOptions(library, { ...base, rng: seededRng(seed) });
      expect(picked).toHaveLength(3);
      expect(new Set(picked.map((m) => m.id)).size).toBe(3);
      expect(new Set(picked.map((m) => m.category)).size).toBe(3);
    }
  });

  it('never picks inactive, non-major, cooling-down or excluded meals', () => {
    const history = [{ mealId: 'r1', date: '2026-09-27' }];
    for (let seed = 1; seed <= 50; seed++) {
      const ids = generateMealOptions(library, { ...base, history, exclude: new Set(['b1']), rng: seededRng(seed) }).map((m) => m.id);
      for (const banned of ['off', 'snack', 'r1', 'b1']) expect(ids).not.toContain(banned);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generateMealOptions(library, { ...base, rng: seededRng(7) }).map((m) => m.id);
    const b = generateMealOptions(library, { ...base, rng: seededRng(7) }).map((m) => m.id);
    expect(a).toEqual(b);
  });

  it('returns as many as possible when the library is short, and none when empty', () => {
    expect(generateMealOptions([meal('a'), meal('b')], base)).toHaveLength(2);
    expect(generateMealOptions([], base)).toHaveLength(0);
  });

  it('falls back to repeating a category rather than returning fewer meals', () => {
    const riceOnly = [meal('r1'), meal('r2'), meal('r3'), meal('r4')];
    expect(generateMealOptions(riceOnly, base)).toHaveLength(3);
  });
});

describe('selectFallbackMeal', () => {
  const tied = [
    { mealId: 'jollof', order: 0 },
    { mealId: 'beans', order: 1 },
    { mealId: 'yam', order: 2 },
  ];
  it('picks the meal eaten longest ago', () => {
    const history = [
      { mealId: 'jollof', date: '2026-09-23' }, // 5 days
      { mealId: 'beans', date: '2026-09-25' }, // 3 days
      { mealId: 'yam', date: '2026-09-19' }, // 9 days
    ];
    expect(selectFallbackMeal(tied, '2026-09-28', history)).toEqual({ mealId: 'yam', daysSinceEaten: 9 });
  });

  it('a never-eaten meal counts as longest, and uses the most recent time a meal was eaten', () => {
    const history = [
      { mealId: 'jollof', date: '2026-09-01' },
      { mealId: 'jollof', date: '2026-09-26' },
      { mealId: 'beans', date: '2026-09-10' },
    ];
    expect(selectFallbackMeal(tied, '2026-09-28', history)).toEqual({ mealId: 'yam', daysSinceEaten: null });
    expect(selectFallbackMeal(tied.slice(0, 2), '2026-09-28', history).mealId).toBe('beans');
  });

  it('breaks remaining ties by option order, never randomly', () => {
    expect(selectFallbackMeal(tied, '2026-09-28', []).mealId).toBe('jollof');
  });
});

describe('currentStreak', () => {
  it('counts consecutive days, surviving until today is decided', () => {
    expect(currentStreak(['2026-09-25', '2026-09-26', '2026-09-27'], '2026-09-28')).toBe(3);
    expect(currentStreak(['2026-09-26', '2026-09-27', '2026-09-28'], '2026-09-28')).toBe(3);
    expect(currentStreak(['2026-09-20', '2026-09-27'], '2026-09-28')).toBe(1);
    expect(currentStreak(['2026-09-20'], '2026-09-28')).toBe(0);
  });
});
