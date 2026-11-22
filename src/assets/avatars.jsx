import React from 'react';

/**
 * 6 teplých barev podkladu pro 3D poštovní známky
 */
export const AVATAR_BG_COLORS = [
  { id: 'cream', hex: '#F5E6D3', name: 'Vanilkový pergamen' },
  { id: 'spruce', hex: '#DCECE5', name: 'Šalvějové jehličí' },
  { id: 'apple', hex: '#F7DFDF', name: 'Svíčková karmínová' },
  { id: 'honey', hex: '#FBF0D9', name: 'Zlatavý med' },
  { id: 'sky', hex: '#E3ECF5', name: 'Zimní soumrak' },
  { id: 'plum', hex: '#EDE4F2', name: 'Večerní vločka' },
];

/**
 * 8 bohatě ilustrovaných 3D vánočních motivů stylizovaných jako poštovní známka
 */
export const AVATAR_OPTIONS = [
  { id: 'carp', label: 'Vánoční kapr' },
  { id: 'piglet', label: 'Zlaté prasátko' },
  { id: 'bell', label: 'Zvoneček' },
  { id: 'gingerbread', label: 'Perníček' },
  { id: 'star', label: 'Betlémská hvězda' },
  { id: 'twig', label: 'Smrková větvička' },
  { id: 'stocking', label: 'Punčocha' },
  { id: 'candle', label: 'Svíčka' },
];

function renderAvatarArtwork(avatarId) {
  switch (avatarId) {
    case 'carp':
      return (
        <img
          src="/assets/kaprik.png"
          alt="Vánoční kapr"
          className="w-full h-full object-cover rounded-[3px]"
        />
      );

    case 'piglet':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="pig3d" cx="35%" cy="28%" r="70%">
              <stop offset="0%" stopColor="#FFF0B8" />
              <stop offset="55%" stopColor="#E5B95C" />
              <stop offset="100%" stopColor="#A6741E" />
            </radialGradient>
            <radialGradient id="snout3d" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FAD2C8" />
              <stop offset="100%" stopColor="#C98878" />
            </radialGradient>
          </defs>
          <ellipse cx="32" cy="53" rx="14" ry="3.5" fill="rgba(27,67,50,0.18)" />
          <path d="M18 24 L14 12 L26 18 Z" fill="url(#pig3d)" stroke="#6E4B10" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M46 24 L50 12 L38 18 Z" fill="url(#pig3d)" stroke="#6E4B10" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="32" cy="34" r="16.5" fill="url(#pig3d)" stroke="#6E4B10" strokeWidth="2" />
          <path d="M22 22 C26 19 33 19 37 21" stroke="#FFFDF8" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
          <circle cx="21" cy="37" r="3" fill="#D96B6B" opacity="0.55" />
          <circle cx="43" cy="37" r="3" fill="#D96B6B" opacity="0.55" />
          <circle cx="25" cy="30" r="2.3" fill="#1E2421" />
          <circle cx="24.3" cy="29.3" r="0.8" fill="#FFFDF8" />
          <circle cx="39" cy="30" r="2.3" fill="#1E2421" />
          <circle cx="38.3" cy="29.3" r="0.8" fill="#FFFDF8" />
          <ellipse cx="32" cy="38.5" rx="7.2" ry="5.2" fill="url(#snout3d)" stroke="#6E4B10" strokeWidth="1.7" />
          <circle cx="29.5" cy="38.5" r="1.4" fill="#5C371C" />
          <circle cx="34.5" cy="38.5" r="1.4" fill="#5C371C" />
          <path d="M32 7 L33.5 11.5 L38 13 L33.5 14.5 L32 19 L30.5 14.5 L26 13 L30.5 11.5 Z" fill="#E5BE6B" stroke="#9E6E24" strokeWidth="0.8" />
        </svg>
      );

    case 'bell':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="bell3d" x1="16" y1="18" x2="48" y2="46" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFF0B8" />
              <stop offset="45%" stopColor="#DFAC4C" />
              <stop offset="100%" stopColor="#8F6014" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="54" rx="15" ry="3" fill="rgba(27,67,50,0.18)" />
          <circle cx="32" cy="13" r="3.5" stroke="#7A5210" strokeWidth="2" fill="#F9F0DD" />
          <circle cx="32" cy="48.5" r="4.5" fill="#8E1C1C" stroke="#5A1010" strokeWidth="1.8" />
          <path
            d="M32 17 C21.5 17 18.5 25 17.5 35.5 L12.5 44.5 H51.5 L46.5 35.5 C45.5 25 42.5 17 32 17 Z"
            fill="url(#bell3d)"
            stroke="#6E4B10"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M24 23 C22 26 21.5 31 21 36" stroke="#FFFDF8" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
          <path d="M26 17 L19 12 L22 20 Z" fill="#8E1C1C" stroke="#5A1010" strokeWidth="1.2" />
          <path d="M38 17 L45 12 L42 20 Z" fill="#8E1C1C" stroke="#5A1010" strokeWidth="1.2" />
          <circle cx="32" cy="17.5" r="2.6" fill="#B22828" stroke="#5A1010" strokeWidth="1.2" />
        </svg>
      );

    case 'gingerbread':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="ginger3d" cx="35%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#DFA56D" />
              <stop offset="60%" stopColor="#B5743C" />
              <stop offset="100%" stopColor="#7A481D" />
            </radialGradient>
          </defs>
          <ellipse cx="32" cy="55" rx="14" ry="3" fill="rgba(27,67,50,0.18)" />
          <circle cx="32" cy="19.5" r="9.5" fill="url(#ginger3d)" stroke="#5E3512" strokeWidth="2" />
          <path
            d="M25 28 L13.5 31 C11 31.8 11 36.5 14 37 L24 36 L22 50 C21.5 53 26 54 27.5 51 L32 42.5 L36.5 51 C38 54 42.5 53 42 50 L40 36 L50 37 C53 36.5 53 31.8 50.5 31 L39 28 Z"
            fill="url(#ginger3d)"
            stroke="#5E3512"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="28.5" cy="18" r="1.6" fill="#FFFDF8" />
          <circle cx="35.5" cy="18" r="1.6" fill="#FFFDF8" />
          <path d="M28 23 C30 25.5 34 25.5 36 23" stroke="#FFFDF8" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="33" r="2.3" fill="#8E1C1C" stroke="#FFFDF8" strokeWidth="1" />
          <circle cx="32" cy="39.5" r="2.3" fill="#1B4332" stroke="#FFFDF8" strokeWidth="1" />
        </svg>
      );

    case 'star':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="star3d" cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#FFF7D6" />
              <stop offset="50%" stopColor="#E5BE6B" />
              <stop offset="100%" stopColor="#9E6E1E" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="20" fill="#E5BE6B" opacity="0.22" />
          <path d="M32 6 L32 12 M32 52 L32 58 M6 32 L12 32 M52 32 L58 32" stroke="#C9963B" strokeWidth="2.2" strokeLinecap="round" />
          <path
            d="M32 11 L37.8 24.2 L52 25.8 L41.2 35.4 L44.2 49.2 L32 42 L19.8 49.2 L22.8 35.4 L12 25.8 L26.2 24.2 Z"
            fill="url(#star3d)"
            stroke="#7A5210"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="31" r="4.8" fill="#FFFDF8" opacity="0.9" />
          <circle cx="32" cy="31" r="2.2" fill="#C9963B" />
        </svg>
      );

    case 'twig':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          <path d="M13 49 C24 38 36 28 51 15" stroke="#5E3E26" strokeWidth="3" strokeLinecap="round" />
          <path d="M22 40 L16 30 M22 40 L32 43" stroke="#1B4332" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M29 34 L23 22 M29 34 L41 37" stroke="#1B4332" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M37 27 L32 15 M37 27 L49 29" stroke="#2D6A4F" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M44 21 L41 11 M44 21 L54 21" stroke="#2D6A4F" strokeWidth="2.3" strokeLinecap="round" />
          <circle cx="23.5" cy="43.5" r="3.8" fill="#8E1C1C" stroke="#520E0E" strokeWidth="1.4" />
          <circle cx="22.5" cy="42.5" r="1" fill="#FFFDF8" opacity="0.8" />
          <circle cx="30" cy="45.5" r="3.4" fill="#B22828" stroke="#520E0E" strokeWidth="1.4" />
          <circle cx="28" cy="39.5" r="3.2" fill="#8E1C1C" stroke="#520E0E" strokeWidth="1.4" />
        </svg>
      );

    case 'stocking':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="stock3d" x1="20" y1="18" x2="48" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#B82E2E" />
              <stop offset="60%" stopColor="#8E1C1C" />
              <stop offset="100%" stopColor="#5E1010" />
            </linearGradient>
          </defs>
          <path d="M22 14 C18 10 14 14 18 18" stroke="#9E6E24" strokeWidth="2.2" strokeLinecap="round" />
          <path
            d="M22 20 H40 V38 C40 43 47 43 49 48 C50.5 52 46 56 40 55 L27 52 C22 51 21 46 22 41 Z"
            fill="url(#stock3d)"
            stroke="#4F0D0D"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M41 44 C45 45 48 47 48.5 50.5 C46 54 42 54.5 39.5 54" fill="#E5BE6B" opacity="0.6" />
          <rect
            x="18.5"
            y="12.5"
            width="25"
            height="9.5"
            rx="4.7"
            fill="#FFFDF8"
            stroke="#1B4332"
            strokeWidth="2"
          />
          <path d="M31 28 V34 M28 31 H34" stroke="#E5BE6B" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'candle':
    default:
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          <circle cx="32" cy="17" r="10" fill="#E5BE6B" opacity="0.35" />
          <path
            d="M32 9 C36 14 37 19.5 32 22.5 C27 19.5 28 14 32 9 Z"
            fill="#E5BE6B"
            stroke="#9E6E24"
            strokeWidth="1.5"
          />
          <circle cx="32" cy="18" r="2" fill="#FFFDF8" />
          <line x1="32" y1="22.5" x2="32" y2="26" stroke="#1E2421" strokeWidth="1.8" strokeLinecap="round" />
          <rect
            x="23"
            y="26"
            width="18"
            height="24"
            rx="3"
            fill="#8E1C1C"
            stroke="#520E0E"
            strokeWidth="2"
          />
          <path d="M23 29 C26 32 29 29 31 33 C33 36 35 30 41 29" fill="#FFFDF8" />
          <path
            d="M16.5 50 H47.5 C47.5 53.5 43 55.5 32 55.5 C21 55.5 16.5 53.5 16.5 50 Z"
            fill="#E5BE6B"
            stroke="#7A5210"
            strokeWidth="2"
          />
        </svg>
      );
  }
}

/**
 * Zoubkovaná 3D poštovní známka se zlatým okrajem — vizuální identita napříč aplikací
 */
export function Avatar({ avatarId = 'carp', avatarBg = '#F5E6D3', size = 'md', className = '' }) {
  const sizeClasses = {
    xs: 'w-8 h-8 p-[2px]',
    sm: 'w-10 h-10 p-[2.5px]',
    md: 'w-13 h-13 p-[3px]',
    lg: 'w-16 h-16 p-1',
    xl: 'w-22 h-22 p-1.5',
  };

  const pixelDims = {
    xs: { width: '32px', height: '34px' },
    sm: { width: '40px', height: '42px' },
    md: { width: '50px', height: '54px' },
    lg: { width: '64px', height: '68px' },
    xl: { width: '84px', height: '90px' },
  };

  return (
    <div
      style={pixelDims[size] || pixelDims.md}
      className={`postage-stamp-frame rounded-[6px] flex flex-col items-center justify-center shrink-0 select-none overflow-hidden ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <div
        style={{ backgroundColor: avatarBg || '#F5E6D3' }}
        className="w-full h-full rounded-[4px] border border-[#C9963B]/75 flex items-center justify-center overflow-hidden relative"
      >
        {renderAvatarArtwork(avatarId)}
        {(size === 'lg' || size === 'xl') && (
          <span className="absolute bottom-0.5 right-1 px-1 rounded bg-[#FFFDF8]/90 border border-[#C9963B]/50 text-[8px] font-bold tracking-tighter text-[#1B4332] leading-tight">
            24·XII
          </span>
        )}
      </div>
    </div>
  );
}

export function getChildAvatar(childName = '') {
  const clean = (childName || '').trim();
  const childAvatars = ['bell', 'gingerbread', 'star', 'stocking', 'piglet', 'candle', 'carp', 'twig'];
  const childBgs = ['#FBF0D9', '#F7DFDF', '#DCECE5', '#E3ECF5', '#EDE4F2', '#F5E6D3'];
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  return {
    avatarId: childAvatars[hash % childAvatars.length],
    avatarBg: childBgs[hash % childBgs.length],
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
      {/* Stín sponky */}
      <path
        d="M15 22 V62 C15 71 29 71 29 62 V16 C29 6 10 6 10 16 V65 C10 78 34 78 34 65 V24"
        stroke="rgba(27,67,50,0.22)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      {/* Mosazný drát sponky */}
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
 * Smrková větvička s kyvadlově se pohupující zlatou hvězdičkou a červenou mašlí
 */
export function SpruceCornerSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 140 120" className={className} fill="none" aria-hidden="true">
      <path d="M12 96 C42 74 74 48 118 16" stroke="#6E4E37" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M26 84 L18 64 M26 84 L48 88" stroke="#1B4332" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M44 70 L36 48 M44 70 L68 75" stroke="#1B4332" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M64 55 L56 33 M64 55 L88 60" stroke="#2D6A4F" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M84 40 L78 21 M84 40 L106 44" stroke="#2D6A4F" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M102 27 L98 13 M102 27 L119 29" stroke="#3F7865" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M52 62 C41 53 34 61 42 69 C46 72 50 67 52 62 Z"
        fill="#8E1C1C"
        stroke="#5E1010"
        strokeWidth="1.4"
      />
      <path
        d="M55 62 C66 53 73 61 65 69 C61 72 57 67 55 62 Z"
        fill="#8E1C1C"
        stroke="#5E1010"
        strokeWidth="1.4"
      />
      <path d="M51 65 L45 81 L51 78 L53 66" fill="#8E1C1C" />
      <path d="M56 65 L62 81 L56 78 L54 66" fill="#8E1C1C" />
      <circle cx="53.5" cy="63" r="3.2" fill="#5E1010" />
      <g className="hanging-star-swing">
        <line x1="88" y1="42" x2="88" y2="57" stroke="#C9963B" strokeWidth="1.4" strokeDasharray="2 2" />
        <path
          d="M88 57 L91.2 64.2 L99 65 L93.2 70.2 L94.8 78 L88 73.8 L81.2 78 L82.8 70.2 L77 65 L84.8 64.2 Z"
          fill="#E5BE6B"
          stroke="#C9963B"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="88" cy="68" r="2.2" fill="#FFFDF8" opacity="0.85" />
      </g>
    </svg>
  );
}

/**
 * Svíčkově karmínová 3D vosková pečeť (#8E1C1C) s vyraženou zlatou hvězdou
 */
export function WaxSealSvg({ className = '', pressed = false }) {
  return (
    <svg
      viewBox="0 0 88 88"
      className={`${className} ${pressed ? 'wax-seal-press' : ''}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="waxRimGrad" cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#B82E2E" />
          <stop offset="52%" stopColor="#8E1C1C" />
          <stop offset="100%" stopColor="#570E0E" />
        </radialGradient>
        <radialGradient id="waxInnerGrad" cx="65%" cy="70%" r="65%">
          <stop offset="0%" stopColor="#9E2222" />
          <stop offset="100%" stopColor="#661212" />
        </radialGradient>
      </defs>
      <ellipse cx="45" cy="49" rx="34" ry="33" fill="rgba(27, 67, 50, 0.22)" />
      <path
        d="M44 8 C53 7 59 11 66 15 C73 19 80 25 80 35 C80 44 79 52 75 60 C71 68 65 76 56 79 C47 82 39 79 30 77 C21 75 13 69 10 60 C7 51 8 42 10 33 C12 24 17 16 25 12 C33 8 36 9 44 8 Z"
        fill="url(#waxRimGrad)"
        stroke="#4D0C0C"
        strokeWidth="1.4"
      />
      <path
        d="M22 20 C29 13 41 11 52 13"
        stroke="#E88D8D"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle
        cx="44"
        cy="44"
        r="24"
        fill="url(#waxInnerGrad)"
        stroke="#4D0C0C"
        strokeWidth="1.8"
      />
      <circle
        cx="44"
        cy="44"
        r="21.5"
        stroke="#E5BE6B"
        strokeWidth="1"
        strokeDasharray="2.5 2"
        opacity="0.75"
      />
      <path
        d="M44 27 L47.6 37.8 L59 38.6 L50.2 45.8 L53 56.8 L44 50.6 L35 56.8 L37.8 45.8 L29 38.6 L40.4 37.8 Z"
        fill="#E5BE6B"
        fillOpacity="0.35"
        stroke="#E5BE6B"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="44" cy="44" r="2.4" fill="#FFFDF8" opacity="0.88" />
    </svg>
  );
}

/**
 *Detail dírky papírové dárkové jmenovky s provlečenou zlatou šňůrkou
 */
export function GiftTagCordSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 64 48" className={className} fill="none" aria-hidden="true">
      <path
        d="M2 10 C12 6 24 14 34 24"
        stroke="#C9963B"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M8 2 C16 10 26 16 34 24"
        stroke="#E5BE6B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle
        cx="36"
        cy="25"
        r="7"
        fill="#EFE5D1"
        stroke="#1B4332"
        strokeWidth="2.2"
      />
      <circle
        cx="36"
        cy="25"
        r="4.2"
        fill="#FFFDF8"
      />
    </svg>
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

export function CompactMistletoeSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 120 36" className={className} fill="none" aria-hidden="true">
      <path d="M12 24 Q55 14 104 20" stroke="#6E4E37" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M36 18 C28 9 20 12 25 20 C28 24 34 21 36 18 Z"
        fill="#2D6A4F"
        stroke="#1B4332"
        strokeWidth="1.2"
      />
      <path
        d="M42 18 C46 8 55 10 51 18 C49 22 44 20 42 18 Z"
        fill="#4F8A6E"
        stroke="#1B4332"
        strokeWidth="1.2"
      />
      <path
        d="M68 18 C62 8 54 11 58 19 C60 22 66 20 68 18 Z"
        fill="#2D6A4F"
        stroke="#1B4332"
        strokeWidth="1.2"
      />
      <path
        d="M74 19 C80 10 89 12 85 20 C82 24 76 21 74 19 Z"
        fill="#4F8A6E"
        stroke="#1B4332"
        strokeWidth="1.2"
      />
      <circle cx="39" cy="20" r="2.8" fill="#FFFDF8" stroke="#C9963B" strokeWidth="1.1" />
      <circle cx="43" cy="22" r="2.5" fill="#FFFDF8" stroke="#C9963B" strokeWidth="1.1" />
      <circle cx="71" cy="20" r="2.8" fill="#FFFDF8" stroke="#C9963B" strokeWidth="1.1" />
      <circle cx="67" cy="22.5" r="2.4" fill="#FFFDF8" stroke="#C9963B" strokeWidth="1.1" />
    </svg>
  );
}

export function TagMistletoeCornerSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 96 84" className={className} fill="none" aria-hidden="true">
      <path d="M10 74 C24 56 42 42 64 34" stroke="#5A422E" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 62 C26 44 34 30 46 18" stroke="#5A422E" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M32 50 C20 42 15 49 23 57 C27 61 31 54 32 50 Z"
        fill="#2D6A4F"
        stroke="#1B4332"
        strokeWidth="1.3"
      />
      <path
        d="M44 42 C48 30 58 32 53 42 C50 47 45 45 44 42 Z"
        fill="#588770"
        stroke="#1B4332"
        strokeWidth="1.3"
      />
      <path
        d="M34 33 C24 23 20 30 27 38 C30 41 33 36 34 33 Z"
        fill="#588770"
        stroke="#1B4332"
        strokeWidth="1.3"
      />
      <path
        d="M42 24 C45 13 54 15 50 24 C48 28 43 26 42 24 Z"
        fill="#2D6A4F"
        stroke="#1B4332"
        strokeWidth="1.3"
      />
      <path
        d="M54 38 C62 32 69 38 61 44 C57 47 54 41 54 38 Z"
        fill="#2D6A4F"
        stroke="#1B4332"
        strokeWidth="1.3"
      />
      <circle cx="36" cy="46" r="3.4" fill="#FFFDF8" stroke="#8C7355" strokeWidth="1.1" />
      <circle cx="41" cy="49" r="3" fill="#FFFDF8" stroke="#8C7355" strokeWidth="1.1" />
      <circle cx="39" cy="42" r="2.8" fill="#FFFDF8" stroke="#8C7355" strokeWidth="1.1" />
      <circle cx="36" cy="29" r="3" fill="#FFFDF8" stroke="#8C7355" strokeWidth="1.1" />
      <circle cx="41" cy="31" r="2.7" fill="#FFFDF8" stroke="#8C7355" strokeWidth="1.1" />
    </svg>
  );
}

export function TagPostalStampSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 120 56" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 18 Q16 14 28 18 T52 18 M4 26 Q16 22 28 26 T52 26 M4 34 Q16 30 28 34 T52 34 M4 42 Q16 38 28 42 T52 42"
        stroke="#8E1C1C"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.65"
      />
      <circle
        cx="84"
        cy="28"
        r="23"
        stroke="#8E1C1C"
        strokeWidth="1.6"
        opacity="0.72"
      />
      <circle
        cx="84"
        cy="28"
        r="19"
        stroke="#8E1C1C"
        strokeWidth="1"
        strokeDasharray="2.5 2"
        opacity="0.6"
      />
      <line x1="65" y1="22" x2="103" y2="22" stroke="#8E1C1C" strokeWidth="1.1" opacity="0.65" />
      <line x1="65" y1="34" x2="103" y2="34" stroke="#8E1C1C" strokeWidth="1.1" opacity="0.65" />
      <text
        x="84"
        y="31"
        textAnchor="middle"
        fill="#8E1C1C"
        opacity="0.82"
        fontSize="7.5"
        fontWeight="700"
        letterSpacing="1"
      >
        JEŽÍŠEK
      </text>
      <text
        x="84"
        y="19"
        textAnchor="middle"
        fill="#8E1C1C"
        opacity="0.72"
        fontSize="5.5"
        fontWeight="600"
      >
        24 · XII
      </text>
    </svg>
  );
}

/**
 * 5 pestrých 3D izometrických ilustrací zabalených vánočních dárků pro Nákupní seznam
 * Při zaškrtnutí (isBought) se u ilustrace zobrazí zlatá pečeť s fajfkou potvrzující zabalení.
 */
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
