import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { now } from '../lib/clock';
import { asyncHandler, HttpError } from '../lib/errors';
import { lagosDate } from '../lib/lagos';
import { requireMember, requireOwner } from '../middleware/auth';
import { Meal, type MealDoc } from '../models/Meal';
import { MealHistory, VotingRound, type HistoryDoc, type RoundDoc } from '../models/Voting';
import { castVote, getOrCreateToday, settleRound, startAnotherRound } from '../services/rounds';
import { getStats } from '../services/stats';
import { buildToday } from '../services/today';
import { toPublic } from './meals';

export const todayRouter = Router({ mergeParams: true });
todayRouter.use(requireMember);

todayRouter.get(
  '/today',
  asyncHandler(async (req, res) => {
    const t = now();
    const round = await getOrCreateToday(req.household!, t);
    res.json(await buildToday(req.household!, req.me!, round, t));
  }),
);

// PUT is idempotent: the first call casts the vote, later calls change it (until the round closes).
todayRouter.put(
  '/rounds/:roundId/vote',
  asyncHandler(async (req, res) => {
    const { roundId } = req.params;
    if (!isValidObjectId(roundId)) throw new HttpError(404, 'Voting round not found');
    const { mealId } = z.object({ mealId: z.string().refine(isValidObjectId, 'Invalid meal') }).parse(req.body);
    const t = now();
    await castVote(req.household!._id, roundId, req.me!._id, mealId, t);
    const round = await VotingRound.findById(roundId).lean<RoundDoc>();
    res.json(await buildToday(req.household!, req.me!, (await settleRound(round!._id, t)) ?? round!, t));
  }),
);

todayRouter.post(
  '/rounds',
  requireOwner,
  asyncHandler(async (req, res) => {
    const t = now();
    const round = await startAnotherRound(req.household!, t);
    res.status(201).json(await buildToday(req.household!, req.me!, round, t));
  }),
);

todayRouter.get(
  '/history',
  asyncHandler(async (req, res) => {
    const month = z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'month must look like 2026-09')
      .default(lagosDate(now()).slice(0, 7))
      .parse(req.query.month);
    const entries = await MealHistory.find({ householdId: req.household!._id, date: { $regex: `^${month}-` } })
      .sort({ date: 1 })
      .lean<HistoryDoc[]>();
    const meals = await Meal.find({ _id: { $in: entries.map((e) => e.mealId) } }).lean<MealDoc[]>();
    const byId = new Map(meals.map((m) => [String(m._id), toPublic(m, new Set())]));
    res.json({
      month,
      days: entries.map((e) => ({
        date: e.date,
        meal: byId.get(String(e.mealId)),
        selectionMethod: e.selectionMethod,
        winningVotes: e.winningVotes,
      })),
    });
  }),
);

todayRouter.get(
  '/stats',
  asyncHandler(async (req, res) => {
    res.json(await getStats(req.household!._id, req.me!._id, lagosDate(now())));
  }),
);
