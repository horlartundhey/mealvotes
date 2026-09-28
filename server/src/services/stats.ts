import { lagosHour } from '../lib/lagos';
import { addDays } from '../lib/lagos';
import { MealHistory, Vote, VotingRound, type HistoryDoc, type RoundDoc, type VoteDoc } from '../models/Voting';
import { currentStreak } from './rules';

const XP_PER_VOTE = 10;
const XP_PER_LEVEL = 50;

export const BADGES = [
  { id: 'first-ladle', name: 'First Ladle', emoji: '🥄', description: 'Cast your first vote' },
  { id: 'early-bird', name: 'Early Bird', emoji: '🌅', description: 'Vote before 8:00 AM' },
  { id: 'oga-decider', name: 'Oga Decider', emoji: '👑', description: 'Back the winning meal 5 times' },
  { id: 'standoff-survivor', name: 'Standoff Survivor', emoji: '⚔️', description: 'Vote through a tie-break round' },
  { id: 'chop-master', name: 'Chop Master', emoji: '🔥', description: 'Reach a 7-day household streak' },
] as const;

function bestStreak(dates: string[]) {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Everything is derived from votes and history, so there's no extra state to keep in sync. */
export async function getStats(householdId: unknown, participantId: unknown, today: string) {
  const [history, myVotes, rounds] = await Promise.all([
    MealHistory.find({ householdId }, { date: 1 }).lean<HistoryDoc[]>(),
    Vote.find({ participantId }).lean<VoteDoc[]>(),
    VotingRound.find({ householdId, status: 'COMPLETED' }).lean<RoundDoc[]>(),
  ]);

  const dates = history.map((h) => h.date);
  const streak = currentStreak(dates, today);
  const best = bestStreak(dates);
  const xp = myVotes.length * XP_PER_VOTE;

  const myRoundIds = new Set(myVotes.map((v) => String(v.roundId)));
  const backedWinner = rounds.filter(
    (r) =>
      r.selectionMethod === 'MAJORITY' &&
      (r.finalVotes ?? []).some((v) => String(v.participantId) === String(participantId) && String(v.mealId) === String(r.winnerMealId)),
  ).length;
  const votedInTiebreak = rounds.some((r) => r.roundNumber >= 2 && myRoundIds.has(String(r._id)));

  const earned: Record<string, boolean> = {
    'first-ladle': myVotes.length >= 1,
    'early-bird': myVotes.some((v) => lagosHour(v.firstVotedAt ?? v.createdAt) < 8),
    'oga-decider': backedWinner >= 5,
    'standoff-survivor': votedInTiebreak,
    'chop-master': best >= 7,
  };

  return {
    streak,
    bestStreak: best,
    votesCast: myVotes.length,
    xp,
    level: 1 + Math.floor(xp / XP_PER_LEVEL),
    xpIntoLevel: xp % XP_PER_LEVEL,
    xpPerLevel: XP_PER_LEVEL,
    decidedMeals: dates.length,
    badges: BADGES.map((b) => ({ ...b, earned: earned[b.id] })),
  };
}
