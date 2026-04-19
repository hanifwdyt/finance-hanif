export function formatIDR(amount: number): string {
  const rounded = Math.round(amount);
  return 'Rp ' + rounded.toLocaleString('id-ID');
}

export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1).replace('.0', '') + 'M';
  if (abs >= 1_000_000) return (amount / 1_000_000).toFixed(1).replace('.0', '') + 'jt';
  if (abs >= 1_000) return (amount / 1_000).toFixed(1).replace('.0', '') + 'rb';
  return String(amount);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru aja';
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}h lalu`;
  return formatDate(iso);
}
