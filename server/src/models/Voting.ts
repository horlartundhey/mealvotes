import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export const ROUND_STATUSES = ['OPEN', 'CALCULATING', 'COMPLETED', 'NO_MAJORITY', 'NO_VOTES', 'EXPIRED'] as const;

const roundSchema = new Schema(
  {
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    date: { type: String, required: true }, // Lagos calendar day, YYYY-MM-DD
    roundNumber: { type: Number, required: true },
    status: { type: String, enum: ROUND_STATUSES, default: 'OPEN' },
    opensAt: { type: Date, required: true },
    closesAt: { type: Date, required: true },
    closedAt: Date,
    options: [{ _id: false, mealId: { type: Schema.Types.ObjectId, ref: 'Meal' }, order: Number }],
    // Set on resolution. finalVotes is a frozen copy so history survives members leaving.
    winnerMealId: { type: Schema.Types.ObjectId, ref: 'Meal', default: null },
    selectionMethod: { type: String, enum: ['MAJORITY', 'FALLBACK'] },
    winningVotes: Number,
    eligibleCount: Number,
    daysSinceEaten: { type: Number, default: null },
    finalVotes: [{ _id: false, participantId: Schema.Types.ObjectId, mealId: Schema.Types.ObjectId }],
  },
  { timestamps: true },
);
// One round number per household per day: also stops two simultaneous requests creating duplicate rounds.
roundSchema.index({ householdId: 1, date: 1, roundNumber: 1 }, { unique: true });

const voteSchema = new Schema(
  {
    roundId: { type: Schema.Types.ObjectId, ref: 'VotingRound', required: true },
    participantId: { type: Schema.Types.ObjectId, ref: 'Participant', required: true },
    mealId: { type: Schema.Types.ObjectId, ref: 'Meal', required: true },
    firstVotedAt: Date, // when they first voted this round (changing a vote doesn't move it)
  },
  { timestamps: true },
);
// The database itself guarantees one active vote per person per round.
voteSchema.index({ roundId: 1, participantId: 1 }, { unique: true });

const historySchema = new Schema(
  {
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    mealId: { type: Schema.Types.ObjectId, ref: 'Meal', required: true },
    date: { type: String, required: true },
    roundId: { type: Schema.Types.ObjectId, ref: 'VotingRound' },
    selectionMethod: { type: String, enum: ['MAJORITY', 'FALLBACK'], required: true },
    winningVotes: Number,
  },
  { timestamps: true },
);
historySchema.index({ householdId: 1, date: 1 }, { unique: true });

export type RoundDoc = InferSchemaType<typeof roundSchema> & { _id: Types.ObjectId };
export type VoteDoc = InferSchemaType<typeof voteSchema> & { _id: Types.ObjectId };
export type HistoryDoc = InferSchemaType<typeof historySchema> & { _id: Types.ObjectId };

export const VotingRound = model('VotingRound', roundSchema);
export const Vote = model('Vote', voteSchema);
export const MealHistory = model('MealHistory', historySchema);
