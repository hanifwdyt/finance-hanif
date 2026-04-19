export type EntryType =
  | 'income'          // Penghasilan bulanan
  | 'expense'         // Pengeluaran
  | 'debt_owed_to_me' // Orang lain utang ke gue
  | 'debt_i_owe'      // Gue utang ke orang
  | 'bokap_money'     // Uang bokap yang dititipin/dikelola
  | 'todo';           // Todo duit (rencana, alokasi)

export interface Entry {
  id: number;
  type: EntryType;
  amount: number;           // IDR, integer
  party: string | null;     // siapa (bokap, ganesh, gaji, dll)
  note: string | null;      // keterangan
  status: 'open' | 'done';  // untuk todo & utang
  due_date: string | null;  // YYYY-MM-DD, optional
  created_at: string;       // ISO timestamp
  updated_at: string;
}

export interface EntryInput {
  type: EntryType;
  amount: number;
  party?: string | null;
  note?: string | null;
  status?: 'open' | 'done';
  due_date?: string | null;
}

export const TYPE_LABELS: Record<EntryType, string> = {
  income: 'Penghasilan',
  expense: 'Pengeluaran',
  debt_owed_to_me: 'Piutang',
  debt_i_owe: 'Utang',
  bokap_money: 'Uang Bokap',
  todo: 'Todo Duit',
};

export const TYPE_COLORS: Record<EntryType, string> = {
  income: 'text-emerald-400',
  expense: 'text-rose-400',
  debt_owed_to_me: 'text-sky-400',
  debt_i_owe: 'text-amber-400',
  bokap_money: 'text-violet-400',
  todo: 'text-slate-400',
};
