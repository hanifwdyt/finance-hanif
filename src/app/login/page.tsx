'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? 'Login gagal');
        setPin('');
      } else {
        router.push('/');
      }
    } catch {
      setError('Koneksi error');
    } finally {
      setLoading(false);
    }
  }

  function handleDigit(d: string) {
    if (pin.length < 6) setPin(pin + d);
  }
  function handleBack() {
    setPin(pin.slice(0, -1));
    setError(null);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-slate-200 tracking-wide">finance.hanif</h1>
          <p className="text-slate-500 text-sm mt-2">Masukin PIN</p>
        </div>

        <div className="flex justify-center gap-2 mb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < pin.length ? 'bg-slate-200' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        <div className="h-6 text-center text-rose-400 text-sm">{error}</div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleDigit(String(n))}
              className="aspect-square bg-slate-900 hover:bg-slate-800 text-slate-200 text-xl rounded-xl transition-colors"
            >
              {n}
            </button>
          ))}
          <button
            onClick={submit}
            disabled={loading || pin.length === 0}
            className="aspect-square bg-emerald-900 hover:bg-emerald-800 disabled:bg-slate-900 disabled:text-slate-600 text-emerald-100 text-xs rounded-xl transition-colors"
          >
            OK
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="aspect-square bg-slate-900 hover:bg-slate-800 text-slate-200 text-xl rounded-xl transition-colors"
          >
            0
          </button>
          <button
            onClick={handleBack}
            className="aspect-square bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs rounded-xl transition-colors"
          >
            ←
          </button>
        </div>
      </div>
    </div>
  );
}
