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
      'Ahoj! Jsem kapřík a provedu tě Ježíškovou poštou. Přihlas se přes Google a můžeme napsat dopis nebo nakouknout do přání rodiny.',
      'Neboj, na Štědrý den mě nikdo nesní — letos mám úřední povolení zůstat v obýváku jako vánoční pošťák.',
      'Když máš od rodiny zvací odkaz, po vstupu se s ní rovnou propojíš jedním kliknutím.',
      'Slibuju, že z tvých přání nic neprozradím. Pod vodou se totiž mlčí ze zásady.',
      'Klikni na „Vstoupit přes Google“ — dopisní papír i poštovní známky už čekají na stole.',
    ],
  },
  'dopis-psani': {
    defaultPose: 'radce',
    messages: [
      'Tady sepíšeš svá vánoční přání. Klikni na „Přidat přání“ a až budeš mít hotovo, dole dopis zapečeť a pošli Ježíškovi.',
      'Píšeš za děti? Nahoře můžeš založit samostatný dopis pro každé z nich, nebo sponkou připnout fotku ručně psaného papíru.',
      'Čím přesněji přání popíšeš — třeba s odkazem na ukázku — tím méně ponožek pod stromečkem omylem skončí.',
      'Všechno se průběžně ukládá samo. Ježíšek má s námi kapry i se škrabopisem svatou trpělivost.',
      'Až bude seznam kompletní, dole ho zapečeť voskovou pečetí. Ta udrží tajemství pevněji než zamrzlý rybník.',
    ],
  },
  'dopis-odeslano': {
    defaultPose: 'dopis',
    messages: [
      'Skvělá práce, dopis je zapečetěný a bezpečně u Ježíška! Teď si tvoji blízcí mohou přání potají zamluvit.',
      'Když si vzpomeneš na další dárek, klidně ho připiš a dopis znovu přepečeť — Ježíškova pošta bere i dodatky.',
      'Chceš dopis položit za okno? Nahoře najdeš tlačítko „Vytisknout dopis“ pro čistý papírový arch.',
      'Sám neuvidíš, kdo ti co koupil. Vánoční překvapení hlídám oběma ploutvemi!',
      'Obálka už letí na Boží Dar. A kdyby cestou sněžilo, moje čepice s bambulí to jistí.',
    ],
  },
  rodina: {
    defaultPose: 'tajemstvi',
    messages: [
      'Pššt! Tady jsou dopisy tvých blízkých. Rozpečeť obálku a kliknutím na „Tohle koupím já“ si dárek tajně zamluv.',
      'Co si tady zamluvíš, autor dopisu neuvidí — ostatní dárci ale hned poznají, že dárek už řešíš ty.',
      'Nahoře můžeš filtrovat podle skupin, nebo nahlédnout do přání, která rodiče připsali za děti.',
      'Hlavně to doma neprozraď u cukroví. Nejlepší vánoční tajemství je to, o kterém mlčí i kapr.',
      'Každý zamluvený dárek ti rovnou ukládám do tvého nákupního seznamu, ať na nic nezapomeneš.',
    ],
  },
  nakup: {
    defaultPose: 'radce',
    messages: [
      'Tady máš svůj soukromý seznam zamluvených dárků. Když dárek koupíš a zabalíš, jednoduše ho odškrtni.',
      'Napadl tě skvělý dárek, který v dopise vůbec nebyl? Přidej si ho sem jako „Tajný nápad“, nikdo jiný ho neuvidí.',
      'Když si koupi rozmyslíš, rezervaci můžeš zase uvolnit, aby si přání vzal někdo další z rodiny.',
      'Odškrtávat koupené dárky je skoro tak příjemné jako rozbalovat je. Jen bez toho šustění papíru.',
      'Čím víc fajfek tu svítí, tím klidnější budeš mít předvánoční týden bez shonu.',
    ],
  },
  sdileni: {
    defaultPose: 'vitej',
    messages: [
      'Tady pozveš rodinu a kamarády. Zkopíruj svůj zvací odkaz nebo kód a pošli jim ho třeba do zprávy.',
      'Pro přehlednost si založ skupiny — třeba Rodina nebo Kamarádi — a nastav, kdo uvidí dětské dopisy.',
      'Znáš něčí kód (např. Jana#1234)? Vyhledej ho tady a pošli mu žádost o propojení.',
      'Čím větší partu si sem pozveš, tím menší šance, že se pod stromečkem sejdou tři stejné kulichy.',
      'Kdykoliv se můžete bezpečně propojit i odpojit — všechna přání zůstávají jen mezi vámi.',
    ],
  },
  profil: {
    defaultPose: 'dopis',
    messages: [
      'Tady si upravíš své jméno, jak ho uvidí rodina, a vybereš si svou ručně kreslenou poštovní známku.',
      'Vybraná známka se ozdobně nalepí na všechny tvoje zapečetěné obálky i dárkové jmenovky.',
      'Zvířátko na známce je čistě na tobě — jen kapr zůstává pro jistotu v roli hlavního pošťáka.',
      'Po úpravě nezapomeň kliknout na „Uložit změny“, ať razítko na obálkách pěkně sedí.',
      'Hezká známka dělá půl dojmu z dopisu. Druhou půlku dělá dobře čitelný seznam přání!',
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

/**
 * Celopostavový 3D kapr průvodce stojící volně v prostoru aplikace s průhledným pozadím,
 * kontextovou mluvící bublinou a hravou interakcí na kliknutí.
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
  const [isBubbleOpen, setIsBubbleOpen] = useState(true);
  const [isHopping, setIsHopping] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(POSE_SRC_MAP[config.defaultPose]);

  const hopTimerRef = useRef<number | null>(null);
  const prevRouteRef = useRef<string>(variant === 'login' ? '__login__' : location.pathname);
  const prevContextRef = useRef<KaprikContextKey>(activeContext);

  useEffect(() => {
    const handleLetterState = (event: Event) => {
      const detail = (event as CustomEvent<{ isSealed?: boolean; justSealed?: boolean }>).detail;
      if (!detail) return;
      const nextSealed = Boolean(detail.isSealed);
      setIsLetterSealed(nextSealed);
      if (detail.justSealed) {
        setPose('dopis');
        setMessageIndex(0);
        setIsBubbleOpen(true);
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
        setIsBubbleOpen(true);
      }
      prevRouteRef.current = currentRoute;
      prevContextRef.current = activeContext;
    }
  }, [activeContext, location.pathname, variant]);

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

    setPose((curr) => {
      const idx = POSE_ORDER.indexOf(curr);
      return POSE_ORDER[(idx + 1) % POSE_ORDER.length];
    });
    setMessageIndex((curr) => (curr + 1) % config.messages.length);
    setIsBubbleOpen(true);
  };

  const currentMessage = config.messages[messageIndex % config.messages.length];
  const isLogin = variant === 'login';

  const containerClass = isLogin
    ? `print:hidden no-print relative z-20 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 ${className}`
    : `print:hidden no-print fixed bottom-20 left-3 md:bottom-4 md:left-6 z-30 pointer-events-none flex items-start gap-2.5 md:gap-4 ${className}`;

  const carpImageClass = isLogin
    ? 'h-[240px] sm:h-[300px] md:h-[330px] w-auto select-none object-contain drop-shadow-[0_14px_20px_rgba(30,36,33,0.18)]'
    : 'h-[122px] md:h-[285px] lg:h-[300px] w-auto select-none object-contain drop-shadow-[0_14px_20px_rgba(30,36,33,0.18)]';

  return (
    <div className={containerClass}>
      {/* Samostatná celopostavová figura kapra v prostoru bez rámečku */}
      <div className="shrink-0 animate-[float_4.5s_ease-in-out_infinite]">
        <button
          type="button"
          onClick={handleKaprikClick}
          title="Klikni na kapříka pro další radu"
          aria-label="Vánoční kapřík — klikni pro další radu nebo vtip"
          className={`pointer-events-auto cursor-pointer hover:scale-[1.03] transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded-3xl bg-transparent border-0 p-0 block ${
            isHopping ? 'animate-kaprik-hop' : ''
          }`}
        >
          <img
            src={imgSrc}
            onError={handleImgError}
            alt="Vánoční kapřík — průvodce Ježíškovou poštou"
            draggable={false}
            className={carpImageClass}
          />
        </button>
      </div>

      {/* Mluvící bublina na krémovém papíře se zobáčkem mířícím ke kapříkovi */}
      {isBubbleOpen && (
        <div
          role="status"
          aria-live="polite"
          style={{ backgroundColor: '#FFFDF8' }}
          className={`pointer-events-auto relative rounded-[20px] md:rounded-[24px] bg-[#FFFDF8] border-[1.5px] border-[#1B4332] shadow-soft animate-fade-in ${
            isLogin
              ? 'px-5 py-4 sm:px-6 sm:py-5 max-w-md text-center sm:text-left'
              : 'mt-0.5 md:mt-6 px-3.5 py-2.5 md:px-5 md:py-4 max-w-[calc(100vw-130px)] sm:max-w-[285px] md:max-w-[330px] text-left'
          }`}
        >
          {/* Zobáček směřující nahoru (pouze na mobilu v login hero rozložení) */}
          {isLogin && (
            <span
              aria-hidden="true"
              style={{ backgroundColor: '#FFFDF8' }}
              className="block sm:hidden absolute w-4 h-4 bg-[#FFFDF8] border-t-[1.5px] border-l-[1.5px] border-[#1B4332] rotate-45 -top-[9px] left-1/2 -translate-x-1/2"
            />
          )}

          {/* Zobáček směřující doleva ke kapříkově hlavě / horní části těla */}
          <span
            aria-hidden="true"
            style={{ backgroundColor: '#FFFDF8' }}
            className={`w-3.5 h-3.5 md:w-4 md:h-4 bg-[#FFFDF8] border-b-[1.5px] border-l-[1.5px] border-[#1B4332] rotate-45 -left-[8px] md:-left-[9px] ${
              isLogin
                ? 'hidden sm:block absolute top-1/2 -translate-y-1/2'
                : 'block absolute top-6 md:top-8'
            }`}
          />

          <div className="relative z-10 flex items-start justify-between gap-2 md:gap-3">
            <p
              className={
                isLogin
                  ? 'text-base sm:text-[18px] leading-relaxed font-medium text-[#1E2421]'
                  : 'text-[13px] sm:text-sm md:text-[15px] leading-snug md:leading-relaxed font-medium text-[#1E2421]'
              }
            >
              {currentMessage}
            </p>

            <button
              type="button"
              onClick={() => setIsBubbleOpen(false)}
              aria-label="Zavřít bublinu"
              title="Zavřít bublinu"
              className="w-6 h-6 -mt-0.5 -mr-1 inline-flex items-center justify-center rounded-lg text-sm font-bold text-[#525E58] hover:text-[#1E2421] hover:bg-[#F7F2E7] shrink-0 transition cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default KaprikGuide;
