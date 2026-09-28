import type { NextFunction, Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { HttpError } from '../lib/errors';
import { hashToken, readSessionToken } from '../lib/session';
import { Household, type HouseholdDoc } from '../models/Household';
import { Participant, type ParticipantDoc } from '../models/Participant';

declare module 'express-serve-static-core' {
  interface Request {
    household?: HouseholdDoc;
    me?: ParticipantDoc;
  }
}

/** Resolves :householdId and the caller's participant from their session cookie. The server, not the client, decides who you are. */
export async function requireMember(req: Request, _res: Response, next: NextFunction) {
  try {
    const { householdId } = req.params;
    if (!isValidObjectId(householdId)) throw new HttpError(404, 'Household not found');
    const token = readSessionToken(req, householdId);
    if (!token) throw new HttpError(401, 'Join this household to continue', 'NO_SESSION');
    const me = await Participant.findOne({
      householdId,
      sessionTokenHash: hashToken(token),
      status: 'ACTIVE',
    }).lean<ParticipantDoc>();
    if (!me) throw new HttpError(401, 'Join this household to continue', 'NO_SESSION');
    const household = await Household.findById(householdId).lean<HouseholdDoc>();
    if (!household || !household.active) throw new HttpError(404, 'Household not found');
    req.me = me;
    req.household = household;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireOwner(req: Request, _res: Response, next: NextFunction) {
  if (req.me?.role !== 'owner') return next(new HttpError(403, 'Only the household owner can do this'));
  next();
}
