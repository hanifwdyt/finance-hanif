import { NextRequest, NextResponse } from 'next/server';
import { getSession, CORRECT_PIN } from '@/lib/session';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pin = String(body?.pin ?? '');

  if (pin !== CORRECT_PIN) {
    return NextResponse.json({ ok: false, error: 'PIN salah' }, { status: 401 });
  }

  const session = await getSession();
  session.authed = true;
  session.loggedAt = Date.now();
  await session.save();

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
