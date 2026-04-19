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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-wide text-slate-200">finance.hanif</h1>
            <p className="text-sm text-slate-500 mt-1">{today}</p>
          </div>
          <LogoutButton />
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <Card
            label="Uang Bokap"
            amount={map.bokap_money.open}
            accent="violet"
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
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">Todo Duit</h2>
            <div className="space-y-2">
              {todosOpen.map((e) => (
                <div
                  key={e.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-200 text-sm truncate">
                      {e.note ?? e.party ?? 'Todo'}
                    </div>
                    {e.due_date && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        due {e.due_date}
                      </div>
                    )}
                  </div>
                  <div className="text-slate-300 font-mono text-sm ml-3">
                    {formatIDR(e.amount)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {wishlistOpen.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">Wishlist</h2>
            <div className="space-y-2">
              {wishlistOpen.map((e) => (
                <div
                  key={e.id}
                  className="bg-slate-900/60 border border-pink-900/30 rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-200 text-sm truncate">
                      {e.note ?? e.party ?? 'Wishlist'}
                    </div>
                    {e.party && e.note && (
                      <div className="text-xs text-slate-500 mt-0.5">{e.party}</div>
                    )}
                  </div>
                  <div className="text-pink-400 font-mono text-sm ml-3">
                    {e.amount > 0 ? formatIDR(e.amount) : <span className="text-slate-600">budget?</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">Breakdown</h2>
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg divide-y divide-slate-800/60">
            {(Object.keys(TYPE_LABELS) as EntryType[]).map((type) => {
              const s = map[type];
              const total = s.open + s.done;
              const count = s.openCount + s.doneCount;
              return (
                <div key={type} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${TYPE_COLORS[type]}`}>●</span>
                    <span className="text-slate-300 text-sm">{TYPE_LABELS[type]}</span>
                    <span className="text-slate-600 text-xs">{count}</span>
                  </div>
                  <div className="text-slate-400 font-mono text-sm">
                    {formatCompact(total)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">Timeline</h2>
          {timeline.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-lg px-4 py-8 text-center text-slate-500 text-sm">
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

        <footer className="mt-12 text-center text-xs text-slate-600">
          Kawula mung saderma.
        </footer>
      </div>
    </div>
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
  accent: 'emerald' | 'rose' | 'sky' | 'amber' | 'violet';
  sub?: string;
}) {
  const accents: Record<typeof accent, string> = {
    emerald: 'from-emerald-900/30 to-slate-900/40 border-emerald-900/40',
    rose: 'from-rose-900/30 to-slate-900/40 border-rose-900/40',
    sky: 'from-sky-900/30 to-slate-900/40 border-sky-900/40',
    amber: 'from-amber-900/30 to-slate-900/40 border-amber-900/40',
    violet: 'from-violet-900/30 to-slate-900/40 border-violet-900/40',
  };
  const text: Record<typeof accent, string> = {
    emerald: 'text-emerald-300',
    rose: 'text-rose-300',
    sky: 'text-sky-300',
    amber: 'text-amber-300',
    violet: 'text-violet-300',
  };
  return (
    <div
      className={`bg-gradient-to-br ${accents[accent]} border rounded-xl p-4`}
    >
      <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-light mt-2 ${text[accent]} font-mono`}>
        {formatIDR(amount)}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-1 truncate">{sub}</div>}
    </div>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  const isPositive = entry.type === 'income' || entry.type === 'debt_owed_to_me' || entry.type === 'bokap_money';
  const sign = isPositive ? '+' : entry.type === 'expense' || entry.type === 'debt_i_owe' ? '−' : '';
  const amountColor = isPositive
    ? 'text-emerald-400'
    : entry.type === 'expense' || entry.type === 'debt_i_owe'
    ? 'text-rose-400'
    : 'text-slate-400';

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-lg px-4 py-2.5 flex items-center gap-3 hover:bg-slate-900/60 transition-colors">
      <span className={`text-xs ${TYPE_COLORS[entry.type]} w-20 shrink-0`}>
        {TYPE_LABELS[entry.type]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-300 truncate">
          {entry.party ? <span className="text-slate-400">{entry.party}</span> : null}
          {entry.party && entry.note ? <span className="text-slate-600"> · </span> : null}
          {entry.note ?? (!entry.party ? TYPE_LABELS[entry.type] : '')}
        </div>
        <div className="text-xs text-slate-600 mt-0.5">
          {relativeTime(entry.created_at)}
          {entry.status === 'done' && <span className="ml-2 text-emerald-600">✓</span>}
        </div>
      </div>
      <div className={`font-mono text-sm ${amountColor} shrink-0`}>
        {sign}
        {formatIDR(entry.amount)}
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
        className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 border border-slate-800 rounded-lg"
      >
        Keluar
      </button>
    </form>
  );
}
