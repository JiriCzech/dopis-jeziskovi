import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type KaprikPose = 'vitej' | 'radce' | 'tajemstvi' | 'dopis';
export type KaprikVariant = 'floating' | 'login';
export type KaprikContextKey =
  | 'login'
  | 'dopis-psani'
  | 'dopis-odeslano'
  | 'rodina'
  | 'nakup'
  | 'sdileni'
  | 'profil';

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
      'Pššt! Klikni na visačku blízkého, rozlom pečeť na obálce a zamluv si dárek tlačítkem Tohle koupím.',
      'Autor dopisu nikdy neuvidí, co jsi zamluvil. Ostatní dárci ale poznají, že už dárek zařizuješ ty.',
      'Každý zamluvený dárek ti rovnou uložím do nákupního seznamu, ať na nic nezapomeneš.',
      'Hlavně to doma neprozraď u cukroví. Mlčím jako ryba.',
      'Chybí tu někdo z rodiny? Pozvi ho přes odkaz v sekci Sdílení.',
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
};

function resolveContextKey(
  pathname: string,
  variant: KaprikVariant,
  explicitKey: KaprikContextKey | undefined,
  isLetterSealed: boolean
): KaprikContextKey {
  if (explicitKey) return explicitKey;
  if (variant === 'login') return 'login';
  if (pathname.startsWith('/rodina')) return 'rodina';
  if (pathname.startsWith('/nakupni-seznam')) return 'nakup';
  if (pathname.startsWith('/sdileni')) return 'sdileni';
  if (pathname.startsWith('/profil')) return 'profil';
  return isLetterSealed ? 'dopis-odeslano' : 'dopis-psani';
}

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

/**
 * Celopostavový 3D kapr průvodce stojící volně v prostoru aplikace s bublinou nad čepicí,
 * automatickým skrytím na desktopu po 6 s a přepínáním na ťuknutí na mobilu.
 */
export function KaprikGuide({
  variant = 'floating',
  contextKey,
  className = '',
}: KaprikGuideProps) {
  const location = useLocation();
  const [isLetterSealed, setIsLetterSealed] = useState(false);

  const activeContext = resolveContextKey(
    location.pathname,
    variant,
    contextKey,
    isLetterSealed
  );
  const config = CONTEXT_CONFIG[activeContext];

  const [pose, setPose] = useState<KaprikPose>(config.defaultPose);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isBubbleOpen, setIsBubbleOpen] = useState(() => !isMobileViewport());
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isHopping, setIsHopping] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(POSE_SRC_MAP[config.defaultPose]);

  const hopTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const prevRouteRef = useRef<string>(variant === 'login' ? '__login__' : location.pathname);
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
      const detail = (event as CustomEvent<{ isSealed?: boolean; justSealed?: boolean }>).detail;
      if (!detail) return;
      const nextSealed = Boolean(detail.isSealed);
      setIsLetterSealed(nextSealed);
      if (detail.justSealed) {
        setPose('dopis');
        setMessageIndex(0);
        if (!isMobileViewport()) {
          setIsFadingOut(false);
          setIsBubbleOpen(true);
        }
      }
    };

    window.addEventListener('kaprik:letter-state', handleLetterState);
    return () => {
      window.removeEventListener('kaprik:letter-state', handleLetterState);
    };
  }, []);

  useEffect(() => {
    const currentRoute = variant === 'login' ? '__login__' : location.pathname;
    const routeChanged = prevRouteRef.current !== currentRoute;
    const contextChanged = prevContextRef.current !== activeContext;

    if (routeChanged || contextChanged) {
      setPose(CONTEXT_CONFIG[activeContext].defaultPose);
      setMessageIndex(0);
      if (routeChanged) {
        setIsFadingOut(false);
        setIsBubbleOpen(!isMobileViewport());
      }
      prevRouteRef.current = currentRoute;
      prevContextRef.current = activeContext;
    }
  }, [activeContext, location.pathname, variant]);

  useEffect(() => {
    clearAutoHideTimers();
    if (!isBubbleOpen || isMobileViewport()) {
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
  }, [isBubbleOpen, messageIndex, pose, activeContext]);

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

  const handleKaprikClick = () => {
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

    if (isMobileViewport() && isBubbleOpen) {
      setIsFadingOut(false);
      setIsBubbleOpen(false);
      return;
    }

    setPose((curr) => {
      const idx = POSE_ORDER.indexOf(curr);
      return POSE_ORDER[(idx + 1) % POSE_ORDER.length];
    });
    setMessageIndex((curr) => (curr + 1) % config.messages.length);
    setIsFadingOut(false);
    setIsBubbleOpen(true);
  };

  const currentMessage = config.messages[messageIndex % config.messages.length];
  const isLogin = variant === 'login';

  const containerClass = isLogin
    ? `print:hidden no-print relative z-20 flex flex-col items-center justify-center gap-3.5 ${className}`
    : `print:hidden no-print fixed bottom-20 left-3 md:bottom-4 md:left-4 z-30 pointer-events-none flex flex-col items-center gap-2.5 ${className}`;

  const carpImageClass = isLogin
    ? 'h-[240px] sm:h-[290px] md:h-[320px] w-auto select-none object-contain drop-shadow-[0_14px_20px_rgba(30,36,33,0.18)]'
    : 'h-[120px] md:h-[260px] lg:h-[280px] w-auto select-none object-contain drop-shadow-[0_14px_20px_rgba(30,36,33,0.18)]';

  return (
    <div className={containerClass}>
      {/* Mluvící bublina vždy přímo NAD kaprem se zobáčkem dolů na čepici */}
      {isBubbleOpen && (
        <div
          role="status"
          aria-live="polite"
          style={{ backgroundColor: '#FFFDF8' }}
          className={`pointer-events-auto relative rounded-[20px] bg-[#FFFDF8] border-[1.5px] border-[#1B4332] shadow-soft transition-opacity duration-300 animate-fade-in ${
            isFadingOut ? 'opacity-0' : 'opacity-100'
          } ${
            isLogin
              ? 'px-5 py-3.5 max-w-[280px] sm:max-w-[330px] text-center'
              : 'w-[210px] max-w-[220px] px-3.5 py-2.5 text-left'
          }`}
        >
          {/* Trojúhelníkový zobáček směřující dolů na kapříkovu čepici */}
          <span
            aria-hidden="true"
            style={{ backgroundColor: '#FFFDF8' }}
            className="absolute w-3.5 h-3.5 bg-[#FFFDF8] border-b-[1.5px] border-r-[1.5px] border-[#1B4332] rotate-45 -bottom-[8px] left-1/2 -translate-x-1/2"
          />

          <div className="relative z-10 flex items-start justify-between gap-2">
            <p
              className={
                isLogin
                  ? 'text-base leading-relaxed font-medium text-[#1E2421]'
                  : 'text-[13px] leading-snug font-medium text-[#1E2421]'
              }
            >
              {currentMessage}
            </p>

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
          </div>
        </div>
      )}

      {/* Samostatná celopostavová figura kapra v prostoru bez rámečku */}
      <div className="shrink-0 animate-[float_4.5s_ease-in-out_infinite]">
        <button
          type="button"
          onClick={handleKaprikClick}
          title="Klikni na kapříka pro další radu"
          aria-label="Vánoční kapřík, klikni pro radu"
          className={`pointer-events-auto cursor-pointer hover:scale-[1.03] transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded-3xl bg-transparent border-0 p-0 block ${
            isHopping ? 'animate-kaprik-hop' : ''
          }`}
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
