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
 * 3D zlatá mosazná sponka pro připnutí nahrané fotky papírového dopisu
 */
export function PaperClipSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 44 88" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="brassClip" x1="0" y1="0" x2="44" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F4D98C" />
          <stop offset="50%" stopColor="#C9963B" />
          <stop offset="100%" stopColor="#855E1A" />
        </linearGradient>
      </defs>
      <path
        d="M15 22 V62 C15 71 29 71 29 62 V16 C29 6 10 6 10 16 V65 C10 78 34 78 34 65 V24"
        stroke="rgba(27,67,50,0.22)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M14 20 V60 C14 69 28 69 28 60 V14 C28 4 9 4 9 14 V63 C9 76 33 76 33 63 V22"
        stroke="url(#brassClip)"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
    </svg>
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

export function ChristmasTreeLogoSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="27" y="50" width="10" height="8" rx="2" fill="#7D5233" />
      <path
        d="M32 24 L12 51 H52 L32 24 Z"
        fill="#1B4332"
        stroke="#133124"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M32 16 L15 39 H49 L32 16 Z"
        fill="#2D6A4F"
        stroke="#133124"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M32 9 L19 27 H45 L32 9 Z"
        fill="#3B7A5E"
        stroke="#133124"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M21 25 Q32 30 42 24 M17 37 Q32 43 46 36 M15 48 Q32 54 49 47"
        stroke="#E5BE6B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 2.5"
      />
      <circle cx="27" cy="23" r="2.3" fill="#8E1C1C" />
      <circle cx="37" cy="32" r="2.5" fill="#E5BE6B" />
      <circle cx="23" cy="35" r="2.4" fill="#8E1C1C" />
      <circle cx="28" cy="45" r="2.6" fill="#8E1C1C" />
      <circle cx="40" cy="44" r="2.4" fill="#E5BE6B" />
      <path
        d="M32 2 L34.2 6.8 L39.4 7.4 L35.5 11 L36.6 16 L32 13.4 L27.4 16 L28.5 11 L24.6 7.4 L29.8 6.8 Z"
        fill="#E5BE6B"
        stroke="#C9963B"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WrappedPresentSvg({ seed = '', isBought = false, className = '' }) {
  const str = String(seed || 'gift');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  const variant = hash % 5;

  const renderBoughtBadge = () => {
    if (!isBought) return null;
    return (
      <g>
        <circle cx="76" cy="20" r="13" fill="#1B4332" stroke="#E5BE6B" strokeWidth="2" />
        <path
          d="M70.5 20.5 L74.5 24.5 L82 16.5"
          stroke="#FFFDF8"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  };

  if (variant === 0) {
    return (
      <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
        <ellipse cx="48" cy="84" rx="30" ry="6" fill="rgba(27,67,50,0.14)" />
        <path d="M20 42 L48 54 V82 L20 70 Z" fill="#E5C896" stroke="#1B4332" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M76 42 L48 54 V82 L76 70 Z" fill="#D1B07B" stroke="#1B4332" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M17 36 L48 24 L79 36 L48 49 Z" fill="#F3DEC0" stroke="#1B4332" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M17 36 L48 49 V55 L17 42 Z" fill="#E9CEA0" stroke="#1B4332" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M79 36 L48 49 V55 L79 42 Z" fill="#D8B884" stroke="#1B4332" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M31 47 L38 50 V78 L31 75 Z" fill="#8E1C1C" stroke="#5A1010" strokeWidth="1.2" />
        <path d="M65 47 L58 50 V78 L65 75 Z" fill="#731515" stroke="#5A1010" strokeWidth="1.2" />
        <path d="M32 30 L64 42 L58 45 L26 33 Z" fill="#A82424" />
        <path d="M64 30 L32 42 L38 45 L70 33 Z" fill="#8E1C1C" />
        <path
          d="M48 34 C34 20 22 28 32 37 C37 41 44 37 48 34 Z"
          fill="#A82424"
          stroke="#5A1010"
          strokeWidth="1.5"
        />
        <path
          d="M48 34 C62 20 74 28 64 37 C59 41 52 37 48 34 Z"
          fill="#8E1C1C"
          stroke="#5A1010"
          strokeWidth="1.5"
        />
        <path d="M46 35 L37 48 L43 47 L48 37" fill="#8E1C1C" stroke="#5A1010" strokeWidth="1.1" />
        <path d="M50 35 L59 48 L53 47 L48 37" fill="#731515" stroke="#5A1010" strokeWidth="1.1" />
        <circle cx="48" cy="34" r="3.8" fill="#6E1414" stroke="#4D0C0C" strokeWidth="1.2" />
        {renderBoughtBadge()}
      </svg>
    );
  }

  if (variant === 1) {
    return (
      <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
        <ellipse cx="48" cy="84" rx="30" ry="6" fill="rgba(27,67,50,0.14)" />
        <path d="M19 40 L48 52 V81 L19 69 Z" fill="#A32424" stroke="#4D0C0C" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M77 40 L48 52 V81 L77 69 Z" fill="#8E1C1C" stroke="#4D0C0C" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M19 40 L48 28 L77 40 L48 52 Z" fill="#BA3030" stroke="#4D0C0C" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="27" cy="54" r="1.8" fill="#FFFDF8" opacity="0.88" />
        <circle cx="41" cy="68" r="1.8" fill="#FFFDF8" opacity="0.88" />
        <circle cx="26" cy="65" r="1.5" fill="#FFFDF8" opacity="0.75" />
        <circle cx="67" cy="54" r="1.8" fill="#FFFDF8" opacity="0.85" />
        <circle cx="56" cy="70" r="1.6" fill="#FFFDF8" opacity="0.85" />
        <circle cx="69" cy="65" r="1.5" fill="#FFFDF8" opacity="0.75" />
        <path d="M31 45 L36 47 V76 L31 74 Z" fill="#E5BE6B" stroke="#8C621E" strokeWidth="1.2" />
        <path d="M65 45 L60 47 V76 L65 74 Z" fill="#C9963B" stroke="#8C621E" strokeWidth="1.2" />
        <path d="M33 34 L63 46 L59 48 L29 36 Z" fill="#F0CF8E" />
        <path d="M63 34 L33 46 L37 48 L67 36 Z" fill="#E5BE6B" />
        <path
          d="M48 38 C35 25 24 32 33 40 C38 44 44 40 48 38 Z"
          fill="#F2D291"
          stroke="#8C621E"
          strokeWidth="1.5"
        />
        <path
          d="M48 38 C61 25 72 32 63 40 C58 44 52 40 48 38 Z"
          fill="#E5BE6B"
          stroke="#8C621E"
          strokeWidth="1.5"
        />
        <circle cx="48" cy="38" r="3.5" fill="#C9963B" stroke="#7A5210" strokeWidth="1.2" />
        {renderBoughtBadge()}
      </svg>
    );
  }

  if (variant === 2) {
    return (
      <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
        <ellipse cx="48" cy="83" rx="30" ry="6" fill="rgba(27,67,50,0.14)" />
        <path d="M18 43 L48 55 V80 L18 68 Z" fill="#2D6A4F" stroke="#133124" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M78 43 L48 55 V80 L78 68 Z" fill="#1B4332" stroke="#133124" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M18 43 L48 30 L78 43 L48 55 Z" fill="#3B7A5E" stroke="#133124" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M18 43 L30 58 L18 68" stroke="#133124" strokeWidth="1.1" opacity="0.55" />
        <path d="M78 43 L64 59 L78 68" stroke="#133124" strokeWidth="1.1" opacity="0.55" />
        <path d="M33 36.5 L63 49 V74" stroke="#E5BE6B" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M63 36.5 L33 49 V74" stroke="#E5BE6B" strokeWidth="2.4" strokeLinecap="round" />
        <path
          d="M48 42 C38 32 30 38 39 44 C42 46 46 44 48 42 Z"
          stroke="#F2D291"
          strokeWidth="2.3"
          fill="none"
        />
        <path
          d="M48 42 C58 32 66 38 57 44 C54 46 50 44 48 42 Z"
          stroke="#F2D291"
          strokeWidth="2.3"
          fill="none"
        />
        <path d="M48 43 L42 52 M48 43 L55 51" stroke="#E5BE6B" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="48" cy="42.5" r="2.6" fill="#C9963B" />
        {renderBoughtBadge()}
      </svg>
    );
  }

  if (variant === 3) {
    return (
      <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
        <ellipse cx="48" cy="83" rx="29" ry="6" fill="rgba(27,67,50,0.14)" />
        <path d="M20 42 L48 54 V80 L20 68 Z" fill="#DFC9A6" stroke="#1B4332" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M76 42 L48 54 V80 L76 68 Z" fill="#CBB28D" stroke="#1B4332" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M20 42 L48 30 L76 42 L48 54 Z" fill="#EFE5D1" stroke="#1B4332" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="28" cy="56" r="1.7" fill="#FFFDF8" opacity="0.9" />
        <circle cx="40" cy="67" r="1.7" fill="#FFFDF8" opacity="0.9" />
        <circle cx="62" cy="59" r="1.7" fill="#FFFDF8" opacity="0.9" />
        <circle cx="68" cy="68" r="1.5" fill="#FFFDF8" opacity="0.9" />
        <path d="M34 36 L62 48 V74" stroke="#8E1C1C" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M62 36 L34 48 V74" stroke="#8E1C1C" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M44 41 L35 35 M44 41 L38 33" stroke="#1B4332" strokeWidth="2.2" strokeLinecap="round" />
        <path
          d="M48 42 C39 33 32 39 40 45 C43 47 46 44 48 42 Z"
          fill="#A82424"
          stroke="#5A1010"
          strokeWidth="1.4"
        />
        <path
          d="M48 42 C57 33 64 39 56 45 C53 47 50 44 48 42 Z"
          fill="#8E1C1C"
          stroke="#5A1010"
          strokeWidth="1.4"
        />
        <circle cx="48" cy="42" r="2.8" fill="#6E1414" />
        {renderBoughtBadge()}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
      <ellipse cx="48" cy="84" rx="29" ry="6" fill="rgba(27,67,50,0.14)" />
      <path d="M20 41 L48 53 V81 L20 69 Z" fill="#F2E8D5" stroke="#1B4332" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M76 41 L48 53 V81 L76 69 Z" fill="#E2D4BC" stroke="#1B4332" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20 41 L48 29 L76 41 L48 53 Z" fill="#FFFDF8" stroke="#1B4332" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M31 46 L37 48.5 V76.5 L31 74 Z" fill="#2D6A4F" stroke="#133124" strokeWidth="1.2" />
      <path d="M65 46 L59 48.5 V76.5 L65 74 Z" fill="#1B4332" stroke="#133124" strokeWidth="1.2" />
      <path d="M33 35 L63 47 L58 49 L28 37 Z" fill="#3B7A5E" />
      <path d="M63 35 L33 47 L38 49 L68 37 Z" fill="#2D6A4F" />
      <path
        d="M48 39 C35 26 24 33 33 41 C38 45 44 41 48 39 Z"
        fill="#3B7A5E"
        stroke="#133124"
        strokeWidth="1.5"
      />
      <path
        d="M48 39 C61 26 72 33 63 41 C58 45 52 41 48 39 Z"
        fill="#2D6A4F"
        stroke="#133124"
        strokeWidth="1.5"
      />
      <circle cx="48" cy="39" r="3.6" fill="#C9963B" stroke="#7A5210" strokeWidth="1.2" />
      {renderBoughtBadge()}
    </svg>
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
