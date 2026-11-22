import React, { useState } from 'react';
import { KaprikGuide } from '../components/KaprikGuide';
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-5 py-10 sm:py-16">
      <div className="w-full max-w-2xl flex flex-col items-center text-center space-y-8 sm:space-y-10 animate-page-transition">
        {/* 1. Čistý hlavní název aplikace */}
        <header>
          <h1 className="font-fairytale text-5xl sm:text-6xl md:text-7xl font-bold text-[#1B4332] tracking-tight leading-none">
            Dopis Ježíškovi
          </h1>
        </header>

        {/* 2. Velký celopostavový 3D Kapřík + mluvící bublina nad ním */}
        <KaprikGuide variant="login" contextKey="login" />

        {pendingInviteCode && (
          <div className="px-5 py-2.5 rounded-2xl bg-[#FFFDF8] border-[1.5px] border-[#1B4332] text-sm sm:text-base text-[#1E2421] shadow-xs">
            Pozvánka <strong className="text-[#1B4332]">{pendingInviteCode}</strong>
          </div>
        )}

        {/* 3. Jediné jasné tlačítko akce pod nimi */}
        <div className="w-full max-w-sm space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={busy}
            className="min-h-[56px] w-full py-3.5 px-7 rounded-2xl bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FFFDF8] text-lg font-bold shadow-soft border-[1.5px] border-[#C9963B] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            <span>{busy ? 'Otevírám...' : 'Vstoupit přes Google'}</span>
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
