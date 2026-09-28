import { HttpError } from '../lib/errors';
import { hashToken, newInviteToken, newSessionToken } from '../lib/session';
import { Household, type HouseholdDoc } from '../models/Household';
import { Participant, type ParticipantDoc } from '../models/Participant';

export const publicParticipant = (p: ParticipantDoc) => ({
  id: String(p._id),
  displayName: p.displayName,
  role: p.role,
  joinedAt: (p as unknown as { createdAt: Date }).createdAt,
});

export const inviteUrlFor = (token: string) => `/join/${token}`;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function createHousehold(name: string, ownerName: string) {
  const ownerToken = newSessionToken();
  const household = await Household.create({ name, inviteToken: newInviteToken() });
  const owner = await Participant.create({
    householdId: household._id,
    displayName: ownerName,
    role: 'owner',
    sessionTokenHash: hashToken(ownerToken),
  });
  household.ownerParticipantId = owner._id;
  await household.save();
  return {
    household: household.toObject() as HouseholdDoc,
    owner: owner.toObject() as ParticipantDoc,
    token: ownerToken,
  };
}

export async function joinHousehold(household: HouseholdDoc, displayName: string, existingTokenHash?: string) {
  // Same browser opening the link again returns the same participant, never a duplicate.
  if (existingTokenHash) {
    const existing = await Participant.findOne({
      householdId: household._id,
      sessionTokenHash: existingTokenHash,
      status: 'ACTIVE',
    }).lean<ParticipantDoc>();
    if (existing) return { participant: existing, token: null, created: false };
  }

  const taken = await Participant.exists({
    householdId: household._id,
    status: 'ACTIVE',
    displayName: new RegExp(`^${escapeRegex(displayName)}$`, 'i'),
  });
  if (taken) {
    throw new HttpError(409, `Someone in this household is already called "${displayName}". Pick another name.`, 'NAME_TAKEN');
  }

  const token = newSessionToken();
  const participant = await Participant.create({
    householdId: household._id,
    displayName,
    sessionTokenHash: hashToken(token),
  });
  return { participant: participant.toObject() as ParticipantDoc, token, created: true };
}
