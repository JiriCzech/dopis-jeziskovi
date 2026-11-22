import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import {
  AVATAR_OPTIONS,
  Avatar,
  normalizeStampId,
} from '../assets/avatars';
import { PENDING_INVITE_STORAGE_KEY, useAuth } from '../hooks/useAuth';
import {
  findUserByTag,
  joinGroupByInviteCode,
  needsOnboarding,
  sendConnectionRequest,
} from '../lib/db';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function ProfilePage({ isSetup = false }) {
  const {
    authUser,
    profile,
    pendingInviteCode,
    clearPendingInviteCode,
    refreshPendingCount,
    completeProfileSetup,
    saveProfileUpdates,
    signOut,
    deleteAccount,
    notify,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isOnboarding =
    isSetup ||
    searchParams.get('setup') === '1' ||
    !profile ||
    needsOnboarding(profile);

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [avatarId, setAvatarId] = useState(() =>
    normalizeStampId(profile?.avatarId || 'prasatko')
  );
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || '');
    setAvatarId(normalizeStampId(profile.avatarId || 'prasatko'));
  }, [profile?.uid]);

  const liveName = displayName.trim() || profile?.displayName || 'Tvoje jméno';
  const fullTag = profile ? `${profile.displayName}#${profile.tag}` : '';

  const readStoredInviteCode = () => {
    try {
      return (sessionStorage.getItem(PENDING_INVITE_STORAGE_KEY) || pendingInviteCode || '').trim();
    } catch {
      return (pendingInviteCode || '').trim();
    }
  };

  const activeOnboardingInvite = isOnboarding ? readStoredInviteCode() : '';

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
      let savedProfile = profile;
      if (!profile) {
        savedProfile = await completeProfileSetup({
          displayName: cleaned,
          avatarId,
          avatarBg: '#F5EEDB',
          onboardingCompleted: true,
        });
      } else {
        savedProfile = await saveProfileUpdates(
          {
            displayName: cleaned,
            avatarId,
            avatarBg: '#F5EEDB',
            onboardingCompleted: true,
          },
          { silent: isOnboarding }
        );
      }

      if (isOnboarding) {
        const inviteToProcess = readStoredInviteCode();
        clearPendingInviteCode();

        if (inviteToProcess) {
          const uid = savedProfile?.uid || authUser?.uid;
          try {
            if (/^SKUPINA-\d{3,6}$/i.test(inviteToProcess)) {
              const joined = await joinGroupByInviteCode(uid, inviteToProcess);
              await refreshPendingCount();
              notify(`Vítej! Připojil/a ses do skupiny „${joined.name}“.`);
            } else {
              const found = await findUserByTag(inviteToProcess, uid);
              await sendConnectionRequest(uid, found.uid);
              await refreshPendingCount();
              notify(`Vítej! Pozvánka pro ${found.displayName} byla odeslána ✓`);
            }
            navigate('/dopis', { replace: true });
          } catch (inviteErr) {
            notify(
              inviteErr.message || 'Zvací kód z odkazu můžeš potvrdit tady.',
              'error'
            );
            navigate(`/sdileni?code=${encodeURIComponent(inviteToProcess)}`, {
              replace: true,
            });
          }
          return;
        }

        navigate('/dopis', { replace: true });
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
      {/* 1. 3D dárková jmenovka s nalepenou poštovní známkou a jménem v písmu Cormorant Garamond */}
      <div className="relative w-full">
        <img
          src="/assets/visacka-3d.png"
          alt=""
          draggable={false}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none drop-shadow-[0_14px_26px_rgba(45,38,26,0.18)]"
        />
        <div className="relative z-10 min-h-[175px] sm:min-h-[256px] pl-24 sm:pl-36 pr-6 sm:pr-12 py-6 sm:py-8 flex flex-row items-center gap-4 sm:gap-8">
          <div className="shrink-0">
            <Avatar avatarId={avatarId} size="xl" onTag />
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="font-fairytale font-bold text-3xl sm:text-5xl text-[#1E2421] leading-tight tracking-tight break-words">
              {liveName}
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
            Tvoje jméno
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

        {/* Mřížka 6 ručně kreslených poštovních známek */}
        <div>
          <span className="block text-lg font-bold text-[#1E2421] mb-4">
            Poštovní známka
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-7 gap-x-5 pt-1">
            {AVATAR_OPTIONS.map((opt) => {
              const active = avatarId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAvatarId(opt.id)}
                  className="group flex flex-col items-center gap-2.5 focus:outline-none"
                >
                  <div className="relative">
                    <Avatar
                      avatarId={opt.id}
                      size="stampGrid"
                      selected={active}
                    />
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
            ? isOnboarding
              ? 'Připravuji dopis...'
              : 'Ukládám...'
            : isOnboarding
              ? 'Hotovo, jdeme psát dopis →'
              : 'Uložit'}
        </button>
      </form>

      {isOnboarding && activeOnboardingInvite && (
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FFFDF8] border border-[#1B4332]/25 text-sm text-[#4A544E]">
            Zvací kód připraven k propojení:{' '}
            <strong className="font-bold text-[#1B4332]">{activeOnboardingInvite}</strong>
          </span>
        </div>
      )}

      {/* Diskrétní patička profilu (pouze mimo onboarding režim) */}
      {profile && !isOnboarding && (
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
