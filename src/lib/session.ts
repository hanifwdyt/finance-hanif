import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  authed: boolean;
  loggedAt?: number;
}

const PASSWORD = process.env.SESSION_SECRET ?? 'finance-hanif-default-32char-secret-please-set';

export const sessionOptions: SessionOptions = {
  password: PASSWORD.length >= 32 ? PASSWORD : PASSWORD.padEnd(32, '0'),
  cookieName: 'finance_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  },
};

export async function getSession() {
  const c = await cookies();
  return getIronSession<SessionData>(c, sessionOptions);
}

export const CORRECT_PIN = process.env.FINANCE_PIN ?? '929283';
