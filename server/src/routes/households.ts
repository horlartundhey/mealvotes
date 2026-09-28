import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { asyncHandler, HttpError } from '../lib/errors';
import { hashToken, newInviteToken, readSessionToken, setSessionCookie } from '../lib/session';
import { requireMember, requireOwner } from '../middleware/auth';
import { Household, type HouseholdDoc } from '../models/Household';
import { Participant, type ParticipantDoc } from '../models/Participant';
import { createHousehold, inviteUrlFor, joinHousehold, publicParticipant } from '../services/households';

const name = (label: string, max: number) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long`);

export const householdRouter = Router();
export const inviteRouter = Router();

householdRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = z.object({ name: name('Household name', 60), ownerName: name('Your name', 30) }).parse(req.body);
    const { household, owner, token } = await createHousehold(body.name, body.ownerName);
    setSessionCookie(res, String(household._id), token);
    res.status(201).json({
      id: String(household._id),
      name: household.name,
      inviteUrl: inviteUrlFor(household.inviteToken),
      me: publicParticipant(owner),
    });
  }),
);

householdRouter.get(
  '/:householdId',
  requireMember,
  asyncHandler(async (req, res) => {
    const household = req.household!;
    const members = await Participant.find({ householdId: household._id, status: 'ACTIVE' })
      .sort({ createdAt: 1 })
      .lean<ParticipantDoc[]>();
    res.json({
      id: String(household._id),
      name: household.name,
      me: publicParticipant(req.me!),
      members: members.map(publicParticipant),
      inviteUrl: req.me!.role === 'owner' ? inviteUrlFor(household.inviteToken) : undefined,
    });
  }),
);

// Replaces the invite token; the old link stops working.
householdRouter.post(
  '/:householdId/invite',
  requireMember,
  requireOwner,
  asyncHandler(async (req, res) => {
    const token = newInviteToken();
    await Household.updateOne({ _id: req.household!._id }, { inviteToken: token });
    res.json({ inviteUrl: inviteUrlFor(token) });
  }),
);

householdRouter.delete(
  '/:householdId/members/:participantId',
  requireMember,
  requireOwner,
  asyncHandler(async (req, res) => {
    const { participantId } = req.params;
    if (!isValidObjectId(participantId)) throw new HttpError(404, 'Member not found');
    if (participantId === String(req.me!._id)) throw new HttpError(400, "The owner can't be removed");
    // Deactivate, never delete: their past votes stay in history.
    const result = await Participant.updateOne(
      { _id: participantId, householdId: req.household!._id },
      { status: 'INACTIVE', sessionTokenHash: `revoked:${participantId}` },
    );
    if (!result.matchedCount) throw new HttpError(404, 'Member not found');
    res.status(204).end();
  }),
);

async function findByInvite(token: string) {
  const household = await Household.findOne({ inviteToken: token, active: true }).lean<HouseholdDoc>();
  if (!household) throw new HttpError(404, 'This invitation is invalid or no longer available.', 'INVALID_INVITE');
  return household;
}

inviteRouter.get(
  '/:token',
  asyncHandler(async (req, res) => {
    const household = await findByInvite(req.params.token);
    const cookie = readSessionToken(req, String(household._id));
    const [memberCount, me] = await Promise.all([
      Participant.countDocuments({ householdId: household._id, status: 'ACTIVE' }),
      cookie
        ? Participant.findOne({
            householdId: household._id,
            sessionTokenHash: hashToken(cookie),
            status: 'ACTIVE',
          }).lean<ParticipantDoc>()
        : null,
    ]);
    res.json({
      valid: true,
      household: { id: String(household._id), name: household.name },
      memberCount,
      me: me ? publicParticipant(me) : null,
    });
  }),
);

inviteRouter.post(
  '/:token/join',
  asyncHandler(async (req, res) => {
    const { displayName } = z.object({ displayName: name('Your name', 30) }).parse(req.body);
    const household = await findByInvite(req.params.token);
    const cookie = readSessionToken(req, String(household._id));
    const { participant, token, created } = await joinHousehold(
      household,
      displayName,
      cookie ? hashToken(cookie) : undefined,
    );
    if (token) setSessionCookie(res, String(household._id), token);
    res
      .status(created ? 201 : 200)
      .json({ participant: publicParticipant(participant), householdId: String(household._id) });
  }),
);
