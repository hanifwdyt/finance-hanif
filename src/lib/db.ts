import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Entry, EntryInput } from './types';

const DB_PATH = process.env.FINANCE_DB_PATH ?? path.join(process.cwd(), 'data', 'finance.db');

function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  ensureDir();
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'debt_owed_to_me', 'debt_i_owe', 'bokap_money', 'todo', 'wishlist')),
      amount INTEGER NOT NULL,
      party TEXT,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
    CREATE INDEX IF NOT EXISTS idx_entries_created ON entries(created_at);
    CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
  `);

  dbInstance = db;
  return db;
}

export function insertEntry(input: EntryInput): Entry {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO entries (type, amount, party, note, status, due_date)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *
  `);
  return stmt.get(
    input.type,
    Math.round(input.amount),
    input.party ?? null,
    input.note ?? null,
    input.status ?? 'open',
    input.due_date ?? null
  ) as Entry;
}

export function listEntries(limit = 200): Entry[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM entries ORDER BY created_at DESC LIMIT ?')
    .all(limit) as Entry[];
}

export function updateEntryStatus(id: number, status: 'open' | 'done'): Entry | null {
  const db = getDb();
  return db
    .prepare(`UPDATE entries SET status = ?, updated_at = datetime('now') WHERE id = ? RETURNING *`)
    .get(status, id) as Entry | null;
}

export function deleteEntry(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM entries WHERE id = ?').run(id);
  return result.changes > 0;
}

export function summary() {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT type, status, SUM(amount) as total, COUNT(*) as count
      FROM entries
      GROUP BY type, status
    `)
    .all() as Array<{ type: string; status: string; total: number; count: number }>;
  return rows;
}
