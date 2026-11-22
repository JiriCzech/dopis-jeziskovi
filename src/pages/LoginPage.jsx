import React, { useState } from 'react';
import { Gift, Lock, Sparkles, Users } from 'lucide-react';
import { CompactMistletoeSvg, WaxSealSvg } from '../assets/avatars';
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
      <div className="stationery-sheet paper-grain-overlay w-full max-w-2xl rounded-[30px] p-6 sm:p-10 animate-page-transition relative overflow-hidden">
        <div className="stationery-inner-frame" aria-hidden="true" />

        {/* Hlavička Ježíškovy pošty */}
        <div className="text-center relative z-10">
          <CompactMistletoeSvg className="w-28 h-9 mx-auto mb-1" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fir-soft border border-fir/25 text-xs font-bold uppercase tracking-widest text-fir mb-2">
            <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>Tradiční české vánoční papírnictví</span>
          </div>
          <h1 className="font-fairytale text-4xl sm:text-6xl font-bold text-fir tracking-tight">
            Ježíškova pošta
          </h1>
          <p className="font-handwritten text-2xl sm:text-3xl text-crimson mt-1">
            Dopis Ježíškovi & tajná rodinná přání
          </p>
        </div>

        {/* 3D Maskot Kapřík s vřelou uvítací bublinou */}
        <div className="relative z-10 mt-6 flex flex-col sm:flex-row items-center gap-5 p-5 rounded-3xl bg-kraft/75 border-[1.5px] border-fir shadow-card">
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-fir shadow-md bg-[#E8DEC8] relative">
              <img
                src="/assets/kaprik.png"
                alt="Vánoční kapřík — průvodce Ježíškovou poštou"
                className="w-full h-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-1 rounded-xl border border-gold/55"
                aria-hidden="true"
              />
            </div>
            <WaxSealSvg className="w-10 h-10 absolute -bottom-2.5 -right-2.5" />
          </div>

          <div className="relative bg-sheet rounded-2xl border-[1.5px] border-fir p-4 sm:p-5 shadow-xs flex-1">
            <div
              className="pointer-events-none absolute inset-1.5 rounded-xl border border-gold/35"
              aria-hidden="true"
            />
            <p className="relative z-10 text-base sm:text-lg text-slate-text leading-relaxed font-medium">
              „Ahoj! Jsem kapřík a pomůžu ti poslat ten nejkrásnější dopis Ježíškovi nebo se tajně
              podívat, co si přeje rodina a kamarádi.“
            </p>
          </div>
        </div>

        {pendingInviteCode && (
          <div className="relative z-10 mt-5 p-4 rounded-2xl bg-fir-soft border-[1.5px] border-fir text-center">
            <div className="text-base font-bold text-fir">
              Máš připravenou pozvánku ({pendingInviteCode})
            </div>
            <div className="text-sm text-slate-text-muted mt-0.5">
              Stačí vstoupit přes Google a hned ti nabídneme připojení jedním kliknutím.
            </div>
          </div>
        )}

        {/* 3 pilíře zážitku */}
        <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="rounded-2xl bg-paper border border-fir/30 p-4">
            <div className="w-10 h-10 rounded-xl bg-crimson-soft text-crimson border border-crimson/20 flex items-center justify-center mb-2.5">
              <Gift className="w-5 h-5" />
            </div>
            <h2 className="font-fairytale font-bold text-slate-text text-xl">Dopisy & pečeť</h2>
            <p className="mt-1 text-sm text-slate-text-muted leading-relaxed">
              Napiš dopis na papír nebo připni fotku ručního dopisu a zapečeť obálku.
            </p>
          </div>

          <div className="rounded-2xl bg-paper border border-fir/30 p-4">
            <div className="w-10 h-10 rounded-xl bg-fir-soft text-fir border border-fir/20 flex items-center justify-center mb-2.5">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-fairytale font-bold text-slate-text text-xl">Tajný Ježíšek</h2>
            <p className="mt-1 text-sm text-slate-text-muted leading-relaxed">
              Nikdo z rodiny neuvidí, kdo jaký dárek z jeho dopisu zamluvil.
            </p>
          </div>

          <div className="rounded-2xl bg-paper border border-fir/30 p-4">
            <div className="w-10 h-10 rounded-xl bg-gold-soft text-fir border border-gold/40 flex items-center justify-center mb-2.5">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="font-fairytale font-bold text-slate-text text-xl">Pro babičky i děti</h2>
            <p className="mt-1 text-sm text-slate-text-muted leading-relaxed">
              Vybraný dárek ostatním hned zmizí — žádné dva stejné dárky pod stromečkem.
            </p>
          </div>
        </div>

        {/* Tlačítko Vstoupit přes Google */}
        <div className="relative z-10 mt-7 space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={busy}
            className="min-h-[56px] w-full py-3.5 px-6 rounded-2xl bg-fir hover:bg-fir-hover text-white text-lg font-bold shadow-md border border-gold/40 transition flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            <span>{busy ? 'Otevírám Ježíškovu poštu...' : 'Vstoupit přes Google'}</span>
          </button>

          {error && (
            <p className="text-base text-crimson bg-crimson-soft border border-crimson/30 px-4 py-3 rounded-2xl text-center">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
