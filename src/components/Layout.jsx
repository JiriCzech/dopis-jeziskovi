import React, { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Check,
  FileHeart,
  Gift,
  Music,
  RefreshCw,
  ShoppingBag,
  Star,
  Undo2,
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

// 15 průsvitných vloček na desktopu, 8 na mobilu (čistá GPU translate3d animace)
const BG_SNOWFLAKES = [
  { left: '5%', duration: '24s', delay: '0s', size: '16px', opacity: 0.34, sway: '16px', desktopOnly: false },
  { left: '16%', duration: '27s', delay: '3s', size: '14px', opacity: 0.28, sway: '-14px', desktopOnly: false },
  { left: '28%', duration: '23s', delay: '1.5s', size: '17px', opacity: 0.32, sway: '15px', desktopOnly: false },
  { left: '41%', duration: '29s', delay: '6s', size: '13px', opacity: 0.25, sway: '-16px', desktopOnly: false },
  { left: '53%', duration: '25s', delay: '0.8s', size: '17px', opacity: 0.32, sway: '18px', desktopOnly: false },
  { left: '66%', duration: '28s', delay: '4.5s', size: '14px', opacity: 0.26, sway: '-14px', desktopOnly: false },
  { left: '79%', duration: '24s', delay: '2.2s', size: '18px', opacity: 0.34, sway: '16px', desktopOnly: false },
  { left: '91%', duration: '26s', delay: '5s', size: '14px', opacity: 0.28, sway: '-12px', desktopOnly: false },
  // Doplňkové vločky pouze na větších obrazovkách (celkem 15)
  { left: '11%', duration: '31s', delay: '8s', size: '13px', opacity: 0.24, sway: '14px', desktopOnly: true },
  { left: '22%', duration: '28s', delay: '4s', size: '15px', opacity: 0.26, sway: '-13px', desktopOnly: true },
  { left: '35%', duration: '30s', delay: '10s', size: '15px', opacity: 0.25, sway: '-15px', desktopOnly: true },
  { left: '47%', duration: '32s', delay: '7s', size: '12px', opacity: 0.23, sway: '13px', desktopOnly: true },
  { left: '60%', duration: '27s', delay: '9s', size: '16px', opacity: 0.28, sway: '-16px', desktopOnly: true },
  { left: '73%', duration: '33s', delay: '11s', size: '13px', opacity: 0.23, sway: '15px', desktopOnly: true },
  { left: '85%', duration: '29s', delay: '6.5s', size: '15px', opacity: 0.26, sway: '-14px', desktopOnly: true },
];

const BG_BOKEH_LIGHTS = [
  { left: '10%', top: '16%', size: '160px', duration: '20s', delay: '0s', desktopOnly: false },
  { left: '76%', top: '12%', size: '180px', duration: '24s', delay: '3s', desktopOnly: false },
  { left: '46%', top: '74%', size: '190px', duration: '22s', delay: '5s', desktopOnly: false },
  { left: '22%', top: '48%', size: '180px', duration: '21s', delay: '4s', desktopOnly: true },
  { left: '82%', top: '54%', size: '170px', duration: '25s', delay: '2s', desktopOnly: true },
];

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
      className="no-print pointer-events-none fixed inset-0 overflow-hidden z-0 paper-grain-overlay"
      aria-hidden="true"
    >
      {BG_BOKEH_LIGHTS.map((light, i) => (
        <span
          key={`bokeh-${i}`}
          className={`bg-bokeh ${light.desktopOnly ? 'hidden md:block' : ''}`}
          style={{
            left: light.left,
            top: light.top,
            width: light.size,
            height: light.size,
            '--duration': light.duration,
            '--delay': light.delay,
          }}
        />
      ))}

      {BG_SNOWFLAKES.map((flake, i) => (
        <span
          key={`flake-${i}`}
          className={`bg-snowflake ${flake.desktopOnly ? 'hidden md:block' : ''}`}
          style={{
            left: flake.left,
            fontSize: flake.size,
            '--duration': flake.duration,
            '--delay': flake.delay,
            '--flake-opacity': flake.opacity,
            '--sway': flake.sway,
          }}
        >
          ❄
        </span>
      ))}
    </div>
  );
});

const COUNTDOWN_TEXT = getChristmasCountdownText();

export function Layout({ children }) {
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
    `min-h-[46px] whitespace-nowrap inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-[15px] font-bold transition relative ${
      isActive
        ? 'bg-fir text-white shadow-sm border border-gold/45'
        : 'text-slate-text hover:bg-fir-soft/80'
    }`;

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-12 relative overflow-x-hidden max-w-full">
      {/* Sdílený SVG filtr pro přirozený organický okraj ručního papíru */}
      <svg className="sr-only" aria-hidden="true">
        <defs>
          <filter id="handmade-paper-edge">
            <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <AtmosphereBackground />

      {/* Ukázkový přepínač osob (pouze při ?demo=1) */}
      {demoMode && (
        <div className="demo-banner no-print relative z-20 bg-gold-soft border-b border-fir/30 px-4 py-2 text-sm text-slate-text">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-text">
                Ukázka (přepnout osobu):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {demoUsers.map((u) => (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => changeDemoPersona(u.uid)}
                    className={`px-3 py-1 rounded-full border text-sm font-semibold transition ${
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
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-fir hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Obnovit ukázku</span>
            </button>
          </div>
        </div>
      )}

      {/* Horní navigace aplikace Dopis Ježíškovi */}
      <header className="no-print relative z-20 bg-sheet/95 backdrop-blur-md border-b-[1.5px] border-fir sticky top-0 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 min-h-[72px] md:h-20 py-2 flex items-center justify-between gap-2.5">
          <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
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
          <nav className="hidden md:flex items-center gap-1" aria-label="Hlavní navigace">
            <NavLink to="/" end className={navLinkClass}>
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

          {/* Hudební hrací skříňka + Odkaz do profilu vpravo */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleMusic}
              title={musicOn ? 'Vypnout vánoční hrací skříňku' : 'Zapnout jemnou vánoční hrací skříňku'}
              aria-label={musicOn ? 'Vypnout vánoční hrací skříňku' : 'Zapnout vánoční hrací skříňku'}
              className={`min-h-[42px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition ${
                musicOn
                  ? 'bg-fir text-white border-gold/60 shadow-xs'
                  : 'bg-paper text-slate-text border-paper-warm hover:bg-fir-soft/60'
              }`}
            >
              {musicOn ? (
                <Music className="w-4 h-4 text-gold-glow animate-pulse shrink-0" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-text-muted shrink-0" />
              )}
              <span className="hidden sm:inline">{musicOn ? 'Koleda hraje' : 'Koleda'}</span>
            </button>

            {profile && (
              <NavLink
                to="/profil"
                title="Můj profil a poštovní známka"
                className="min-h-[56px] inline-flex items-center gap-3 px-2.5 py-1 rounded-2xl hover:bg-fir-soft/60 border border-transparent hover:border-fir/25 transition-colors shrink-0"
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

      {/* Hlavní obsah */}
      <main className="relative z-10 flex-1 max-w-2xl xl:max-w-3xl w-full mx-auto px-3.5 sm:px-6 lg:pl-20 xl:pl-6 py-4 sm:py-8 min-w-0">
        {children}
      </main>

      {/* Celopostavový 3D kapr průvodce volně v prostoru aplikace */}
      <KaprikGuide variant="floating" />

      {/* Patička aplikace */}
      <footer className="no-print relative z-10 max-w-2xl xl:max-w-3xl w-full mx-auto px-4 sm:px-6 pt-4 pb-8 text-center">
        <div className="border-t border-fir/20 pt-6 flex flex-col items-center gap-2">
          <FairytaleOrnamentSvg className="w-40 h-7 opacity-80" />
          <p className="font-fairytale italic text-lg sm:text-xl text-slate-text-muted">
            Dopis Ježíškovi
          </p>
        </div>
      </footer>

      {/* Pevná spodní mobilní navigace (< 768px) */}
      <nav
        className="no-print md:hidden fixed bottom-0 inset-x-0 z-40 bg-sheet/95 backdrop-blur-md border-t-[1.5px] border-fir px-1.5 py-1.5 grid grid-cols-4 gap-1 shadow-soft"
        aria-label="Mobilní navigace"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `min-h-[48px] flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded-xl text-xs font-bold whitespace-nowrap ${
              isActive ? 'text-fir bg-fir-soft border border-fir/20' : 'text-slate-text-muted'
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

      {/* Pojistka proti ukliknutí: 8sekundová lišta dole */}
      {undoToast && (
        <div className="no-print fixed bottom-24 md:bottom-8 inset-x-4 z-50 flex justify-center animate-slide-up">
          <div className="w-full max-w-xl rounded-2xl bg-fir text-sheet px-5 py-4 shadow-paper border-2 border-gold flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-base sm:text-lg font-bold">
              <Gift className="w-5 h-5 text-gold-glow shrink-0" />
              <span>{undoToast.message || 'Přidáno do tvého nákupního seznamu'}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  const fn = undoToast.onUndo;
                  dismissUndoToast();
                  if (fn) await fn();
                }}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-glow text-slate-text font-bold text-base shadow-sm transition"
              >
                <Undo2 className="w-5 h-5" />
                <span>Vrátit zpět</span>
              </button>
              <button
                type="button"
                onClick={dismissUndoToast}
                className="p-2 text-sheet/80 hover:text-sheet rounded-lg"
                aria-label="Zavřít"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Běžná notifikace */}
      {toast && !undoToast && (
        <div className="no-print fixed bottom-24 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-slide-up">
          <div
            className={`rounded-2xl px-5 py-3.5 shadow-soft border-[1.5px] flex items-center justify-between gap-3 text-base font-bold ${
              toast.type === 'error'
                ? 'bg-crimson-soft border-crimson text-crimson'
                : 'bg-fir text-white border-gold/60'
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={dismissToast}
              className="opacity-80 hover:opacity-100 p-1"
              aria-label="Zavřít oznámení"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Okamžité připojení jedním klikem z odkazu (?invite=...) */}
      {authUser &&
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
              className="w-full max-w-md rounded-2xl bg-[#FFFDF8] border-[1.5px] border-fir shadow-2xl p-6 animate-slide-up space-y-5 relative"
            >
              <div
                className="pointer-events-none absolute inset-2 rounded-xl border border-gold/40"
                aria-hidden="true"
              />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-fir-soft text-fir border border-fir/25 flex items-center justify-center shrink-0">
                    {isGroupInvite ? (
                      <Users className="w-6 h-6" />
                    ) : (
                      <UserPlus className="w-6 h-6" />
                    )}
                  </div>
                  <div>
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
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-paper transition"
                  aria-label="Zavřít"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative z-10 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
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
