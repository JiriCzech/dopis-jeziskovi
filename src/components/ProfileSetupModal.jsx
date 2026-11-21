import React, { useState } from 'react';
import { AVATAR_BG_COLORS, AVATAR_OPTIONS, Avatar } from '../assets/avatars';
import { useAuth } from '../hooks/useAuth';

export function ProfileSetupModal() {
  const { completeProfileSetup, signOut, notify } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState('star');
  const [avatarBg, setAvatarBg] = useState(AVATAR_BG_COLORS[0].hex);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleaned = displayName.trim();
    if (cleaned.length < 2) {
      setError('Zadej prosím jméno alespoň o 2 znacích.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const created = await completeProfileSetup({
        displayName: cleaned,
        avatarId,
        avatarBg,
      });
      notify(`Profil vytvořen. Tvůj kód pro rodinu je ${created.displayName}#${created.tag}`);
    } catch (err) {
      setError(err.message || 'Nepodařilo se uložit profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl bg-sheet rounded-3xl border border-paper-warm shadow-paper p-6 sm:p-8 animate-slide-up">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="font-fairytale font-bold text-[32px] sm:text-[36px] leading-tight text-slate-text">
            Vytvořit profil
          </h1>
          <button
            type="button"
            onClick={signOut}
            className="text-sm text-slate-text-muted hover:text-crimson underline"
          >
            Odhlásit se
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-paper border border-paper-warm">
            <Avatar avatarId={avatarId} avatarBg={avatarBg} size="xl" />
            <div className="w-full">
              <label
                htmlFor="profile-display-name"
                className="block text-base font-bold text-slate-text mb-1.5"
              >
                Jak se jmenuješ?
              </label>
              <input
                id="profile-display-name"
                type="text"
                maxLength={50}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Např. Jirka, Anička, Babička Marie..."
                className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl border border-paper-warm bg-sheet text-base text-slate-text placeholder:text-slate-text-muted/60 focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir"
                autoFocus
              />
            </div>
          </div>

          <div>
            <span className="block text-base font-bold text-slate-text mb-2.5">
              Vánoční obrázek
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {AVATAR_OPTIONS.map((opt) => {
                const active = avatarId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAvatarId(opt.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition ${
                      active
                        ? 'border-fir bg-fir-soft/60 ring-2 ring-fir/25'
                        : 'border-paper-warm bg-paper hover:bg-paper-warm/40'
                    }`}
                  >
                    <Avatar avatarId={opt.id} avatarBg={avatarBg} size="md" />
                    <span className="text-xs font-semibold text-slate-text text-center leading-tight">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-base font-bold text-slate-text mb-2.5">
              Barva pozadí
            </span>
            <div className="flex flex-wrap gap-3">
              {AVATAR_BG_COLORS.map((color) => {
                const active = avatarBg === color.hex;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setAvatarBg(color.hex)}
                    title={color.name}
                    aria-label={color.name}
                    style={{ backgroundColor: color.hex }}
                    className={`w-11 h-11 rounded-full border-2 transition flex items-center justify-center ${
                      active
                        ? 'border-fir scale-110 ring-2 ring-fir/25'
                        : 'border-black/10 hover:scale-105'
                    }`}
                  >
                    {active && <span className="w-2.5 h-2.5 rounded-full bg-fir" />}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-base text-crimson bg-crimson-soft px-4 py-2.5 rounded-2xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="min-h-[50px] w-full py-3.5 px-6 rounded-2xl bg-fir hover:bg-fir-dark text-white text-base font-bold shadow-sm transition disabled:opacity-60"
          >
            {saving ? 'Ukládám...' : 'Pokračovat'}
          </button>
        </form>
      </div>
    </div>
  );
}
