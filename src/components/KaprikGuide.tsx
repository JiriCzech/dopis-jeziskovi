import React, { useEffect, useState } from 'react';

export type KaprikPose = 'default' | 'vitej' | 'tajemstvi' | 'dopis';
export type KaprikSize = 'hero' | 'compact';
export type KaprikBubbleDirection = 'left' | 'top';

export interface KaprikGuideProps {
  pose?: KaprikPose;
  message: React.ReactNode;
  size?: KaprikSize;
  bubbleDirection?: KaprikBubbleDirection;
  className?: string;
  onDismiss?: () => void;
}

const POSE_SRC_MAP: Record<KaprikPose, string> = {
  default: '/assets/kaprik.png',
  vitej: '/assets/kaprik-vitej.png',
  tajemstvi: '/assets/kaprik-tajemstvi.png',
  dopis: '/assets/kaprik-dopis.png',
};

const FALLBACK_SRC = '/assets/kaprik.png';

/**
 * Znovupoužitelný 3D průvodce Kapřík v klenutém portrétním medailonu se skutečnou mluvící bublinou
 */
export function KaprikGuide({
  pose = 'default',
  message,
  size = 'hero',
  bubbleDirection = 'left',
  className = '',
  onDismiss,
}: KaprikGuideProps) {
  const targetSrc = POSE_SRC_MAP[pose] || FALLBACK_SRC;
  const [imgSrc, setImgSrc] = useState<string>(targetSrc);

  useEffect(() => {
    setImgSrc(POSE_SRC_MAP[pose] || FALLBACK_SRC);
  }, [pose]);

  const handleImgError = () => {
    if (imgSrc !== FALLBACK_SRC) {
      setImgSrc(FALLBACK_SRC);
    }
  };

  const isHero = size === 'hero';
  const isTopLayout = bubbleDirection === 'top';

  const containerLayoutClass = isTopLayout
    ? 'flex-col items-center'
    : isHero
      ? 'flex-col sm:flex-row items-center'
      : 'flex-row items-center';

  // Klenutý portrétní medailon (poměr stran 4/5, zaoblený oblouk nahoře)
  const medallionSizeClass = isHero
    ? 'w-[164px] h-[205px] sm:w-[196px] sm:h-[245px]'
    : 'w-[76px] h-[95px] sm:w-[88px] sm:h-[110px]';

  return (
    <div className={`flex ${containerLayoutClass} gap-5 sm:gap-7 ${className}`}>
      {/* Portrétní medailon kapříka — klenutý oblouk, jedlově zelený rám #1B4332 a vnitřní zlatá linka #C9963B */}
      <div
        className={`relative shrink-0 select-none rounded-t-full rounded-b-3xl border-2 border-[#1B4332] bg-[#E8DEC8] shadow-md overflow-hidden ${medallionSizeClass}`}
      >
        <img
          src={imgSrc}
          onError={handleImgError}
          alt="Vánoční kapřík — průvodce Ježíškovou poštou"
          className="w-full h-full object-cover object-top pointer-events-none"
        />
        {/* Tenká vnitřní zlatá linka medailonu */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-1.5 rounded-t-full rounded-b-[18px] border border-[#C9963B]/65 ring-1 ring-inset ring-[#C9963B]/40"
        />
      </div>

      {/* Skutečná mluvící bublina se zobáčkem mířícím přímo ke kapříkovi (bez uvozovek) */}
      <div
        style={{ backgroundColor: '#FFFDF8' }}
        className={`relative rounded-[24px] bg-[#FFFDF8] border-[1.5px] border-[#1B4332] shadow-soft ${
          isHero
            ? 'px-6 py-5 sm:px-7 sm:py-6 max-w-md text-center sm:text-left'
            : 'px-4 py-3.5 sm:px-5 sm:py-4 flex-1 text-left'
        }`}
      >
        {/* Trojúhelníkový zobáček nahoru (na mobilu u hero scény nebo při bubbleDirection === 'top') */}
        <span
          aria-hidden="true"
          style={{ backgroundColor: '#FFFDF8' }}
          className={`w-4 h-4 bg-[#FFFDF8] border-t-[1.5px] border-l-[1.5px] border-[#1B4332] rotate-45 -top-[9px] left-1/2 -translate-x-1/2 ${
            isTopLayout
              ? 'block absolute'
              : isHero
                ? 'block sm:hidden absolute'
                : 'hidden'
          }`}
        />

        {/* Trojúhelníkový zobáček doleva (míří přímo k medailonu kapříka) */}
        {!isTopLayout && (
          <span
            aria-hidden="true"
            style={{ backgroundColor: '#FFFDF8' }}
            className={`w-4 h-4 bg-[#FFFDF8] border-b-[1.5px] border-l-[1.5px] border-[#1B4332] rotate-45 -left-[9px] top-1/2 -translate-y-1/2 ${
              isHero ? 'hidden sm:block absolute' : 'block absolute'
            }`}
          />
        )}

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div
            className={`${
              isHero
                ? 'text-lg sm:text-[19px] leading-relaxed font-medium text-[#1E2421]'
                : 'text-base leading-relaxed font-medium text-[#1E2421]'
            }`}
          >
            {message}
          </div>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Zavřít bublinu"
              className="text-xs font-bold text-[#525E58] hover:text-[#1E2421] px-1.5 py-0.5 rounded-lg hover:bg-[#F7F2E7] shrink-0 transition"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default KaprikGuide;
