import React, { useEffect, useState } from 'react';

/**
 * Zachováno pro zpětnou kompatibilitu importů (známky mají vlastní ručně kreslený papírový podklad #F5EEDB)
 */
export const AVATAR_BG_COLORS = [
  { id: 'cream', hex: '#F5EEDB', name: 'Teplý papír' },
  { id: 'spruce', hex: '#DCECE5', name: 'Šalvějové jehličí' },
  { id: 'apple', hex: '#F7DFDF', name: 'Svíčková karmínová' },
  { id: 'honey', hex: '#FBF0D9', name: 'Zlatavý med' },
  { id: 'sky', hex: '#E3ECF5', name: 'Zimní soumrak' },
  { id: 'plum', hex: '#EDE4F2', name: 'Večerní vločka' },
];

/**
 * 6 ručně kreslených poštovních známek v českém ladovském stylu (public/assets/stamps/)
 */
export const AVATAR_OPTIONS = [
  { id: 'prasatko', label: 'Zlaté prasátko', src: '/assets/stamps/prasatko.png' },
  { id: 'liska', label: 'Zimní liška', src: '/assets/stamps/liska.png' },
  { id: 'zajic', label: 'Zimní zajíček', src: '/assets/stamps/zajic.png' },
  { id: 'sova', label: 'Zimní sova', src: '/assets/stamps/sova.png' },
  { id: 'srnecek', label: 'Zimní srneček', src: '/assets/stamps/srnecek.png' },
  { id: 'jezek', label: 'Zimní ježek', src: '/assets/stamps/jezek.png' },
];

const LEGACY_STAMP_MAP = {
  prasatko: 'prasatko',
  liska: 'liska',
  zajic: 'zajic',
  sova: 'sova',
  srnecek: 'srnecek',
  jezek: 'jezek',
  // Mapování starších ID z databáze na 6 ručně kreslených známek
  piglet: 'prasatko',
  carp: 'liska',
  bell: 'zajic',
  star: 'srnecek',
  gingerbread: 'jezek',
  twig: 'sova',
  stocking: 'zajic',
  candle: 'sova',
};

export function normalizeStampId(avatarId) {
  return LEGACY_STAMP_MAP[avatarId] || 'prasatko';
}

function renderFallbackAnimalSvg(stampId) {
  switch (stampId) {
    case 'liska':
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full" fill="none" aria-hidden="true">
          <rect width="80" height="80" fill="#F5EEDB" />
          <path d="M18 64 C24 48 56 48 62 64" fill="#C85A28" stroke="#1E2421" strokeWidth="2.2" />
          <path d="M22 36 L16 14 L34 26 Z" fill="#C85A28" stroke="#1E2421" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M58 36 L64 14 L46 26 Z" fill="#C85A28" stroke="#1E2421" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M20 36 C20 22 60 22 60 36 C60 48 46 56 40 56 C34 56 20 48 20 36 Z" fill="#D96B34" stroke="#1E2421" strokeWidth="2.2" />
          <path d="M22 40 C28 40 35 48 40 55 C45 48 52 40 58 40 C55 50 46 56 40 56 C34 56 25 50 22 40 Z" fill="#FFFDF8" />
          <circle cx="31" cy="36" r="2.5" fill="#1E2421" />
          <circle cx="49" cy="36" r="2.5" fill="#1E2421" />
          <circle cx="40" cy="49" r="3" fill="#1E2421" />
          <path d="M26 56 Q40 62 54 56" stroke="#8E1C1C" strokeWidth="6" strokeLinecap="round" />
        </svg>
      );
    case 'zajic':
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full" fill="none" aria-hidden="true">
          <rect width="80" height="80" fill="#F5EEDB" />
          <path d="M31 34 C25 10 19 10 24 36" fill="#C59B6D" stroke="#1E2421" strokeWidth="2.2" />
          <path d="M49 34 C55 10 61 10 56 36" fill="#C59B6D" stroke="#1E2421" strokeWidth="2.2" />
          <circle cx="40" cy="46" r="17" fill="#D2AC80" stroke="#1E2421" strokeWidth="2.2" />
          <circle cx="33" cy="42" r="2.4" fill="#1E2421" />
          <circle cx="47" cy="42" r="2.4" fill="#1E2421" />
          <ellipse cx="40" cy="49" rx="3.2" ry="2.2" fill="#8E1C1C" />
          <path d="M27 60 Q40 66 53 60" stroke="#1B4332" strokeWidth="5.5" strokeLinecap="round" />
        </svg>
      );
    case 'sova':
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full" fill="none" aria-hidden="true">
          <rect width="80" height="80" fill="#F5EEDB" />
          <ellipse cx="40" cy="46" rx="20" ry="22" fill="#9E7B56" stroke="#1E2421" strokeWidth="2.2" />
          <circle cx="32" cy="38" r="7" fill="#FFFDF8" stroke="#1E2421" strokeWidth="2" />
          <circle cx="48" cy="38" r="7" fill="#FFFDF8" stroke="#1E2421" strokeWidth="2" />
          <circle cx="32" cy="38" r="3" fill="#1E2421" />
          <circle cx="48" cy="38" r="3" fill="#1E2421" />
          <path d="M37 44 L43 44 L40 50 Z" fill="#C9963B" stroke="#1E2421" strokeWidth="1.6" />
        </svg>
      );
    case 'srnecek':
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full" fill="none" aria-hidden="true">
          <rect width="80" height="80" fill="#F5EEDB" />
          <path d="M24 30 L14 18 L20 36 Z" fill="#B88454" stroke="#1E2421" strokeWidth="2" />
          <path d="M56 30 L66 18 L60 36 Z" fill="#B88454" stroke="#1E2421" strokeWidth="2" />
          <ellipse cx="40" cy="44" rx="17" ry="19" fill="#C89664" stroke="#1E2421" strokeWidth="2.2" />
          <circle cx="32" cy="41" r="2.6" fill="#1E2421" />
          <circle cx="48" cy="41" r="2.6" fill="#1E2421" />
          <ellipse cx="40" cy="51" rx="4" ry="3" fill="#1E2421" />
          <circle cx="33" cy="29" r="1.8" fill="#FFFDF8" />
          <circle cx="45" cy="28" r="1.8" fill="#FFFDF8" />
          <circle cx="40" cy="33" r="1.6" fill="#FFFDF8" />
        </svg>
      );
    case 'jezek':
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full" fill="none" aria-hidden="true">
          <rect width="80" height="80" fill="#F5EEDB" />
          <path d="M16 44 C16 22 64 22 64 44 Z" fill="#5C4938" stroke="#1E2421" strokeWidth="2.2" />
          <ellipse cx="40" cy="48" rx="18" ry="14" fill="#D8B894" stroke="#1E2421" strokeWidth="2.2" />
          <circle cx="33" cy="45" r="2.4" fill="#1E2421" />
          <circle cx="47" cy="45" r="2.4" fill="#1E2421" />
          <circle cx="40" cy="51" r="3" fill="#8E1C1C" />
          <path d="M26 58 Q40 64 54 58" stroke="#8E1C1C" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case 'prasatko':
    default:
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full" fill="none" aria-hidden="true">
          <rect width="80" height="80" fill="#F5EEDB" />
          <path d="M22 30 L16 16 L30 23 Z" fill="#E6BE6A" stroke="#1E2421" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M58 30 L64 16 L50 23 Z" fill="#E6BE6A" stroke="#1E2421" strokeWidth="2.2" strokeLinejoin="round" />
          <circle cx="40" cy="44" r="19" fill="#F0CF82" stroke="#1E2421" strokeWidth="2.2" />
          <circle cx="32" cy="39" r="2.5" fill="#1E2421" />
          <circle cx="48" cy="39" r="2.5" fill="#1E2421" />
          <ellipse cx="40" cy="48" rx="7.5" ry="5.5" fill="#E5A598" stroke="#1E2421" strokeWidth="2" />
          <circle cx="37.5" cy="48" r="1.5" fill="#1E2421" />
          <circle cx="42.5" cy="48" r="1.5" fill="#1E2421" />
          <path d="M26 60 Q40 65 54 60" stroke="#8E1C1C" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
  }
}

/**
 * Zoubkovaná poštovní známka s ručně kresleným zimním zvířátkem (čistý ostrý obrázek, zoubkování pouze po obvodu)
 */
export function Avatar({
  avatarId = 'prasatko',
  size = 'md',
  selected = false,
  onTag = false,
  zoomAnimal = false,
  className = '',
}) {
  const stampId = normalizeStampId(avatarId);
  const option = AVATAR_OPTIONS.find((o) => o.id === stampId) || AVATAR_OPTIONS[0];
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [stampId]);

  const pixelDims = {
    xs: { width: '36px', height: '42px', pad: '3px' },
    sm: { width: '44px', height: '52px', pad: '4px' },
    nav: { width: '48px', height: '56px', pad: '3.5px' },
    md: { width: '58px', height: '68px', pad: '5px' },
    lg: { width: '76px', height: '88px', pad: '6px' },
    xl: { width: '104px', height: '122px', pad: '6px' },
    stampGrid: { width: '118px', height: '138px', pad: '6px' },
  };

  const dim = pixelDims[size] || pixelDims.md;

  return (
    <div
      style={{
        width: dim.width,
        height: dim.height,
        padding: dim.pad,
      }}
      className={`perforated-stamp relative inline-flex items-center justify-center shrink-0 select-none transition-shadow duration-200 ${
        onTag ? 'perforated-stamp-on-tag' : ''
      } ${selected ? 'perforated-stamp-selected' : ''} ${className}`}
    >
      <div
        className={`w-full h-full overflow-hidden relative bg-[#F5EEDB] ${
          selected
            ? 'ring-2 ring-[#C9963B]'
            : 'ring-1 ring-[#1B4332]/25'
        }`}
      >
        {!imgFailed ? (
          <img
            src={option.src}
            alt={option.label}
            draggable={false}
            onError={() => setImgFailed(true)}
            className={`w-full h-full object-cover object-center block ${
              zoomAnimal ? 'scale-[1.18]' : ''
            }`}
          />
        ) : (
          renderFallbackAnimalSvg(stampId)
        )}
      </div>

      {selected && (
        <img
          src="/assets/pecet-3d.png"
          alt=""
          draggable={false}
          aria-hidden="true"
          className="w-7 h-7 sm:w-8 sm:h-8 absolute -bottom-2 -right-2 object-contain pointer-events-none select-none drop-shadow-[0_3px_6px_rgba(30,36,33,0.28)] z-20"
        />
      )}
    </div>
  );
}

export function getChildAvatar(childName = '') {
  const clean = (childName || '').trim();
  const stamps = ['prasatko', 'liska', 'zajic', 'sova', 'srnecek', 'jezek'];
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  return {
    avatarId: stamps[hash % stamps.length],
    avatarBg: '#F5EEDB',
  };
}

/**
 * 3D starožitná mosazná sponka pro připnutí nahrané fotky papírového dopisu
 */
export function PaperClipSvg({ className = '' }) {
  return (
    <img
      src="/assets/sponka-3d.png"
      alt=""
      draggable={false}
      aria-hidden="true"
      className={`object-contain select-none pointer-events-none drop-shadow-[0_5px_10px_rgba(30,24,14,0.28)] ${className}`}
    />
  );
}

/**
 * 3D vosková pečeť v hluboké karmínové červeni s vyraženou hvězdou
 */
export function WaxSealSvg({ className = '', pressed = false }) {
  return (
    <img
      src="/assets/pecet-3d.png"
      alt=""
      draggable={false}
      aria-hidden="true"
      className={`object-contain select-none pointer-events-none drop-shadow-[0_6px_12px_rgba(77,12,12,0.28)] ${className} ${
        pressed ? 'wax-seal-press' : ''
      }`}
    />
  );
}

const PRESENT_3D_ASSETS = [
  '/assets/darek-1-3d.png',
  '/assets/darek-2-3d.png',
  '/assets/darek-3-3d.png',
];

export function WrappedPresentSvg({ seed = '', isBought = false, className = '' }) {
  const str = String(seed || 'gift');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  const src = PRESENT_3D_ASSETS[hash % PRESENT_3D_ASSETS.length];

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      <img
        src={src}
        alt=""
        draggable={false}
        aria-hidden="true"
        className="w-full h-full object-contain drop-shadow-[0_6px_12px_rgba(30,36,33,0.18)]"
      />
      {isBought && (
        <span
          aria-hidden="true"
          className="w-6 h-6 rounded-full bg-fir border-2 border-gold-glow text-white flex items-center justify-center shadow-sm absolute -top-1 -right-1"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
            <path
              d="M3.5 8.5 L6.5 11.5 L12.5 5"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </div>
  );
}

export function FairytaleOrnamentSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 220 36" className={className} fill="none" aria-hidden="true">
      <line x1="10" y1="18" x2="86" y2="18" stroke="#C9963B" strokeWidth="1.4" />
      <line x1="134" y1="18" x2="210" y2="18" stroke="#C9963B" strokeWidth="1.4" />
      <circle cx="94" cy="18" r="2.2" fill="#8E1C1C" />
      <circle cx="126" cy="18" r="2.2" fill="#8E1C1C" />
      <path
        d="M110 5 L113.5 13.5 L122 14.5 L115.5 20.5 L117.2 29 L110 24.5 L102.8 29 L104.5 20.5 L98 14.5 L106.5 13.5 Z"
        fill="#E5BE6B"
        stroke="#C9963B"
        strokeWidth="1"
      />
    </svg>
  );
}

export function MinimalSnowflakeSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <line x1="24" y1="4" x2="24" y2="44" />
        <line x1="6.7" y1="14" x2="41.3" y2="34" />
        <line x1="41.3" y1="14" x2="6.7" y2="34" />
        <path d="M20 9 L24 13 L28 9" />
        <path d="M20 39 L24 35 L28 39" />
        <path d="M9.5 19.5 L14.5 18.5 L13.5 13.5" />
        <path d="M38.5 28.5 L33.5 29.5 L34.5 34.5" />
        <path d="M34.5 13.5 L33.5 18.5 L38.5 19.5" />
        <path d="M13.5 34.5 L14.5 29.5 L9.5 28.5" />
      </g>
    </svg>
  );
}
