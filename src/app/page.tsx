import { listEntries, summary } from '@/lib/db';
import { Entry, EntryType, TYPE_LABELS, TYPE_COLORS } from '@/lib/types';
import { formatIDR, formatCompact, relativeTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

type SummaryMap = Record<EntryType, { open: number; done: number; openCount: number; doneCount: number }>;

function aggregate(rows: Array<{ type: string; status: string; total: number; count: number }>): SummaryMap {
  const base: SummaryMap = {
    income: { open: 0, done: 0, openCount: 0, doneCount: 0 },
    expense: { open: 0, done: 0, openCount: 0, doneCount: 0 },
    debt_owed_to_me: { open: 0, done: 0, openCount: 0, doneCount: 0 },
    debt_i_owe: { open: 0, done: 0, openCount: 0, doneCount: 0 },
    bokap_money: { open: 0, done: 0, openCount: 0, doneCount: 0 },
    todo: { open: 0, done: 0, openCount: 0, doneCount: 0 },
    wishlist: { open: 0, done: 0, openCount: 0, doneCount: 0 },
  };
  for (const row of rows) {
    const t = row.type as EntryType;
    if (!(t in base)) continue;
    if (row.status === 'open') {
      base[t].open += row.total;
      base[t].openCount += row.count;
    } else {
      base[t].done += row.total;
      base[t].doneCount += row.count;
    }
  }
  return base;
}

function thisMonthTotal(entries: Entry[], type: EntryType): number {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return entries
    .filter((e) => e.type === type)
    .filter((e) => {
      const d = new Date(e.created_at);
      return d.getFullYear() === y && d.getMonth() === m;
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

export default async function DashboardPage() {
  const entries = listEntries(200);
  const map = aggregate(summary());
  const incomeThisMonth = thisMonthTotal(entries, 'income');
  const expenseThisMonth = thisMonthTotal(entries, 'expense');
  const todosOpen = entries.filter((e) => e.type === 'todo' && e.status === 'open');
  const wishlistOpen = entries.filter((e) => e.type === 'wishlist' && e.status === 'open');
  const timeline = entries.slice(0, 50);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--pk-bg)', color: 'var(--pk-text)' }}>
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl tracking-wide" style={{ fontWeight: 300, color: 'var(--pk-text)' }}>
              <span style={{ color: 'var(--pk-gold)' }}>finance</span>.hanif
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--pk-text-dim)' }}>{today}</p>
          </div>
          <LogoutButton />
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <Card
            label="Uang Bokap"
            amount={map.bokap_money.open}
            accent="gold"
            sub={`${map.bokap_money.openCount} catatan`}
          />
          <Card
            label="Piutang"
            amount={map.debt_owed_to_me.open}
            accent="sky"
            sub={`${map.debt_owed_to_me.openCount} belum balik`}
          />
          <Card
            label="Utang Gue"
            amount={map.debt_i_owe.open}
            accent="amber"
            sub={`${map.debt_i_owe.openCount} belum lunas`}
          />
          <Card
            label="Bulan Ini"
            amount={incomeThisMonth - expenseThisMonth}
            accent="emerald"
            sub={`+${formatCompact(incomeThisMonth)} / −${formatCompact(expenseThisMonth)}`}
          />
        </section>

        {todosOpen.length > 0 && (
          <section className="mb-8">
            <SectionLabel>Todo Duit</SectionLabel>
            <div className="space-y-2">
              {todosOpen.map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg px-4 py-3 flex items-center justify-between"
                  style={{ background: 'rgba(42, 33, 24, 0.55)', border: '1px solid var(--pk-border-soft)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ color: 'var(--pk-text)' }}>
                      {e.note ?? e.party ?? 'Todo'}
                    </div>
                    {e.due_date && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--pk-text-dim)' }}>
                        due {e.due_date}
                      </div>
                    )}
                  </div>
                  <div className="font-mono text-sm ml-3" style={{ color: 'var(--pk-gold)' }}>
                    {formatIDR(e.amount)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {wishlistOpen.length > 0 && (
          <section className="mb-8">
            <SectionLabel>Wishlist</SectionLabel>
            <div className="space-y-2">
              {wishlistOpen.map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg px-4 py-3 flex items-center justify-between"
                  style={{ background: 'rgba(42, 33, 24, 0.55)', border: '1px solid rgba(200, 100, 130, 0.15)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ color: 'var(--pk-text)' }}>
                      {e.note ?? e.party ?? 'Wishlist'}
                    </div>
                    {e.party && e.note && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--pk-text-dim)' }}>{e.party}</div>
                    )}
                  </div>
                  <div className="font-mono text-sm ml-3 text-pink-400">
                    {e.amount > 0 ? formatIDR(e.amount) : <span style={{ color: 'var(--pk-text-dim)' }}>budget?</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8">
          <SectionLabel>Breakdown</SectionLabel>
          <div
            className="rounded-lg"
            style={{ background: 'rgba(42, 33, 24, 0.4)', border: '1px solid var(--pk-border-soft)' }}
          >
            {(Object.keys(TYPE_LABELS) as EntryType[]).map((type, i, arr) => {
              const s = map[type];
              const total = s.open + s.done;
              const count = s.openCount + s.doneCount;
              return (
                <div
                  key={type}
                  className="px-4 py-3 flex items-center justify-between"
                  style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(200, 163, 90, 0.06)' } : {}}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${TYPE_COLORS[type]}`}>●</span>
                    <span className="text-sm" style={{ color: 'var(--pk-text-muted)' }}>{TYPE_LABELS[type]}</span>
                    <span className="text-xs" style={{ color: 'var(--pk-text-dim)' }}>{count}</span>
                  </div>
                  <div className="font-mono text-sm" style={{ color: 'var(--pk-text-muted)' }}>
                    {formatCompact(total)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionLabel>Timeline</SectionLabel>
          {timeline.length === 0 ? (
            <div
              className="rounded-lg px-4 py-8 text-center text-sm"
              style={{ background: 'rgba(42, 33, 24, 0.4)', border: '1px solid var(--pk-border-soft)', color: 'var(--pk-text-dim)' }}
            >
              Belum ada catatan. Ngobrol sama Semar di Telegram buat mulai nyatet.
            </div>
          ) : (
            <div className="space-y-1">
              {timeline.map((e) => (
                <EntryRow key={e.id} entry={e} />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-12 text-center text-xs" style={{ color: 'var(--pk-text-dim)', opacity: 0.4 }}>
          Kawula mung saderma.
        </footer>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--pk-text-dim)' }}>
      {children}
    </h2>
  );
}

function Card({
  label,
  amount,
  accent,
  sub,
}: {
  label: string;
  amount: number;
  accent: 'emerald' | 'rose' | 'sky' | 'amber' | 'gold';
  sub?: string;
}) {
  const accentMap: Record<string, { bg: string; border: string; text: string }> = {
    gold:    { bg: 'rgba(200, 163, 90, 0.1)',   border: 'rgba(200, 163, 90, 0.22)',  text: '#C8A35A' },
    emerald: { bg: 'rgba(16, 185, 129, 0.08)',  border: 'rgba(16, 185, 129, 0.18)', text: '#6ee7b7' },
    rose:    { bg: 'rgba(244, 63, 94, 0.08)',   border: 'rgba(244, 63, 94, 0.18)',   text: '#fda4af' },
    sky:     { bg: 'rgba(14, 165, 233, 0.08)',  border: 'rgba(14, 165, 233, 0.18)',  text: '#7dd3fc' },
    amber:   { bg: 'rgba(245, 158, 11, 0.08)',  border: 'rgba(245, 158, 11, 0.18)',  text: '#fcd34d' },
  };
  const a = accentMap[accent] ?? accentMap.gold;
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: a.bg, border: `1px solid ${a.border}` }}
    >
      <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--pk-text-dim)' }}>{label}</div>
      <div className="text-xl font-light mt-2 font-mono" style={{ color: a.text }}>
        {formatIDR(amount)}
      </div>
      {sub && <div className="text-xs mt-1 truncate" style={{ color: 'var(--pk-text-dim)' }}>{sub}</div>}
    </div>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  const isPositive = entry.type === 'income' || entry.type === 'debt_owed_to_me' || entry.type === 'bokap_money';
  const sign = isPositive ? '+' : entry.type === 'expense' || entry.type === 'debt_i_owe' ? '−' : '';
  const amountColor = isPositive
    ? '#6ee7b7'
    : entry.type === 'expense' || entry.type === 'debt_i_owe'
    ? '#fda4af'
    : 'var(--pk-text-muted)';

  return (
    <div
      className="rounded-lg px-4 py-2.5 flex items-center gap-3"
      style={{ background: 'rgba(42, 33, 24, 0.4)', border: '1px solid rgba(200, 163, 90, 0.06)' }}
    >
      <span className={`text-xs ${TYPE_COLORS[entry.type]} w-20 shrink-0`}>
        {TYPE_LABELS[entry.type]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate" style={{ color: 'var(--pk-text-muted)' }}>
          {entry.party ? <span style={{ color: 'var(--pk-text-dim)' }}>{entry.party}</span> : null}
          {entry.party && entry.note ? <span style={{ color: 'var(--pk-text-dim)', opacity: 0.4 }}> · </span> : null}
          {entry.note ?? (!entry.party ? TYPE_LABELS[entry.type] : '')}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--pk-text-dim)' }}>
          {relativeTime(entry.created_at)}
          {entry.status === 'done' && <span className="ml-2 text-emerald-600">✓</span>}
        </div>
      </div>
      <div className="font-mono text-sm shrink-0" style={{ color: amountColor }}>
        {sign}{formatIDR(entry.amount)}
      </div>
    </div>
  );
}

function LogoutButton() {
  return (
    <form
      action={async () => {
        'use server';
        const { getSession } = await import('@/lib/session');
        const s = await getSession();
        s.destroy();
      }}
    >
      <button
        type="submit"
        className="text-xs transition-colors px-3 py-1.5 rounded-lg"
        style={{ color: 'var(--pk-text-dim)', border: '1px solid var(--pk-border-soft)' }}
      >
        Keluar
      </button>
    </form>
  );
}
