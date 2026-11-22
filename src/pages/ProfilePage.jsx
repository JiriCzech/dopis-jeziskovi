import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import {
  AVATAR_OPTIONS,
  Avatar,
  normalizeStampId,
  RedWhiteTwineCordSvg,
  RoundPostmarkSvg,
} from '../assets/avatars';
import { useAuth } from '../hooks/useAuth';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function ProfilePage({ isSetup = false }) {
  const {
    profile,
    completeProfileSetup,
    saveProfileUpdates,
    signOut,
    deleteAccount,
    notify,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isFirstSetup = isSetup || searchParams.get('setup') === '1' || !profile;

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [avatarId, setAvatarId] = useState(() =>
    normalizeStampId(profile?.avatarId || 'prasatko')
  );
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const liveName = displayName.trim() || profile?.displayName || 'Tvoje jméno';
  const fullTag = profile ? `${profile.displayName}#${profile.tag}` : '';

  const handleCopyTag = async () => {
    if (!fullTag) return;
    try {
      await navigator.clipboard.writeText(fullTag);
      setCopied(true);
      notify(`Zkopírováno: ${fullTag}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify(`Tvůj osobní kód je ${fullTag}`);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cleaned = displayName.trim();
    if (cleaned.length < 2) {
      notify('Jméno musí mít alespoň 2 znaky.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (!profile) {
        await completeProfileSetup({
          displayName: cleaned,
          avatarId,
          avatarBg: '#F5EEDB',
        });
        navigate('/');
      } else {
        await saveProfileUpdates({
          displayName: cleaned,
          avatarId,
          avatarBg: '#F5EEDB',
        });
        if (isFirstSetup) {
          navigate('/');
        }
      }
    } catch (err) {
      notify(err.message || 'Nepodařilo se uložit profil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      setConfirmDeleteOpen(false);
    } catch (err) {
      notify(
        err.message || 'Smazání účtu se nezdařilo. Zkus se prosím znovu přihlásit a akci opakovat.',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-page-transition py-2">
      {/* 1. Realistická papírová dárková jmenovka s nalepenou známkou a kroucenou červeno-bílou šňůrkou */}
      <div className="relative pt-8">
        <RedWhiteTwineCordSvg className="w-14 h-16 absolute -top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none" />

        <div
          style={{ filter: 'drop-shadow(0 12px 24px rgba(45, 38, 26, 0.16))' }}
          className="relative"
        >
          <div className="profile-paper-tag relative px-6 sm:px-10 pt-11 pb-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Jemná vnitřní linka jmenovky */}
            <div
              className="pointer-events-none absolute inset-3 border border-[#C9963B]/45 rounded-b-2xl"
              style={{
                clipPath:
                  'polygon(20px 0%, calc(100% - 20px) 0%, 100% 20px, 100% 100%, 0% 100%, 0% 20px)',
              }}
              aria-hidden="true"
            />

            {/* 1. Vlevo nalepená vybraná poštovní známka se zoubkovaným okrajem (-rotate-2) + kulaté poštovní razítko přes roh */}
            <div className="relative shrink-0 -rotate-2">
              <Avatar avatarId={avatarId} size="xl" onTag />
              <RoundPostmarkSvg className="w-16 h-16 absolute -bottom-3 -right-5 pointer-events-none" />
            </div>

            {/* 2. Uprostřed velkým písmem Cormorant Garamond jméno uživatele */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="font-fairytale font-bold text-4xl sm:text-5xl text-[#1E2421] leading-tight tracking-tight break-words">
                {liveName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Čistý formulář: Jméno + 6 ručně kreslených poštovních známek */}
      <form onSubmit={handleSave} className="space-y-8">
        <div>
          <label
            htmlFor="edit-display-name"
            className="block text-lg font-bold text-[#1E2421] mb-2"
          >
            Jak ti doma říkají?
          </label>
          <input
            id="edit-display-name"
            type="text"
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Např. Jirka, Babička Marie, Anička..."
            className="w-full min-h-[54px] px-5 py-3 rounded-2xl border-[1.5px] border-[#1B4332] bg-[#FFFDF8] text-lg font-semibold text-[#1E2421] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#C9963B]/50"
          />
        </div>

        {/* Mřížka 6 ručně kreslených poštovních známek (3 × 2 na desktopu, 2 × 3 na mobilu) */}
        <div>
          <span className="block text-lg font-bold text-[#1E2421] mb-4">
            Vyber si svou poštovní známku
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-7 gap-x-5 pt-1">
            {AVATAR_OPTIONS.map((opt) => {
              const active = avatarId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAvatarId(opt.id)}
                  className={`group flex flex-col items-center gap-2.5 focus:outline-none transition-transform duration-200 ${
                    active ? '-translate-y-1.5' : 'hover:-translate-y-1'
                  }`}
                >
                  <div className="relative">
                    <Avatar
                      avatarId={opt.id}
                      size="stampGrid"
                      selected={active}
                    />
                    {active && (
                      <RoundPostmarkSvg className="w-13 h-13 absolute -bottom-2 -right-3 pointer-events-none animate-fade-in" />
                    )}
                  </div>
                  <span
                    className={`text-base leading-tight text-center transition-colors ${
                      active
                        ? 'font-bold text-[#1B4332]'
                        : 'font-medium text-[#525E58] group-hover:text-[#1E2421]'
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hlavní tlačítko dole */}
        <button
          type="submit"
          disabled={saving}
          className="min-h-[56px] w-full py-3.5 px-7 rounded-2xl bg-[#1B4332] hover:bg-[#2D6A4F] text-[#FFFDF8] text-lg font-bold shadow-soft border-[1.5px] border-[#C9963B] transition disabled:opacity-60"
        >
          {saving
            ? 'Ukládám...'
            : isFirstSetup
              ? 'Hotovo, jdeme psát dopis'
              : 'Uložit změny'}
        </button>
      </form>

      {/* Diskrétní patička profilu (mimo jmenovku, pouze pro již založený účet) */}
      {profile && (
        <div className="pt-4 border-t border-[#1B4332]/15 flex flex-wrap items-center justify-between gap-4 text-sm text-[#525E58]">
          <div className="flex items-center gap-2">
            <span>Tvůj kód:</span>
            <strong className="font-bold text-[#1E2421]">{fullTag}</strong>
            <button
              type="button"
              onClick={handleCopyTag}
              title="Zkopírovat osobní kód"
              aria-label="Zkopírovat osobní kód"
              className="p-1.5 rounded-lg hover:bg-[#EFE5D1] text-[#1B4332] transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={signOut}
              className="font-semibold text-[#525E58] hover:text-[#1E2421] underline underline-offset-4 transition"
            >
              Odhlásit se
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="text-xs text-[#525E58]/75 hover:text-crimson underline underline-offset-4 transition"
            >
              Smazat účet
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        danger
        loading={deleting}
        title="Opravdu chceš smazat svůj profil?"
        description="Smazáním zmizí tvůj profil, dopisy, propojení i skupiny a uvolní se tvoje rezervace dárků pro ostatní."
        confirmLabel="Smazat profil"
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
