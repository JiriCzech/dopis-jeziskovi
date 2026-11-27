import React, { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Check,
  FileHeart,
  Gift,
  Music,
  RefreshCw,
  ShoppingBag,
  Star,
  UserPlus,
  Users,
  VolumeX,
  X,
} from 'lucide-react';
import { Avatar, FairytaleOrnamentSvg } from '../assets/avatars';
import { KaprikGuide } from './KaprikGuide';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../hooks/useAppData';
import {
  findUserByTag,
  getDemoState,
  joinGroupByInviteCode,
  sendConnectionRequest,
} from '../lib/db';
import {
  isChristmasMusicBoxPlaying,
  stopChristmasMusicBox,
  toggleChristmasMusicBox,
} from '../lib/musicBox';

function getChristmasCountdownText() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const month = today.getMonth();
  const date = today.getDate();

  if (month === 11 && date === 24) {
    return 'Krásný Štědrý den';
  }
  if (month === 11 && (date === 25 || date === 26)) {
    return 'Krásné vánoční svátky';
  }

  let targetYear = today.getFullYear();
  if (month === 11 && date > 26) {
    targetYear += 1;
  }
  const christmasEve = new Date(targetYear, 11, 24);
  const diffDays = Math.round((christmasEve - today) / 86400000);

  if (diffDays === 1) return 'Do Štědrého dne zbývá 1 den';
  if (diffDays >= 2 && diffDays <= 4) return `Do Štědrého dne zbývají ${diffDays} dny`;
  return `Do Štědrého dne zbývá ${diffDays} dní`;
}

const AtmosphereBackground = memo(function AtmosphereBackground() {
  return (
    <div
      className="no-print pointer-events-none fixed inset-0 z-0 paper-grain-overlay"
      aria-hidden="true"
    />
  );
});

const COUNTDOWN_TEXT = getChristmasCountdownText();

export function Layout({ children, onboardingMode = false }) {
  const {
    authUser,
    profile,
    demoMode,
    pendingInviteCode,
    clearPendingInviteCode,
    toast,
    dismissToast,
    undoToast,
    dismissUndoToast,
    notify,
    changeDemoPersona,
    resetDemo,
  } = useAuth();
  const { pendingRequestsCount, unboughtShoppingCount } = useAppData();

  const navigate = useNavigate();
  const location = useLocation();
  const isLetterRoute = location.pathname === '/' || location.pathname.startsWith('/dopis');
  const [joiningInvite, setJoiningInvite] = useState(false);
  const [musicOn, setMusicOn] = useState(() => isChristmasMusicBoxPlaying());

  useEffect(() => {
    return () => {
      stopChristmasMusicBox();
    };
  }, []);

  const handleToggleMusic = () => {
    const next = toggleChristmasMusicBox();
    setMusicOn(next);
  };

  const demoUsers = demoMode ? Object.values(getDemoState().users || {}) : [];
  const isGroupInvite = /^SKUPINA-\d{3,6}$/i.test(pendingInviteCode || '');

  const handleConfirmPendingInvite = async () => {
    if (!authUser || !pendingInviteCode) return;
    setJoiningInvite(true);
    try {
      if (isGroupInvite) {
        const joined = await joinGroupByInviteCode(authUser.uid, pendingInviteCode);
        notify(`Připojil/a ses do skupiny „${joined.name}“.`);
      } else {
        const found = await findUserByTag(pendingInviteCode, authUser.uid);
        await sendConnectionRequest(authUser.uid, found.uid);
        notify(`Pozvánka byla odeslána pro ${found.displayName}.`);
      }
      clearPendingInviteCode();
      navigate('/rodina');
    } catch (err) {
      notify(err.message || 'Pozvánku se nepodařilo použít.', 'error');
      clearPendingInviteCode();
      navigate('/rodina');
    } finally {
      setJoiningInvite(false);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `min-h-[44px] whitespace-nowrap inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-[15px] font-bold transition relative ${
      isActive
        ? 'bg-fir text-white shadow-sm border border-gold/45'
        : 'text-slate-text hover:bg-fir-soft/80'
    }`;

  return (
    <div
      className={`min-h-screen flex flex-col ${
        onboardingMode ? 'pb-10' : 'pb-32'
      } md:pb-14 relative overflow-x-hidden max-w-full`}
    >
      <AtmosphereBackground />

      {/* Ukázkový přepínač osob (pouze při ?demo=1 mimo čistý onboarding) */}
      {!onboardingMode && demoMode && (
        <div className="demo-banner no-print relative z-20 bg-gold-soft border-b border-fir/30 px-4 py-2 text-sm text-slate-text">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-text">
                Ukázka (přepnout osobu):
              </span>
              <div className="flex flex-wrap gap-2">
                {demoUsers.map((u) => (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => changeDemoPersona(u.uid)}
                    className={`min-h-[44px] px-3.5 py-1.5 rounded-full border text-sm font-semibold transition ${
                      u.uid === profile?.uid
                        ? 'bg-fir text-white border-fir'
                        : 'bg-sheet text-slate-text border-paper-warm hover:bg-paper'
                    }`}
                  >
                    {u.displayName}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={resetDemo}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-2 text-sm font-semibold text-fir hover:underline"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Obnovit ukázku</span>
            </button>
          </div>
        </div>
      )}

      {/* Klidná horní navigace bez rozptylujících prvků */}
      {!onboardingMode && (
        <header className="no-print relative z-20 bg-sheet/95 backdrop-blur-md border-b border-paper-warm sticky top-0 shadow-xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 min-h-[68px] md:h-[74px] py-2 flex items-center justify-between gap-3">
            <NavLink to="/dopis" className="flex items-center gap-2.5 group shrink-0">
              <div>
                <div className="font-fairytale font-bold text-fir text-xl sm:text-2xl leading-none whitespace-nowrap">
                  Dopis Ježíškovi
                </div>
                <div className="text-xs text-slate-text-muted flex items-center gap-1 whitespace-nowrap mt-0.5">
                  <Star className="w-3 h-3 text-gold fill-gold shrink-0" />
                  <span>{COUNTDOWN_TEXT}</span>
                </div>
              </div>
            </NavLink>

            {/* 4 hlavní záložky na desktopu */}
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Hlavní navigace">
              <NavLink
                to="/"
                end
                className={({ isActive }) => navLinkClass({ isActive: isActive || isLetterRoute })}
              >
                <FileHeart className="w-4 h-4 shrink-0" />
                <span>Napsat dopis</span>
              </NavLink>

              <NavLink to="/rodina" className={navLinkClass}>
                <Gift className="w-4 h-4 shrink-0" />
                <span>Komu koupit dárek</span>
              </NavLink>

              <NavLink to="/nakupni-seznam" className={navLinkClass}>
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Můj nákupní seznam</span>
                {unboughtShoppingCount > 0 && (
                  <span className="ml-0.5 px-2 py-0.5 text-xs font-bold rounded-full bg-crimson text-white leading-none">
                    {unboughtShoppingCount}
                  </span>
                )}
              </NavLink>

              <NavLink to="/sdileni" className={navLinkClass}>
                <Users className="w-4 h-4 shrink-0" />
                <span>Sdílení a skupiny</span>
                {pendingRequestsCount > 0 && (
                  <span className="ml-0.5 px-2 py-0.5 text-xs font-bold rounded-full bg-crimson text-white leading-none">
                    {pendingRequestsCount}
                  </span>
                )}
              </NavLink>
            </nav>

            {/* Odkaz do profilu vpravo */}
            <div className="flex items-center shrink-0">
              {profile && (
                <NavLink
                  to="/profil"
                  title="Můj profil a poštovní známka"
                  className="min-h-[52px] inline-flex items-center gap-2.5 px-2.5 py-1 rounded-2xl hover:bg-fir-soft/60 border border-transparent hover:border-fir/25 transition-colors shrink-0"
                >
                  <Avatar avatarId={profile.avatarId} avatarBg={profile.avatarBg} size="nav" zoomAnimal />
                  <span className="font-fairytale font-bold text-[18px] leading-none text-slate-text whitespace-nowrap max-w-[110px] sm:max-w-[160px] truncate">
                    {profile.displayName}
                  </span>
                </NavLink>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Hlavní obsah */}
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 min-w-0">
        {children}
      </main>

      {/* Tichý Kapřík průvodce (promluví až na kliknutí uživatele) */}
      <KaprikGuide
        variant="floating"
        contextKey={onboardingMode ? 'profil-onboarding' : undefined}
      />

      {/* Patička aplikace s nenápadným ovládáním koledy */}
      <footer className="no-print relative z-10 max-w-3xl w-full mx-auto px-4 sm:px-6 pt-4 pb-8 text-center">
        <div className="border-t border-fir/15 pt-6 flex flex-col items-center gap-3">
          <FairytaleOrnamentSvg className="w-36 h-6 opacity-75" />
          <p className="font-fairytale italic text-lg sm:text-xl text-slate-text-muted">
            Dopis Ježíškovi
          </p>
          {!onboardingMode && (
            <button
              type="button"
              onClick={handleToggleMusic}
              title={musicOn ? 'Vypnout vánoční hrací skříňku' : 'Pustit jemnou vánoční koledu'}
              aria-label={musicOn ? 'Vypnout vánoční koledu' : 'Pustit vánoční koledu'}
              aria-pressed={musicOn}
              className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                musicOn
                  ? 'bg-fir-soft border-fir text-fir'
                  : 'bg-sheet/80 border-paper-warm text-slate-text-muted hover:text-slate-text hover:bg-sheet'
              }`}
            >
              {musicOn ? (
                <Music className="w-4 h-4 text-fir shrink-0" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-text-muted shrink-0" />
              )}
              <span>{musicOn ? 'Koleda hraje — vypnout' : 'Pustit vánoční koledu'}</span>
            </button>
          )}
        </div>
      </footer>

      {/* Pevná spodní mobilní navigace (< 768px, skrytá během prvního zakládání profilu) */}
      {!onboardingMode && (
        <nav
          className="no-print md:hidden fixed bottom-0 inset-x-0 z-40 bg-sheet/95 backdrop-blur-md border-t border-paper-warm px-1.5 py-1.5 grid grid-cols-4 gap-1 shadow-soft"
          aria-label="Mobilní navigace"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `min-h-[48px] flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded-xl text-xs font-bold whitespace-nowrap ${
                isActive || isLetterRoute
                  ? 'text-fir bg-fir-soft border border-fir/20'
                  : 'text-slate-text-muted'
              }`
            }
          >
            <FileHeart className="w-5 h-5 shrink-0" />
            <span>Dopis</span>
          </NavLink>

          <NavLink
            to="/rodina"
            className={({ isActive }) =>
              `min-h-[48px] flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded-xl text-xs font-bold relative whitespace-nowrap ${
                isActive ? 'text-fir bg-fir-soft border border-fir/20' : 'text-slate-text-muted'
              }`
            }
          >
            <Gift className="w-5 h-5 shrink-0" />
            <span>Rodina</span>
          </NavLink>

          <NavLink
            to="/nakupni-seznam"
            className={({ isActive }) =>
              `min-h-[48px] flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded-xl text-xs font-bold relative whitespace-nowrap ${
                isActive ? 'text-fir bg-fir-soft border border-fir/20' : 'text-slate-text-muted'
              }`
            }
          >
            <ShoppingBag className="w-5 h-5 shrink-0" />
            <span>Nákup</span>
            {unboughtShoppingCount > 0 && (
              <span className="absolute top-1 right-3 px-1.5 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full bg-crimson text-white flex items-center justify-center">
                {unboughtShoppingCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/sdileni"
            className={({ isActive }) =>
              `min-h-[48px] flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded-xl text-xs font-bold relative whitespace-nowrap ${
                isActive ? 'text-fir bg-fir-soft border border-fir/20' : 'text-slate-text-muted'
              }`
            }
          >
            <Users className="w-5 h-5 shrink-0" />
            <span>Sdílení</span>
            {pendingRequestsCount > 0 && (
              <span className="absolute top-1 right-3 px-1.5 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full bg-crimson text-white flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </NavLink>
        </nav>
      )}

      {/* Kompaktní, klidná notifikace s možností Zpět (vpravo dole na desktopu, vlevo od kapříka nad lištou na mobilu) */}
      {undoToast && (
        <div className="no-print fixed bottom-20 md:bottom-5 left-3 right-20 sm:left-auto sm:right-24 xl:bottom-6 xl:right-6 z-50 flex justify-start sm:justify-end pointer-events-none animate-fade-in">
          <div
            role="status"
            aria-live="polite"
            style={{ backgroundColor: '#FFFDF8' }}
            className="pointer-events-auto w-auto max-w-sm rounded-2xl bg-[#FFFDF8] text-slate-text pl-3.5 pr-1.5 py-1.5 shadow-paper border border-fir/50 flex items-center gap-2"
          >
            <span className="w-5 h-5 rounded-full bg-fir-soft text-fir inline-flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[2.75]" />
            </span>
            <span className="font-sans text-sm font-semibold text-slate-text leading-snug">
              {undoToast.message || 'Hotovo'}
            </span>
            <button
              type="button"
              onClick={async () => {
                const fn = undoToast.onUndo;
                dismissUndoToast();
                if (fn) await fn();
              }}
              className="min-h-[44px] px-2.5 inline-flex items-center justify-center font-sans text-sm font-bold text-fir hover:text-fir-dark underline underline-offset-4 shrink-0 transition"
            >
              Zpět
            </button>
            <button
              type="button"
              onClick={dismissUndoToast}
              className="min-w-[40px] min-h-[44px] -ml-1.5 inline-flex items-center justify-center text-slate-text-muted hover:text-slate-text rounded-xl hover:bg-paper transition shrink-0"
              aria-label="Zavřít"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Běžná kompaktní notifikace */}
      {toast && !undoToast && (
        <div className="no-print fixed bottom-20 md:bottom-5 left-3 right-20 sm:left-auto sm:right-24 xl:bottom-6 xl:right-6 z-50 flex justify-start sm:justify-end pointer-events-none animate-fade-in">
          <div
            role="status"
            aria-live="polite"
            style={toast.type === 'error' ? undefined : { backgroundColor: '#FFFDF8' }}
            className={`pointer-events-auto w-auto max-w-sm rounded-2xl pl-3.5 pr-1.5 py-1.5 shadow-paper border flex items-center gap-2 text-sm font-semibold ${
              toast.type === 'error'
                ? 'bg-crimson-soft border-crimson/55 text-crimson'
                : 'bg-[#FFFDF8] text-slate-text border-fir/50'
            }`}
          >
            {toast.type !== 'error' && (
              <span className="w-5 h-5 rounded-full bg-fir-soft text-fir inline-flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[2.75]" />
              </span>
            )}
            <span className="leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={dismissToast}
              className="min-w-[40px] min-h-[44px] -ml-1 inline-flex items-center justify-center text-slate-text-muted hover:text-slate-text rounded-xl hover:bg-paper/60 shrink-0 transition"
              aria-label="Zavřít oznámení"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Okamžité připojení jedním klikem z odkazu (?invite=..., mimo onboarding) */}
      {!onboardingMode &&
        authUser &&
        profile &&
        pendingInviteCode &&
        createPortal(
          <div
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !joiningInvite) {
                clearPendingInviteCode();
              }
            }}
            style={{ backgroundColor: 'rgba(24, 26, 25, 0.68)', zIndex: 9999 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print"
          >
            <div
              role="dialog"
              aria-modal="true"
              style={{ backgroundColor: '#FFFDF8' }}
              className="w-full max-w-md rounded-2xl bg-[#FFFDF8] border border-paper-warm shadow-2xl p-6 animate-slide-up space-y-5 relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-fir-soft text-fir border border-fir/25 flex items-center justify-center shrink-0">
                    {isGroupInvite ? (
                      <Users className="w-6 h-6" />
                    ) : (
                      <UserPlus className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text leading-tight">
                      {isGroupInvite ? 'Pozvánka do skupiny' : 'Pozvánka k propojení'}
                    </h3>
                    <p className="mt-1.5 text-base text-slate-text-muted leading-relaxed">
                      {isGroupInvite ? (
                        <>
                          Otevřel/a jsi zvací odkaz do skupiny{' '}
                          <strong className="text-fir">{pendingInviteCode.toUpperCase()}</strong>.
                          Chceš se rovnou připojit?
                        </>
                      ) : (
                        <>
                          Otevřel/a jsi zvací odkaz pro{' '}
                          <strong className="text-fir">{pendingInviteCode}</strong>. Chceš odeslat
                          žádost o propojení?
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearPendingInviteCode}
                  disabled={joiningInvite}
                  className="min-w-[44px] min-h-[44px] -mt-1 -mr-1.5 rounded-xl flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-paper transition shrink-0"
                  aria-label="Zavřít"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                <button
                  type="button"
                  onClick={clearPendingInviteCode}
                  disabled={joiningInvite}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl border border-paper-warm bg-paper text-base font-semibold text-slate-text hover:bg-kraft transition"
                >
                  Teď ne
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPendingInvite}
                  disabled={joiningInvite}
                  className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-fir hover:bg-fir-hover text-white text-base font-bold shadow-sm transition disabled:opacity-60"
                >
                  <Check className="w-5 h-5 shrink-0" />
                  <span>
                    {joiningInvite
                      ? 'Připojuji...'
                      : isGroupInvite
                        ? 'Připojit se do skupiny'
                        : 'Odeslat pozvánku'}
                  </span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
