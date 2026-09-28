import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { env } from './env';

const cookieName = (householdId: string) => `mv_${householdId}`;

export const newSessionToken = () => crypto.randomBytes(32).toString('base64url');

// Only the HMAC of the token is stored, so a DB leak can't be replayed as a session.
export const hashToken = (token: string) =>
  crypto.createHmac('sha256', env.sessionSecret).update(token).digest('hex');

export const newInviteToken = () => crypto.randomBytes(9).toString('base64url');

export function setSessionCookie(res: Response, householdId: string, token: string) {
  res.cookie(cookieName(householdId), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    maxAge: 1000 * 60 * 60 * 24 * 365,
    path: '/',
  });
}

export const readSessionToken = (req: Request, householdId: string): string | undefined =>
  req.cookies?.[cookieName(householdId)];
