import React, { useState } from 'react';
import { Gift, Lock, Users } from 'lucide-react';
import { CompactMistletoeSvg } from '../assets/avatars';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { signInWithGoogle, pendingInviteCode } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Přihlášení přes Google se nezdařilo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="stationery-sheet paper-grain-overlay w-full max-w-2xl rounded-[30px] border border-[#E5DBC3] p-6 sm:p-10 animate-page-transition relative overflow-hidden">
        <div className="stationery-inner-frame" aria-hidden="true" />

        <div className="text-center relative z-10">
          <CompactMistletoeSvg className="w-28 h-9 mx-auto mb-2" />
          <h1 className="font-handwritten text-5xl sm:text-6xl font-bold text-fir tracking-tight">
            Dopis Ježíškovi
          </h1>
          <p className="mt-2.5 text-base sm:text-lg text-slate-text-muted max-w-md mx-auto leading-relaxed">
            Rodinné vánoční dopisy a tajná rezervace dárků na jednom místě.
          </p>
        </div>

        {pendingInviteCode && (
          <div className="relative z-10 mt-6 p-4 rounded-2xl bg-fir-soft border border-fir/30 text-center">
            <div className="text-base font-bold text-fir">
              Máš připravenou pozvánku ({pendingInviteCode})
            </div>
            <div className="text-sm text-slate-text-muted mt-0.5">
              Stačí se přihlásit přes Google a hned ti nabídneme připojení jedním kliknutím.
            </div>
          </div>
        )}

        {/* 3 stručné body */}
        <div className="relative z-10 mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-paper/80 border border-paper-warm p-5">
            <div className="w-10 h-10 rounded-xl bg-crimson-soft text-crimson flex items-center justify-center mb-3">
              <Gift className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-text text-base">Dopisy pro blízké</h2>
            <p className="mt-1 text-sm text-slate-text-muted leading-relaxed">
              Napiš dopis za sebe i za děti a vytiskni si ho na papír.
            </p>
          </div>

          <div className="rounded-2xl bg-paper/80 border border-paper-warm p-5">
            <div className="w-10 h-10 rounded-xl bg-fir-soft text-fir flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-text text-base">Tajná rezervace</h2>
            <p className="mt-1 text-sm text-slate-text-muted leading-relaxed">
              Nikdo neuvidí, co kdo z jeho dopisu koupil.
            </p>
          </div>

          <div className="rounded-2xl bg-paper/80 border border-paper-warm p-5">
            <div className="w-10 h-10 rounded-xl bg-gold-soft text-gold flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-text text-base">Žádné duplicity</h2>
            <p className="mt-1 text-sm text-slate-text-muted leading-relaxed">
              Vybraný dárek ostatním nakupujícím hned zmizí.
            </p>
          </div>
        </div>

        {/* Přihlášení přes Google */}
        <div className="relative z-10 mt-8 space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={busy}
            className="min-h-[54px] w-full py-3.5 px-6 rounded-2xl bg-fir hover:bg-fir-dark text-white text-lg font-bold shadow-sm transition flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            <span>{busy ? 'Přihlašuji...' : 'Přihlásit se přes Google'}</span>
          </button>

          {error && (
            <p className="text-base text-crimson bg-crimson-soft px-4 py-3 rounded-2xl text-center">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
