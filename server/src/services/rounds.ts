import { HttpError } from '../lib/errors';
import { lagosDate } from '../lib/lagos';
import { Household, type HouseholdDoc } from '../models/Household';
import { Meal, type MealDoc } from '../models/Meal';
import { Participant, type ParticipantDoc } from '../models/Participant';
import { MealHistory, Vote, VotingRound, type HistoryDoc, type RoundDoc } from '../models/Voting';
import {
  computeClosesAt,
  determineWinner,
  generateMealOptions,
  selectFallbackMeal,
  shouldTriggerRevote,
  tallyVotes,
} from './rules';

const SETTLE_STALE_MS = 30_000;
const isDuplicateKey = (e: unknown) => (e as { code?: number })?.code === 11000;

async function activeParticipants(householdId: unknown) {
  return Participant.find({ householdId, status: 'ACTIVE' }).lean<ParticipantDoc[]>();
}

/** Meals this household may draw from: global + custom, active, and not switched off by the owner. */
async function eligibleLibrary(household: HouseholdDoc) {
  const disabled = new Set((household.disabledMealIds ?? []).map(String));
  const meals = await Meal.find({ $or: [{ householdId: null }, { householdId: household._id }], isActive: true }).lean<MealDoc[]>();
  return meals.filter((m) => !disabled.has(String(m._id)));
}

const historyEntries = async (householdId: unknown) =>
  (await MealHistory.find({ householdId }).lean<HistoryDoc[]>()).map((h) => ({ mealId: String(h.mealId), date: h.date }));

async function createRound(
  household: HouseholdDoc,
  date: string,
  roundNumber: number,
  exclude: Set<string>,
  now: Date,
  rng?: () => number,
): Promise<RoundDoc | null> {
  const [library, history] = await Promise.all([eligibleLibrary(household), historyEntries(household._id)]);
  const options = generateMealOptions(
    library.map((m) => ({ id: String(m._id), category: m.category, mealType: m.mealType, isActive: m.isActive })),
    { today: date, history, cooldownDays: household.settings?.cooldownDays ?? 5, exclude, rng },
  );
  if (options.length === 0) return null;

  try {
    const round = await VotingRound.create({
      householdId: household._id,
      date,
      roundNumber,
      opensAt: now,
      closesAt: computeClosesAt(now, {
        closeHour: household.settings?.closeHour ?? 12,
        lateStartHour: household.settings?.lateStartHour ?? 11,
      }),
      options: options.map((m, i) => ({ mealId: m.id, order: i })),
    });
    return round.toObject() as RoundDoc;
  } catch (e) {
    // Someone else created the same round a moment ago: use theirs, so everyone sees identical options.
    if (isDuplicateKey(e)) return VotingRound.findOne({ householdId: household._id, date, roundNumber }).lean<RoundDoc>();
    throw e;
  }
}

async function recordHistory(round: RoundDoc, mealId: unknown, method: 'MAJORITY' | 'FALLBACK', votes: number) {
  await MealHistory.updateOne(
    { householdId: round.householdId, date: round.date },
    { $setOnInsert: { mealId, roundId: round._id, selectionMethod: method, winningVotes: votes } },
    { upsert: true },
  );
}

/**
 * Lazily closes a round when it is due (deadline passed, or everyone has voted) and resolves it:
 * majority → winner; tie in round 1 → fresh options; tie in round 2 → deterministic fallback.
 * Safe to call on every read: a compare-and-set on `status` means only one caller resolves a round.
 */
export async function settleRound(roundId: unknown, now: Date, rng?: () => number): Promise<RoundDoc | null> {
  const round = await VotingRound.findById(roundId).lean<RoundDoc>();
  if (!round) return null;

  const stale = round.status === 'CALCULATING' && round.closedAt && now.getTime() - round.closedAt.getTime() > SETTLE_STALE_MS;
  if (round.status !== 'OPEN' && !stale) return round;

  const members = await activeParticipants(round.householdId);
  const memberIds = new Set(members.map((m) => String(m._id)));
  const cast = (await Vote.find({ roundId: round._id }).lean()).filter((v) => memberIds.has(String(v.participantId)));
  const timeUp = now >= round.closesAt;
  // Early close needs at least two people, so a lone owner can't decide for a household that hasn't joined yet.
  const everyoneVoted = members.length >= 2 && cast.length >= members.length;
  if (!stale && !timeUp && !everyoneVoted) return round;

  const claimed = await VotingRound.findOneAndUpdate(
    stale ? { _id: round._id, status: 'CALCULATING', closedAt: round.closedAt } : { _id: round._id, status: 'OPEN' },
    { status: 'CALCULATING', closedAt: now },
    { new: true },
  ).lean<RoundDoc>();
  if (!claimed) return VotingRound.findById(roundId).lean<RoundDoc>(); // lost the race; the winner resolves it

  // Re-read votes after claiming so the count is the final one.
  const finalVotes = (await Vote.find({ roundId: round._id }).lean())
    .filter((v) => memberIds.has(String(v.participantId)))
    .map((v) => ({ participantId: v.participantId, mealId: v.mealId }));
  const eligibleCount = members.length;
  const asIds = finalVotes.map((v) => ({ mealId: String(v.mealId) }));
  const common = { closedAt: now, eligibleCount, finalVotes };

  const winner = determineWinner(asIds, eligibleCount);

  // A round left over from a previous day is never re-run, but a genuine majority still counts for that day.
  if (!winner && round.date !== lagosDate(now)) {
    return VotingRound.findByIdAndUpdate(round._id, { ...common, status: 'EXPIRED' }, { new: true }).lean<RoundDoc>();
  }

  if (winner) {
    const done = await VotingRound.findByIdAndUpdate(
      round._id,
      { ...common, status: 'COMPLETED', winnerMealId: winner.mealId, selectionMethod: 'MAJORITY', winningVotes: winner.votes },
      { new: true },
    ).lean<RoundDoc>();
    await recordHistory(round, winner.mealId, 'MAJORITY', winner.votes);
    return done;
  }

  if (finalVotes.length === 0) {
    return VotingRound.findByIdAndUpdate(round._id, { ...common, status: 'NO_VOTES' }, { new: true }).lean<RoundDoc>();
  }

  if (shouldTriggerRevote(round.roundNumber)) {
    const household = await Household.findById(round.householdId).lean<HouseholdDoc>();
    const exclude = new Set(round.options.map((o) => String(o.mealId)));
    const next = household && (await createRound(household, round.date, round.roundNumber + 1, exclude, now, rng));
    if (next) {
      return VotingRound.findByIdAndUpdate(round._id, { ...common, status: 'NO_MAJORITY' }, { new: true }).lean<RoundDoc>();
    }
    // Library too small for fresh options: fall through to the fallback rather than getting stuck.
  }

  const tally = tallyVotes(asIds);
  const tied = tally.filter((t) => t.count === tally[0].count);
  const order = new Map(round.options.map((o) => [String(o.mealId), o.order ?? 0]));
  const history = await historyEntries(round.householdId);
  const pick = selectFallbackMeal(
    tied.map((t) => ({ mealId: t.mealId, order: order.get(t.mealId) ?? 0 })),
    round.date,
    history,
  );
  const done = await VotingRound.findByIdAndUpdate(
    round._id,
    {
      ...common,
      status: 'COMPLETED',
      winnerMealId: pick.mealId,
      selectionMethod: 'FALLBACK',
      winningVotes: tally[0].count,
      daysSinceEaten: pick.daysSinceEaten,
    },
    { new: true },
  ).lean<RoundDoc>();
  await recordHistory(round, pick.mealId, 'FALLBACK', tally[0].count);
  return done;
}

/** Today's live round, creating it on first open. Also settles anything that is due. */
export async function getOrCreateToday(household: HouseholdDoc, now: Date, rng?: () => number) {
  const date = lagosDate(now);

  // Old open rounds from earlier days can't be voted on any more.
  const leftovers = await VotingRound.find({ householdId: household._id, date: { $lt: date }, status: { $in: ['OPEN', 'CALCULATING'] } }, { _id: 1 }).lean();
  for (const r of leftovers) await settleRound(r._id, now, rng);

  const latest = async () => VotingRound.findOne({ householdId: household._id, date }).sort({ roundNumber: -1 }).lean<RoundDoc>();
  let round = await latest();
  if (!round) {
    round = await createRound(household, date, 1, new Set(), now, rng);
    if (!round) throw new HttpError(409, 'The meal library has no eligible meals. Ask the owner to add or switch on some meals.', 'NO_ELIGIBLE_MEALS');
  }
  await settleRound(round._id, now, rng);
  return (await latest())!;
}

export async function castVote(householdId: unknown, roundId: string, participantId: unknown, mealId: string, now: Date, rng?: () => number) {
  const found = await VotingRound.findOne({ _id: roundId, householdId }).lean<RoundDoc>();
  if (!found) throw new HttpError(404, 'Voting round not found');

  const round = await settleRound(found._id, now, rng);
  if (!round || round.status !== 'OPEN') throw new HttpError(409, 'Voting is closed.', 'VOTING_CLOSED');
  if (!round.options.some((o) => String(o.mealId) === mealId)) throw new HttpError(400, 'That meal is not one of today’s options.', 'NOT_AN_OPTION');

  // Upsert on (round, participant): voting again simply changes the vote.
  await Vote.findOneAndUpdate(
    { roundId: round._id, participantId },
    { mealId, $setOnInsert: { firstVotedAt: now } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await settleRound(round._id, now, rng); // everyone may have voted now
}

/** Owner-only: when nobody voted, open a fresh round for the same day. */
export async function startAnotherRound(household: HouseholdDoc, now: Date, rng?: () => number) {
  const date = lagosDate(now);
  const latest = await VotingRound.findOne({ householdId: household._id, date }).sort({ roundNumber: -1 }).lean<RoundDoc>();
  if (!latest || latest.status !== 'NO_VOTES') throw new HttpError(409, 'A new round can only be started when nobody voted.');
  const exclude = new Set(latest.options.map((o) => String(o.mealId)));
  const round = await createRound(household, date, latest.roundNumber + 1, exclude, now, rng);
  if (!round) throw new HttpError(409, 'No eligible meals left for another round.', 'NO_ELIGIBLE_MEALS');
  return round;
}
