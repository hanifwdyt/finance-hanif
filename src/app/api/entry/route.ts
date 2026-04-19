import { NextRequest, NextResponse } from 'next/server';
import { insertEntry, listEntries, updateEntryStatus, deleteEntry } from '@/lib/db';
import { EntryType } from '@/lib/types';

const MINION_SECRET = process.env.MINION_SECRET ?? 'semar-finance-2026-secret-change-me';
const VALID_TYPES: EntryType[] = [
  'income',
  'expense',
  'debt_owed_to_me',
  'debt_i_owe',
  'wishlist',
  'bokap_money',
  'todo',
];

function auth(req: NextRequest): boolean {
  const header = req.headers.get('x-minion-secret');
  return header === MINION_SECRET;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '200');
  const entries = listEntries(Math.min(Math.max(limit, 1), 500));
  return NextResponse.json({ ok: true, entries });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid body' }, { status: 400 });
  }

  const type = body.type;
  const amount = Number(body.amount);

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { ok: false, error: `invalid type, must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ ok: false, error: 'amount must be a non-negative number' }, { status: 400 });
  }

  const status = body.status === 'done' ? 'done' : 'open';
  const entry = insertEntry({
    type,
    amount,
    party: body.party ? String(body.party).slice(0, 100) : null,
    note: body.note ? String(body.note).slice(0, 500) : null,
    status,
    due_date: body.due_date ? String(body.due_date).slice(0, 20) : null,
  });

  return NextResponse.json({ ok: true, entry });
}

export async function PATCH(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  const status = body?.status;
  if (!Number.isFinite(id) || (status !== 'open' && status !== 'done')) {
    return NextResponse.json({ ok: false, error: 'need id and status (open|done)' }, { status: 400 });
  }
  const entry = updateEntryStatus(id, status);
  if (!entry) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const id = Number(req.nextUrl.searchParams.get('id'));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, error: 'need id' }, { status: 400 });
  }
  const ok = deleteEntry(id);
  return NextResponse.json({ ok });
}
