import { toPublic } from '../routes/meals';
import { Household, type HouseholdDoc } from '../models/Household';
import { Meal, type MealDoc } from '../models/Meal';
import { Participant, type ParticipantDoc } from '../models/Participant';
import { Vote, VotingRound, type RoundDoc } from '../models/Voting';
import { lagosDate } from '../lib/lagos';
import { OPTIONS_PER_ROUND } from './rules';

const CLOSED_STATES = ['COMPLETED', 'NO_MAJORITY', 'NO_VOTES', 'EXPIRED', 'CALCULATING'];

/**
 * What a member is allowed to see. While a round is OPEN we reveal only WHO has voted, never WHAT they picked
 * or any tallies, so nobody just follows the crowd. The full breakdown appears once the round closes.
 */
export async function buildToday(household: HouseholdDoc, me: ParticipantDoc, round: RoundDoc, now: Date) {
  const disabled = new Set((household.disabledMealIds ?? []).map(String));
  const rounds = await VotingRound.find({ householdId: household._id, date: round.date }).sort({ roundNumber: 1 }).lean<RoundDoc[]>();
  const mealIds = new Set<string>();
  rounds.forEach((r) => {
    r.options.forEach((o) => mealIds.add(String(o.mealId)));
    if (r.winnerMealId) mealIds.add(String(r.winnerMealId));
  });
  const [meals, people, liveVotes] = await Promise.all([
    Meal.find({ _id: { $in: [...mealIds] } }).lean<MealDoc[]>(),
    Participant.find({ householdId: household._id }).lean<ParticipantDoc[]>(),
    Vote.find({ roundId: round._id }).lean(),
  ]);
  const mealById = new Map(meals.map((m) => [String(m._id), toPublic(m, disabled)]));
  const nameById = new Map(people.map((p) => [String(p._id), p.displayName]));
  const active = people.filter((p) => p.status === 'ACTIVE');
  const isOpen = round.status === 'OPEN';

  const breakdownOf = (r: RoundDoc) =>
    r.options.map((o) => ({
      mealId: String(o.mealId),
      voters: (r.finalVotes ?? []).filter((v) => String(v.mealId) === String(o.mealId)).map((v) => nameById.get(String(v.participantId)) ?? 'Someone'),
    }));

  const votedIds = isOpen ? new Set(liveVotes.map((v) => String(v.participantId))) : new Set((round.finalVotes ?? []).map((v) => String(v.participantId)));
  const myVote = liveVotes.find((v) => String(v.participantId) === String(me._id));
  const winner = round.winnerMealId ? mealById.get(String(round.winnerMealId)) : null;

  return {
    date: round.date,
    serverTime: now.toISOString(),
    isToday: round.date === lagosDate(now),
    round: {
      id: String(round._id),
      roundNumber: round.roundNumber,
      status: round.status,
      isOpen,
      opensAt: round.opensAt,
      closesAt: round.closesAt,
      options: [...round.options]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((o, i) => ({ letter: 'ABC'[i], meal: mealById.get(String(o.mealId)) })),
      members: active.map((p) => ({ id: String(p._id), displayName: p.displayName, hasVoted: votedIds.has(String(p._id)) })),
      votedCount: active.filter((p) => votedIds.has(String(p._id))).length,
      eligibleCount: active.length,
      myVoteMealId: myVote ? String(myVote.mealId) : null,
    },
    result:
      round.status === 'COMPLETED' && winner
        ? {
            winner,
            selectionMethod: round.selectionMethod,
            winningVotes: round.winningVotes,
            eligibleCount: round.eligibleCount,
            daysSinceEaten: round.daysSinceEaten ?? null,
            breakdown: breakdownOf(round),
          }
        : null,
    // Earlier rounds today (the "Kitchen Standoff"): closed, so their votes are now public.
    previousRounds: rounds
      .filter((r) => r.roundNumber < round.roundNumber && CLOSED_STATES.includes(r.status))
      .map((r) => ({
        roundNumber: r.roundNumber,
        status: r.status,
        options: r.options.map((o) => mealById.get(String(o.mealId))),
        breakdown: breakdownOf(r),
      })),
    canStartAnotherRound: me.role === 'owner' && round.status === 'NO_VOTES',
    libraryShortfall: round.options.length < OPTIONS_PER_ROUND,
  };
}

export async function loadHousehold(id: unknown) {
  return Household.findById(id).lean<HouseholdDoc>();
}
