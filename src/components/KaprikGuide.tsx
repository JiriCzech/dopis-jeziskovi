import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type KaprikPose = 'vitej' | 'radce' | 'tajemstvi' | 'dopis';
export type KaprikVariant = 'floating' | 'login';
export type KaprikContextKey =
  | 'login'
  | 'dopis-psani'
  | 'dopis-odeslano'
  | 'rodina'
  | 'rodina-obalka'
  | 'rodina-detail'
  | 'nakup'
  | 'sdileni'
  | 'profil'
  | 'profil-onboarding';
export type FamilyViewState = 'overview' | 'envelope' | 'detail';

export interface KaprikGuideProps {
  variant?: KaprikVariant;
  contextKey?: KaprikContextKey;
  className?: string;
}

const POSE_ORDER: KaprikPose[] = ['vitej', 'radce', 'tajemstvi', 'dopis'];

const POSE_SRC_MAP: Record<KaprikPose, string> = {
  vitej: '/assets/kaprik-full-vitej.png',
  radce: '/assets/kaprik-full-radce.png',
  tajemstvi: '/assets/kaprik-full-tajemstvi.png',
  dopis: '/assets/kaprik-full-dopis.png',
};

const FALLBACK_SRC = '/assets/kaprik.png';

interface ContextConfig {
  defaultPose: KaprikPose;
  messages: string[];
}

const CONTEXT_CONFIG: Record<KaprikContextKey, ContextConfig> = {
  login: {
    defaultPose: 'vitej',
    messages: [
      'Ahoj! Jsem vánoční kapřík a pomůžu ti napsat dopis Ježíškovi nebo tajně vybrat dárky pro rodinu.',
      'Neboj, na Štědrý den mě nikdo nesní. Letos mám úřední povolení hlídat vánoční přání.',
      'Když máš od rodiny zvací odkaz, po přihlášení se s ní propojíš jedním kliknutím.',
      'Z tvých přání nikdy nic neprozradím. Pod vodou se totiž mlčí ze zásady.',
      'Klikni na tlačítko Google a můžeme začít psát.',
    ],
  },
  'dopis-psani': {
    defaultPose: 'radce',
    messages: [
      'Napiš Ježíškovi pár slov na úvod a pod to připiš svá přání. Až budeš mít hotovo, dole dopis zapečeť.',
      'Píšeš i za děti? Nahoře jim jedním klikem založíš vlastní list papíru nebo připneš fotku ručního dopisu.',
      'Čím přesněji dárek popíšeš, tím méně ponožek pod stromečkem omylem dostaneš.',
      'Všechno se průběžně ukládá samo. Ježíšek má se škrabopisem svatou trpělivost.',
      'Vosková pečeť dole udrží všechna přání v tajnosti až do Štědrého večera.',
    ],
  },
  'dopis-odeslano': {
    defaultPose: 'dopis',
    messages: [
      'Dopis je zapečetěný a u Ježíška! Tvoji blízcí si teď mohou přání potají zamluvit.',
      'Vzpomněl sis na další dárek? Klidně ho připiš na papír a dopis znovu přepečeť.',
      'Chceš dát dopis za okno? Nahoře si ho můžeš čistě vytisknout na papír.',
      'Sám nikdy neuvidíš, kdo ti co koupil. Překvapení pod stromečkem hlídám oběma ploutvemi.',
      'Obálka už letí na Boží Dar. Moje pletená čepice s bambulí to jistí.',
    ],
  },
  rodina: {
    defaultPose: 'tajemstvi',
    messages: [
      'Pššt! Klikni na visačku blízkého, rozlom pečeť na obálce a vyber dárek, který mu udělá radost.',
      'Autor dopisu nikdy neuvidí, co jsi zamluvil. Ostatní dárci ale poznají, že už dárek zařizuješ ty.',
      'Každý zamluvený dárek ti rovnou uložím do nákupního seznamu, ať na nic nezapomeneš.',
      'Hlavně to doma neprozraď u cukroví. Mlčím jako ryba.',
      'Chybí tu někdo z rodiny? Pozvi ho přes odkaz v sekci Sdílení.',
    ],
  },
  'rodina-obalka': {
    defaultPose: 'tajemstvi',
    messages: [
      'Klikni na obálku pro rozlomení voskové pečeti a přečti si vánoční přání.',
      'Každý výběr dárku zůstane před majitelem dopisu úplně utajený.',
    ],
  },
  'rodina-detail': {
    defaultPose: 'tajemstvi',
    messages: [
      'Vyber dárek, který chceš koupit, a klikni na Tohle koupím. Majitel dopisu se to nikdy nedozví.',
      'Zamluvený dárek se ti hned uloží do Mého nákupního seznamu a ostatním dárcům zmizí.',
      'Kdyby sis to rozmyslel, v nákupním seznamu dárek kdykoliv vrátíš zpět do dopisu.',
      'Všechno zůstane tajné až do Štědrého večera. Mlčím jako ryba!',
    ],
  },
  nakup: {
    defaultPose: 'radce',
    messages: [
      'Tady máš svůj soukromý seznam dárků. Jakmile dárek koupíš a zabalíš, jednoduše si ho odškrtni.',
      'Napadl tě dárek mimo dopis? Přidej si ho tlačítkem Přidat nápad, nikdo jiný ho neuvidí.',
      'Když si koupi rozmyslíš, můžeš dárek uvolnit zpět do dopisu pro ostatní.',
      'Odškrtávat hotové dárky je skoro tak příjemné jako je rozbalovat.',
      'Hlavně nezapomeň, do které skříně jsi zabalené dárky doma schoval!',
    ],
  },
  sdileni: {
    defaultPose: 'vitej',
    messages: [
      'Zkopíruj svůj zvací odkaz a pošli ho rodině do zprávy. Po kliknutí se s tebou propojí.',
      'Můžeš si založit i skupiny pro rodinu nebo kamarády a nastavit u nich viditelnost dětských dopisů.',
      'Znáš osobní kód blízkého? Zadej ho do vyhledávání a pošli mu pozvánku.',
      'Čím větší partu pozveš, tím menší šance, že pod stromečkem skončí tři stejné kulichy.',
      'Kdykoliv se můžete bezpečně propojit i odpojit.',
    ],
  },
  profil: {
    defaultPose: 'dopis',
    messages: [
      'Tady si nastavíš jméno pro rodinu a vybereš si svou vánoční poštovní známku.',
      'Vybraná známka se automaticky nalepí na všechny tvoje obálky i dárkové visačky.',
      'Zvířátko na známce je jen na tobě. Kapr zůstává v rohu jako hlavní průvodce.',
      'Po úpravě nezapomeň kliknout na tlačítko Uložit.',
      'Hezká známka dělá půl dojmu z dopisu. Druhou půlku dělá čitelný seznam přání.',
    ],
  },
  'profil-onboarding': {
    defaultPose: 'vitej',
    messages: [
      'Ahoj! Napiš, jak ti doma říkají, vyber si svou vánoční známku a hned jdeme psát dopis Ježíškovi.',
      'Vybrané jméno a poštovní známku uvidí tvoje rodina na obálkách i dárkových visačkách.',
      'Až budeš mít vybráno, klikni dole na Hotovo, jdeme psát dopis.',
    ],
  },
};

function resolveContextKey(
  pathname: string,
  variant: KaprikVariant,
  explicitKey: KaprikContextKey | undefined,
  isLetterSealed: boolean,
  familyView: FamilyViewState
): KaprikContextKey {
  if (explicitKey) return explicitKey;
  if (variant === 'login') return 'login';
  if (pathname.startsWith('/rodina')) {
    if (familyView === 'detail') return 'rodina-detail';
    if (familyView === 'envelope') return 'rodina-obalka';
    return 'rodina';
  }
  if (pathname.startsWith('/nakupni-seznam')) return 'nakup';
  if (pathname.startsWith('/sdileni')) return 'sdileni';
  if (pathname.startsWith('/profil')) return 'profil';
  return isLetterSealed ? 'dopis-odeslano' : 'dopis-psani';
}

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

/**
 * Celopostavový 3D kapr průvodce stojící u obsahu na desktopu a jako kompaktní odznak v rohu na mobilu.
 */
export function KaprikGuide({
  variant = 'floating',
  contextKey,
  className = '',
}: KaprikGuideProps) {
  const location = useLocation();
  const [isLetterSealed, setIsLetterSealed] = useState(false);
  const [isHiddenByModal, setIsHiddenByModal] = useState(false);
  const [familyView, setFamilyView] = useState<FamilyViewState>('overview');

  const isLogin = variant === 'login';

  const activeContext = resolveContextKey(
    location.pathname,
    variant,
    contextKey,
    isLetterSealed,
    familyView
  );
  const config = CONTEXT_CONFIG[activeContext];

  const [pose, setPose] = useState<KaprikPose>(config.defaultPose);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isBubbleOpen, setIsBubbleOpen] = useState(() => isLogin || !isMobileViewport());
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isHopping, setIsHopping] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(POSE_SRC_MAP[config.defaultPose]);

  const hopTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const prevRouteRef = useRef<string>(isLogin ? '__login__' : location.pathname);
  const prevContextRef = useRef<KaprikContextKey>(activeContext);

  const clearAutoHideTimers = () => {
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => {
    const handleLetterState = (event: Event) => {
      const detail = (
        event as CustomEvent<{ isSealed?: boolean; justSealed?: boolean; modalOpen?: boolean }>
      ).detail;
      if (!detail) return;
      if (typeof detail.isSealed === 'boolean') {
        setIsLetterSealed(detail.isSealed);
      }
      if (typeof detail.modalOpen === 'boolean') {
        setIsHiddenByModal(detail.modalOpen);
      }
      if (detail.justSealed) {
        setPose('dopis');
        setMessageIndex(0);
        if (!isMobileViewport()) {
          setIsFadingOut(false);
          setIsBubbleOpen(true);
        }
      }
    };

    const handleFamilyState = (event: Event) => {
      const detail = (event as CustomEvent<{ view?: FamilyViewState }>).detail;
      if (!detail || !detail.view) return;
      setFamilyView(detail.view);
    };

    window.addEventListener('kaprik:letter-state', handleLetterState);
    window.addEventListener('kaprik:family-state', handleFamilyState);
    return () => {
      window.removeEventListener('kaprik:letter-state', handleLetterState);
      window.removeEventListener('kaprik:family-state', handleFamilyState);
    };
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith('/rodina') && familyView !== 'overview') {
      setFamilyView('overview');
    }
    const isLetterPath = location.pathname === '/' || location.pathname.startsWith('/dopis');
    if (!isLetterPath) {
      setIsHiddenByModal(false);
    }
  }, [location.pathname, familyView]);

  useEffect(() => {
    const currentRoute = isLogin ? '__login__' : location.pathname;
    const routeChanged = prevRouteRef.current !== currentRoute;
    const contextChanged = prevContextRef.current !== activeContext;

    if (routeChanged || contextChanged) {
      setPose(CONTEXT_CONFIG[activeContext].defaultPose);
      setMessageIndex(0);
      if (routeChanged) {
        setIsFadingOut(false);
        setIsBubbleOpen(isLogin || !isMobileViewport());
      } else if (contextChanged && !isMobileViewport()) {
        setIsFadingOut(false);
        setIsBubbleOpen(true);
      }
      prevRouteRef.current = currentRoute;
      prevContextRef.current = activeContext;
    }
  }, [activeContext, location.pathname, isLogin]);

  useEffect(() => {
    clearAutoHideTimers();
    if (isLogin || activeContext === 'profil-onboarding' || !isBubbleOpen || isMobileViewport()) {
      return undefined;
    }
    fadeTimerRef.current = window.setTimeout(() => {
      setIsFadingOut(true);
    }, 5700);
    closeTimerRef.current = window.setTimeout(() => {
      setIsBubbleOpen(false);
      setIsFadingOut(false);
    }, 6000);
    return clearAutoHideTimers;
  }, [isLogin, isBubbleOpen, messageIndex, pose, activeContext]);

  useEffect(() => {
    setImgSrc(POSE_SRC_MAP[pose] || FALLBACK_SRC);
  }, [pose]);

  useEffect(() => {
    return () => {
      clearAutoHideTimers();
      if (hopTimerRef.current !== null) {
        window.clearTimeout(hopTimerRef.current);
      }
    };
  }, []);

  const handleImgError = () => {
    if (imgSrc !== FALLBACK_SRC) {
      setImgSrc(FALLBACK_SRC);
    }
  };

  const triggerHopAndNextMessage = () => {
    if (hopTimerRef.current !== null) {
      window.clearTimeout(hopTimerRef.current);
    }
    setIsHopping(false);
    window.requestAnimationFrame(() => {
      setIsHopping(true);
    });
    hopTimerRef.current = window.setTimeout(() => {
      setIsHopping(false);
      hopTimerRef.current = null;
    }, 480);

    setPose((curr) => {
      const idx = POSE_ORDER.indexOf(curr);
      return POSE_ORDER[(idx + 1) % POSE_ORDER.length];
    });
    setMessageIndex((curr) => (curr + 1) % config.messages.length);
  };

  const handleKaprikClick = () => {
    if (isMobileViewport() && !isBubbleOpen && !isLogin) {
      if (hopTimerRef.current !== null) {
        window.clearTimeout(hopTimerRef.current);
      }
      setIsHopping(false);
      window.requestAnimationFrame(() => {
        setIsHopping(true);
      });
      hopTimerRef.current = window.setTimeout(() => {
        setIsHopping(false);
        hopTimerRef.current = null;
      }, 480);
      setIsFadingOut(false);
      setIsBubbleOpen(true);
      return;
    }

    triggerHopAndNextMessage();
    setIsFadingOut(false);
    setIsBubbleOpen(true);
  };

  const currentMessage = config.messages[messageIndex % config.messages.length];

  const containerClass = isLogin
    ? `print:hidden no-print relative z-20 flex flex-col items-center justify-center gap-3.5 ${className}`
    : `print:hidden no-print fixed bottom-20 right-3 md:right-auto md:bottom-4 md:left-3 lg:left-[max(12px,calc(50%-510px))] xl:left-[max(16px,calc(50%-620px))] md:w-[196px] xl:w-[214px] z-30 pointer-events-none flex flex-col items-end md:items-center gap-2.5 transition-opacity duration-200 ${
        isHiddenByModal ? 'opacity-0 invisible' : 'opacity-100'
      } ${className}`;

  const buttonFrameClass = isLogin
    ? 'pointer-events-auto cursor-pointer hover:scale-[1.03] transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded-3xl bg-transparent border-0 p-0 block'
    : 'pointer-events-auto cursor-pointer hover:scale-[1.03] transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] w-[60px] h-[60px] rounded-full bg-[#FFFDF8]/95 border-[1.5px] border-[#1B4332] shadow-soft p-1 overflow-hidden flex items-center justify-center md:w-auto md:h-auto md:rounded-3xl md:bg-transparent md:border-0 md:shadow-none md:p-0 md:overflow-visible md:block';

  const carpImageClass = isLogin
    ? 'h-[240px] sm:h-[290px] md:h-[320px] w-auto select-none object-contain drop-shadow-[0_14px_20px_rgba(30,36,33,0.18)]'
    : 'w-full h-full object-contain md:h-[220px] lg:h-[255px] xl:h-[275px] md:w-auto select-none md:drop-shadow-[0_14px_20px_rgba(30,36,33,0.18)]';

  return (
    <div className={containerClass}>
      {/* Mluvící bublina vždy NAD kaprem */}
      {(isLogin || isBubbleOpen) && (
        <div
          role="status"
          aria-live="polite"
          style={{ backgroundColor: '#FFFDF8' }}
          className={`pointer-events-auto relative rounded-[20px] bg-[#FFFDF8] border-[1.5px] border-[#1B4332] shadow-soft transition-opacity duration-300 animate-fade-in ${
            isFadingOut ? 'opacity-0' : 'opacity-100'
          } ${
            isLogin
              ? 'px-5 py-3.5 max-w-[280px] sm:max-w-[330px] text-center'
              : 'w-[245px] max-w-[calc(100vw-24px)] md:w-[196px] xl:w-[214px] px-3.5 py-2.5 text-left'
          }`}
        >
          {/* Zobáček směřující dolů na kapříka / mobilní odznak */}
          <span
            aria-hidden="true"
            style={{ backgroundColor: '#FFFDF8' }}
            className={`absolute w-3.5 h-3.5 bg-[#FFFDF8] border-b-[1.5px] border-r-[1.5px] border-[#1B4332] rotate-45 -bottom-[8px] ${
              isLogin
                ? 'left-1/2 -translate-x-1/2'
                : 'right-6 md:right-auto md:left-1/2 md:-translate-x-1/2'
            }`}
          />

          <div
            className={`relative z-10 flex items-start gap-2 ${
              isLogin ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <p
                className={
                  isLogin
                    ? 'text-base leading-relaxed font-medium text-[#1E2421]'
                    : 'text-[13px] leading-snug font-medium text-[#1E2421]'
                }
              >
                {currentMessage}
              </p>

              {!isLogin && (
                <button
                  type="button"
                  onClick={triggerHopAndNextMessage}
                  className="md:hidden text-[11px] font-bold text-[#1B4332] hover:underline"
                >
                  Další rada →
                </button>
              )}
            </div>

            {!isLogin && (
              <button
                type="button"
                onClick={() => {
                  setIsFadingOut(false);
                  setIsBubbleOpen(false);
                }}
                aria-label="Zavřít bublinu"
                title="Zavřít bublinu"
                className="w-5 h-5 -mt-0.5 -mr-1 inline-flex items-center justify-center rounded-lg text-sm font-bold text-[#525E58] hover:text-[#1E2421] hover:bg-[#F7F2E7] shrink-0 transition cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Samostatná celopostavová figura kapra na desktopu / kompaktní kruhový odznak na mobilu */}
      <div className="shrink-0 md:animate-[float_4.5s_ease-in-out_infinite]">
        <button
          type="button"
          onClick={handleKaprikClick}
          title="Klikni na kapříka pro další radu"
          aria-label="Vánoční kapřík, klikni pro radu"
          className={`${buttonFrameClass} ${isHopping ? 'animate-kaprik-hop' : ''}`}
        >
          <img
            src={imgSrc}
            onError={handleImgError}
            alt="Vánoční kapřík, průvodce aplikace Dopis Ježíškovi"
            draggable={false}
            className={carpImageClass}
          />
        </button>
      </div>
    </div>
  );
}

export default KaprikGuide;
