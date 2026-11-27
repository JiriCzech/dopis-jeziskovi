import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type KaprikPose = 'vitej' | 'radce' | 'tajemstvi' | 'dopis';
export type KaprikVariant = 'floating' | 'login';
export type KaprikContextKey =
  | 'login'
  | 'dopis-psani'
  | 'rodina'
  | 'nakup'
  | 'sdileni'
  | 'profil'
  | 'profil-onboarding';

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
      'Přání přidáš rovnou na řádek a potvrdíš Enterem. Všechno se průběžně ukládá samo.',
      'Píšeš i za děti? Nahoře jim jedním klikem založíš vlastní dopis nebo připneš fotku papírového dopisu.',
      'Čím přesněji dárek popíšeš, tím méně ponožek pod stromečkem omylem dostaneš.',
      'Sám nikdy neuvidíš, kdo ti co koupil. Překvapení pod stromečkem hlídám oběma ploutvemi.',
    ],
  },
  rodina: {
    defaultPose: 'tajemstvi',
    messages: [
      'Pššt! Všechna volná přání rodiny vidíš rovnou pod sebou. Klikni na Tohle koupím a dárek je tvůj.',
      'Autor dopisu nikdy neuvidí, co jsi zamluvil. Ostatní dárci ale poznají, že už dárek zařizuješ ty.',
      'Chceš si přečíst celý vzkaz Ježíškovi nebo fotku dětského dopisu? Klikni na Přečíst dopis.',
      'Každý zamluvený dárek ti rovnou uložím do Mého nákupního seznamu.',
    ],
  },
  nakup: {
    defaultPose: 'radce',
    messages: [
      'Tady máš svůj soukromý seznam dárků. V obchodě si koupené položky jednoduše odškrtni.',
      'Když chceš vidět jen to, co zbývá koupit, zapni si nahoře filtr Skrýt koupené.',
      'Napadl tě dárek mimo dopis? Přidej si ho tlačítkem Přidat nápad, nikdo jiný ho neuvidí.',
      'Kdyby sis koupi rozmyslel, dárek tlačítkem Uvolnit vrátíš zpět ostatním.',
    ],
  },
  sdileni: {
    defaultPose: 'vitej',
    messages: [
      'Zkopíruj svůj zvací odkaz a pošli ho rodině do zprávy. Po kliknutí se s tebou propojí.',
      'U každého propojeného člověka můžeš kliknout rovnou na Zobrazit přání.',
      'Můžeš si založit i skupiny pro rodinu nebo kamarády a nastavit viditelnost dětských dopisů.',
      'Znáš osobní kód blízkého? Zadej ho do pole výše a pošli mu pozvánku.',
    ],
  },
  profil: {
    defaultPose: 'dopis',
    messages: [
      'Tady si nastavíš jméno pro rodinu a vybereš si svou vánoční poštovní známku.',
      'Vybraná známka se automaticky zobrazí u tvých přání a v hlavičce rodiny.',
      'Po úpravě nezapomeň kliknout na tlačítko Uložit.',
    ],
  },
  'profil-onboarding': {
    defaultPose: 'vitej',
    messages: [
      'Ahoj! Napiš, jak ti doma říkají, vyber si svou vánoční známku a hned jdeme psát dopis Ježíškovi.',
      'Až budeš mít vybráno, klikni dole na Hotovo, jdeme psát dopis.',
    ],
  },
};

function resolveContextKey(
  pathname: string,
  variant: KaprikVariant,
  explicitKey: KaprikContextKey | undefined
): KaprikContextKey {
  if (explicitKey) return explicitKey;
  if (variant === 'login') return 'login';
  if (pathname.startsWith('/rodina')) return 'rodina';
  if (pathname.startsWith('/nakupni-seznam')) return 'nakup';
  if (pathname.startsWith('/sdileni')) return 'sdileni';
  if (pathname.startsWith('/profil')) return 'profil';
  return 'dopis-psani';
}

/**
 * Tichý vánoční průvodce Kapřík: na přihlášení vítá otevřenou bublinou,
 * uvnitř aplikace mlčí, nepřekáží obsahu a promluví až po kliknutí uživatele.
 */
export function KaprikGuide({
  variant = 'floating',
  contextKey,
  className = '',
}: KaprikGuideProps) {
  const location = useLocation();
  const isLogin = variant === 'login';

  const activeContext = resolveContextKey(
    location.pathname,
    variant,
    contextKey
  );
  const config = CONTEXT_CONFIG[activeContext];

  const [pose, setPose] = useState<KaprikPose>(config.defaultPose);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isBubbleOpen, setIsBubbleOpen] = useState(() => isLogin);
  const [isHopping, setIsHopping] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(POSE_SRC_MAP[config.defaultPose]);

  const hopTimerRef = useRef<number | null>(null);
  const prevRouteRef = useRef<string>(isLogin ? '__login__' : location.pathname);
  const prevContextRef = useRef<KaprikContextKey>(activeContext);

  useEffect(() => {
    const currentRoute = isLogin ? '__login__' : location.pathname;
    const routeChanged = prevRouteRef.current !== currentRoute;
    const contextChanged = prevContextRef.current !== activeContext;

    if (routeChanged || contextChanged) {
      setPose(CONTEXT_CONFIG[activeContext].defaultPose);
      setMessageIndex(0);
      if (!isLogin) {
        setIsBubbleOpen(false);
      }
      prevRouteRef.current = currentRoute;
      prevContextRef.current = activeContext;
    }
  }, [activeContext, location.pathname, isLogin]);

  useEffect(() => {
    setImgSrc(POSE_SRC_MAP[pose] || FALLBACK_SRC);
  }, [pose]);

  useEffect(() => {
    return () => {
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

  const triggerHop = () => {
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
    }, 380);
  };

  const showNextTip = () => {
    triggerHop();
    setPose((curr) => {
      const idx = POSE_ORDER.indexOf(curr);
      return POSE_ORDER[(idx + 1) % POSE_ORDER.length];
    });
    setMessageIndex((curr) => (curr + 1) % config.messages.length);
  };

  const handleKaprikClick = () => {
    if (!isLogin && !isBubbleOpen) {
      triggerHop();
      setIsBubbleOpen(true);
      return;
    }
    showNextTip();
    setIsBubbleOpen(true);
  };

  const currentMessage = config.messages[messageIndex % config.messages.length];

  const containerClass = isLogin
    ? `print:hidden no-print relative z-20 flex flex-col items-center justify-center gap-3.5 ${className}`
    : `print:hidden no-print fixed bottom-20 right-3 md:bottom-5 md:right-5 xl:right-auto xl:bottom-4 xl:left-[max(16px,calc(50%-600px))] xl:w-[204px] z-30 pointer-events-none flex flex-col items-end xl:items-center gap-2.5 ${className}`;

  const buttonFrameClass = isLogin
    ? 'pointer-events-auto cursor-pointer transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded-3xl bg-transparent border-0 p-0 block'
    : 'pointer-events-auto cursor-pointer transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] w-14 h-14 rounded-full bg-[#FFFDF8]/95 border border-paper-warm shadow-soft p-1 overflow-hidden flex items-center justify-center xl:w-auto xl:h-auto xl:rounded-3xl xl:bg-transparent xl:border-0 xl:shadow-none xl:p-0 xl:overflow-visible xl:block';

  const carpImageClass = isLogin
    ? 'h-[240px] sm:h-[290px] md:h-[320px] w-auto select-none object-contain drop-shadow-[0_14px_20px_rgba(30,36,33,0.18)]'
    : 'w-full h-full object-contain xl:h-[248px] xl:w-auto select-none xl:drop-shadow-[0_12px_18px_rgba(30,36,33,0.16)]';

  return (
    <div className={containerClass}>
      {/* Mluvící bublina vždy NAD kaprem (na přihlášených obrazovkách až po kliknutí) */}
      {(isLogin || isBubbleOpen) && (
        <div
          role="status"
          aria-live="polite"
          style={{ backgroundColor: '#FFFDF8' }}
          className={`pointer-events-auto relative rounded-2xl bg-[#FFFDF8] border border-fir/45 shadow-soft animate-fade-in ${
            isLogin
              ? 'px-5 py-3.5 max-w-[280px] sm:max-w-[330px] text-center'
              : 'w-[260px] max-w-[calc(100vw-24px)] xl:w-[204px] px-3.5 py-2.5 text-left'
          }`}
        >
          {/* Zobáček směřující dolů na kapříka */}
          <span
            aria-hidden="true"
            style={{ backgroundColor: '#FFFDF8' }}
            className={`absolute w-3.5 h-3.5 bg-[#FFFDF8] border-b border-r border-fir/45 rotate-45 -bottom-[8px] ${
              isLogin
                ? 'left-1/2 -translate-x-1/2'
                : 'right-5 xl:right-auto xl:left-1/2 xl:-translate-x-1/2'
            }`}
          />

          <div
            className={`relative z-10 flex items-start gap-2 ${
              isLogin ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p
                className={
                  isLogin
                    ? 'text-base leading-relaxed font-medium text-[#1E2421]'
                    : 'text-sm leading-snug font-medium text-[#1E2421]'
                }
              >
                {currentMessage}
              </p>

              {!isLogin && (
                <button
                  type="button"
                  onClick={showNextTip}
                  className="min-h-[44px] inline-flex items-center text-xs font-bold text-[#1B4332] hover:underline"
                >
                  Další rada →
                </button>
              )}
            </div>

            {!isLogin && (
              <button
                type="button"
                onClick={() => setIsBubbleOpen(false)}
                aria-label="Zavřít bublinu"
                title="Zavřít bublinu"
                className="min-w-[44px] min-h-[44px] -mt-1 -mr-1.5 inline-flex items-center justify-center rounded-xl text-base font-bold text-[#4A544E] hover:text-[#1E2421] hover:bg-[#F7F2E7] shrink-0 transition cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Klidný kapřík průvodce */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={handleKaprikClick}
          title="Klikni na kapříka pro radu"
          aria-label="Vánoční kapřík, klikni pro radu"
          aria-expanded={isLogin || isBubbleOpen}
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
