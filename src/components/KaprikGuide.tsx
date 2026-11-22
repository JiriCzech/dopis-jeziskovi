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

  // Rozložení:
  // - Pokud je bubbleDirection === 'top', kapřík je всегда nahoře a bublina pod ním se zobáčkem nahoru.
  // - Pokud je bubbleDirection === 'left', na mobilu (< sm) u hero scény je kapřík nahoře (zobáček nahoru)
  //   a od sm výše je kapřík vlevo a bublina vpravo (zobáček doleva přímo ke kapříkovi).
  const containerLayoutClass = isTopLayout
    ? 'flex-col items-center'
    : isHero
      ? 'flex-col sm:flex-row items-center'
      : 'flex-row items-center';

  const imageSizeClass = isHero
    ? 'w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] md:w-[268px] md:h-[268px]'
    : 'w-[84px] h-[84px] sm:w-[104px] sm:h-[104px]';

  return (
    <div className={`flex ${containerLayoutClass} gap-4 sm:gap-7 ${className}`}>
      {/* 3D Kapřík volně v prostoru — bez rámečku, splynutí krémového pozadí přes mix-blend-multiply a jemný radiální okraj */}
      <div className={`relative shrink-0 select-none flex items-center justify-center ${imageSizeClass}`}>
        <img
          src={imgSrc}
          onError={handleImgError}
          alt="Vánoční kapřík — průvodce Ježíškovou poštou"
          style={{
            mixBlendMode: 'multiply',
            WebkitMaskImage:
              'radial-gradient(circle at 50% 48%, rgba(0,0,0,1) 58%, rgba(0,0,0,0.88) 73%, rgba(0,0,0,0) 97%)',
            maskImage:
              'radial-gradient(circle at 50% 48%, rgba(0,0,0,1) 58%, rgba(0,0,0,0.88) 73%, rgba(0,0,0,0) 97%)',
          }}
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>

      {/* Skutečná mluvící bublina se zobáčkem mířícím přímo ke kapříkovi */}
      <div
        style={{ backgroundColor: '#FFFDF8' }}
        className={`relative rounded-[24px] bg-[#FFFDF8] border-[1.5px] border-[#1B4332] shadow-soft ${
          isHero
            ? 'px-6 py-5 sm:px-7 sm:py-6 max-w-md text-center sm:text-left'
            : 'px-4 py-3.5 sm:px-5 sm:py-4 flex-1 text-left'
        }`}
      >
        {/* Zobáček nahoru (pro mobilní zobrazení pod kapříkem nebo když bubbleDirection === 'top') */}
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

        {/* Zobáček doleva (míří přímo ke kapříkovi stojícímu vlevo) */}
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
                : 'text-sm sm:text-base leading-relaxed font-medium text-[#1E2421]'
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
