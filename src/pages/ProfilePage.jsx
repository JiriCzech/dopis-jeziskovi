import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Link as LinkIcon, LogOut, Save, Trash2, Users } from 'lucide-react';
import {
  AVATAR_BG_COLORS,
  AVATAR_OPTIONS,
  Avatar,
  GiftTagCordSvg,
} from '../assets/avatars';
import { useAuth } from '../hooks/useAuth';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function ProfilePage() {
  const { profile, saveProfileUpdates, signOut, deleteAccount, notify } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [avatarId, setAvatarId] = useState(profile?.avatarId || 'carp');
  const [avatarBg, setAvatarBg] = useState(profile?.avatarBg || AVATAR_BG_COLORS[0].hex);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!profile) return null;

  const liveName = displayName.trim() || profile.displayName;
  const fullTag = `${profile.displayName}#${profile.tag}`;
  const liveTag = `${liveName}#${profile.tag}`;

  const handleCopyTag = async () => {
    try {
      await navigator.clipboard.writeText(fullTag);
      setCopied(true);
      notify(`Zkopírováno: ${fullTag}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify(`Tvůj osobní kód je ${fullTag}`);
    }
  };

  const handleCopyInviteLink = async () => {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://dopis-jeziskovi.vercel.app';
    const link = `${origin}/?invite=${encodeURIComponent(fullTag)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      notify('Zvací odkaz zkopírován do schránky.');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      notify(`Zvací odkaz: ${link}`);
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
      await saveProfileUpdates({
        displayName: cleaned,
        avatarId,
        avatarBg,
      });
    } catch (err) {
      notify(err.message || 'Nepodařilo se uložit úpravy profilu.', 'error');
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
    <div className="max-w-2xl mx-auto space-y-6 animate-page-transition">
      <div className="stationery-sheet rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="stationery-inner-frame" aria-hidden="true" />

        {/* Horní řádek: Pohádkový nadpis Můj profil + tlačítko Odhlásit se v pravém horním rohu */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <h1 className="font-fairytale font-bold text-[32px] sm:text-[38px] leading-tight text-slate-text">
            Můj profil & známka
          </h1>

          <button
            type="button"
            onClick={signOut}
            className="min-h-[46px] whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border-[1.5px] border-fir bg-paper text-sm sm:text-base font-bold text-slate-text hover:bg-fir-soft transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Odhlásit se</span>
          </button>
        </div>

        {/* Živá „Vánoční jmenovka“ s tvou 3D poštovní známkou */}
        <div className="relative z-10 rounded-2xl bg-kraft border-[1.5px] border-fir p-5 sm:p-6 shadow-card overflow-hidden">
          <div
            className="pointer-events-none absolute inset-2 rounded-xl border border-gold/45"
            aria-hidden="true"
          />
          <GiftTagCordSvg className="w-14 h-10 absolute -top-1 -left-1 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 pl-4 sm:pl-6">
            <Avatar
              avatarId={avatarId}
              avatarBg={avatarBg}
              size="xl"
              className="transition-all duration-200"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-fir">
                  Tvoje poštovní jmenovka
                </span>
                <div className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text truncate leading-tight">
                  {liveName}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-sm font-medium text-slate-text-muted">Osobní kód:</span>
                <strong className="text-base font-bold text-fir mr-1">{liveTag}</strong>

                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fir text-white text-xs font-bold hover:bg-fir-hover transition shadow-xs"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{copiedLink ? 'Odkaz zkopírován' : 'Sdílet odkaz'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyTag}
                  className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sheet border border-fir/35 text-xs font-bold text-slate-text hover:bg-fir-soft transition"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-fir shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{copied ? 'Zkopírováno' : 'Zkopírovat kód'}</span>
                </button>

                <Link
                  to="/sdileni"
                  className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sheet border border-fir/35 text-xs font-bold text-fir hover:bg-fir-soft transition"
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>Sdílení a skupiny</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="relative z-10 space-y-6">
          <div>
            <label
              htmlFor="edit-display-name"
              className="block text-base font-bold text-slate-text mb-1.5"
            >
              Jméno na jmenovce a dopisech
            </label>
            <input
              id="edit-display-name"
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl border border-paper-warm bg-paper text-base text-slate-text focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir"
            />
          </div>

          <div>
            <span className="block text-base font-bold text-slate-text mb-2.5">
              Moje poštovní známka (8 vánočních 3D motivů)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AVATAR_OPTIONS.map((opt) => {
                const active = avatarId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAvatarId(opt.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-[1.5px] transition ${
                      active
                        ? 'border-fir bg-fir-soft ring-2 ring-gold/50'
                        : 'border-paper-warm bg-paper hover:bg-kraft/60'
                    }`}
                  >
                    <Avatar avatarId={opt.id} avatarBg={avatarBg} size="md" />
                    <span className="text-sm font-bold text-slate-text text-center leading-tight">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-base font-bold text-slate-text mb-2.5">
              Barva podkladu známky
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
                    className={`w-12 h-12 rounded-full border-2 transition flex items-center justify-center ${
                      active
                        ? 'border-fir scale-110 ring-2 ring-gold'
                        : 'border-black/15 hover:scale-105'
                    }`}
                  >
                    {active && <span className="w-3 h-3 rounded-full bg-fir" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="min-h-[50px] inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-fir hover:bg-fir-hover text-white text-base font-bold shadow-sm border border-gold/40 transition disabled:opacity-60"
          >
            <Save className="w-5 h-5 shrink-0" />
            <span>{saving ? 'Ukládám...' : 'Uložit změny'}</span>
          </button>
        </form>
      </div>

      {/* Smazání účtu */}
      <div className="rounded-3xl bg-sheet border-[1.5px] border-crimson/40 p-6 sm:p-7 space-y-3">
        <h2 className="font-fairytale font-bold text-2xl text-crimson">Smazat profil</h2>
        <p className="text-base text-slate-text-muted leading-relaxed">
          Nenávratně smaže tvůj profil, dopisy i propojení. Dárky, které máš zamluvené pro ostatní,
          se uvolní zpět do jejich dopisů.
        </p>
        <button
          type="button"
          onClick={() => setConfirmDeleteOpen(true)}
          className="min-h-[48px] inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-crimson-soft hover:bg-crimson text-crimson hover:text-white text-base font-bold transition"
        >
          <Trash2 className="w-5 h-5 shrink-0" />
          <span>Smazat profil</span>
        </button>
      </div>

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
