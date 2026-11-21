import React from 'react';

/**
 * 6 jemných pastelových barev pozadí pro uživatelské avatary
 */
export const AVATAR_BG_COLORS = [
  { id: 'cream', hex: '#F5E6D3', name: 'Vanilkový krém' },
  { id: 'spruce', hex: '#DCECE5', name: 'Jemné jehličí' },
  { id: 'apple', hex: '#F7DFDF', name: 'Pastelové jablíčko' },
  { id: 'honey', hex: '#FBF0D9', name: 'Zlatavý med' },
  { id: 'sky', hex: '#E3ECF5', name: 'Zimní obloha' },
  { id: 'plum', hex: '#EDE4F2', name: 'Večerní vločka' },
];

/**
 * 8 vlastních pastelových vánočních SVG ilustrací
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

function renderAvatarSvg(avatarId) {
  switch (avatarId) {
    case 'carp':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          {/* Ocasní ploutev */}
          <path
            d="M46 32 L57 22 C58 28 58 36 57 42 Z"
            fill="#9DB8AC"
            stroke="#2D5A4C"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Hřbetní ploutev */}
          <path
            d="M24 21 C28 14 37 15 41 22"
            fill="#C7DCD3"
            stroke="#2D5A4C"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Tělo kapříka */}
          <ellipse
            cx="29"
            cy="32"
            rx="19"
            ry="11.5"
            fill="#D4E4DC"
            stroke="#2D5A4C"
            strokeWidth="2.2"
          />
          {/* Zlaté šupinky */}
          <path d="M27 27 C29 29 29 35 27 37" stroke="#D4A359" strokeWidth="2" strokeLinecap="round" />
          <path d="M33 26 C35 29 35 35 33 38" stroke="#D4A359" strokeWidth="2" strokeLinecap="round" />
          <path d="M39 28 C40.5 30 40.5 34 39 36" stroke="#D4A359" strokeWidth="2" strokeLinecap="round" />
          {/* Oko a úsměv */}
          <circle cx="17" cy="30" r="2.2" fill="#2C302E" />
          <circle cx="16.4" cy="29.4" r="0.7" fill="#FFFFFF" />
          <path d="M11.5 34 C13 36 15.5 36 17 34.5" stroke="#2D5A4C" strokeWidth="1.8" strokeLinecap="round" />
          {/* Malá zlatá korunka/bublinka */}
          <circle cx="9" cy="22" r="2" fill="#D4A359" opacity="0.8" />
          <circle cx="13" cy="17" r="1.4" fill="#D4A359" opacity="0.6" />
        </svg>
      );

    case 'piglet':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          {/* Ouška */}
          <path d="M18 24 L15 13 L25 19 Z" fill="#F2C882" stroke="#9E6E24" strokeWidth="2" strokeLinejoin="round" />
          <path d="M46 24 L49 13 L39 19 Z" fill="#F2C882" stroke="#9E6E24" strokeWidth="2" strokeLinejoin="round" />
          {/* Hlava zlatého prasátka */}
          <circle cx="32" cy="34" r="16" fill="#F6D89C" stroke="#9E6E24" strokeWidth="2.2" />
          {/* Růžové tvářičky */}
          <circle cx="21" cy="37" r="2.8" fill="#E89A9A" opacity="0.65" />
          <circle cx="43" cy="37" r="2.8" fill="#E89A9A" opacity="0.65" />
          {/* Oči */}
          <circle cx="25" cy="30" r="2" fill="#2C302E" />
          <circle cx="39" cy="30" r="2" fill="#2C302E" />
          {/* Rypáček */}
          <ellipse cx="32" cy="38" rx="7" ry="5" fill="#F2B5A7" stroke="#9E6E24" strokeWidth="1.8" />
          <circle cx="29.5" cy="38" r="1.3" fill="#7D4F35" />
          <circle cx="34.5" cy="38" r="1.3" fill="#7D4F35" />
          {/* Zlatá jiskřička */}
          <path d="M32 10 L33.5 14 L37.5 15.5 L33.5 17 L32 21 L30.5 17 L26.5 15.5 L30.5 14 Z" fill="#D4A359" />
        </svg>
      );

    case 'bell':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          {/* Kroužek nahoře */}
          <circle cx="32" cy="14" r="3.5" stroke="#9E6E24" strokeWidth="2.2" fill="#FAF2E1" />
          {/* Srdce zvonečku */}
          <circle cx="32" cy="48" r="4.2" fill="#B84A4A" stroke="#7A2D2D" strokeWidth="1.8" />
          {/* Zvon */}
          <path
            d="M32 17 C22 17 19 25 18 35 L13 44 H51 L46 35 C45 25 42 17 32 17 Z"
            fill="#E6BE73"
            stroke="#9E6E24"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Odlesk */}
          <path d="M25 23 C23 26 22.5 31 22 36" stroke="#FDFBF7" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
          {/* Červená mašlička */}
          <path d="M26 17 L21 13 L23 19 Z" fill="#B84A4A" />
          <path d="M38 17 L43 13 L41 19 Z" fill="#B84A4A" />
          <circle cx="32" cy="17.5" r="2.2" fill="#B84A4A" />
        </svg>
      );

    case 'gingerbread':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          {/* Tělo perníčku */}
          <circle cx="32" cy="20" r="9.5" fill="#C98D59" stroke="#7E4F28" strokeWidth="2.2" />
          <path
            d="M25 28 L14 31 C11.5 31.8 11.5 36.5 14.5 37 L24 36 L22 50 C21.5 53 26 54 27.5 51 L32 42 L36.5 51 C38 54 42.5 53 42 50 L40 36 L49.5 37 C52.5 36.5 52.5 31.8 50 31 L39 28 Z"
            fill="#C98D59"
            stroke="#7E4F28"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Poleva a očka */}
          <circle cx="28.5" cy="18.5" r="1.5" fill="#FDFBF7" />
          <circle cx="35.5" cy="18.5" r="1.5" fill="#FDFBF7" />
          <path d="M28 23 C30 25.5 34 25.5 36 23" stroke="#FDFBF7" strokeWidth="1.8" strokeLinecap="round" />
          {/* Knoflíčky */}
          <circle cx="32" cy="33" r="2" fill="#B84A4A" />
          <circle cx="32" cy="39" r="2" fill="#2D5A4C" />
        </svg>
      );

    case 'star':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          {/* Paprsky okolo */}
          <path d="M32 7 L32 13 M32 51 L32 57 M7 32 L13 32 M51 32 L57 32" stroke="#D4A359" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          {/* Betlémská hvězda */}
          <path
            d="M32 12 L37.5 24.5 L51 26 L40.8 35.2 L43.6 48.5 L32 41.8 L20.4 48.5 L23.2 35.2 L13 26 L26.5 24.5 Z"
            fill="#ECC778"
            stroke="#9E6E24"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Vnitřní lesk */}
          <circle cx="32" cy="31" r="4.5" fill="#FDFBF7" opacity="0.85" />
          <circle cx="32" cy="31" r="2" fill="#D4A359" />
        </svg>
      );

    case 'twig':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          {/* Dřevitá větvička */}
          <path d="M14 48 C24 38 36 28 50 16" stroke="#6E4E37" strokeWidth="2.6" strokeLinecap="round" />
          {/* Jehličí */}
          <path d="M22 40 L17 31 M22 40 L31 43" stroke="#2D5A4C" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M29 34 L24 23 M29 34 L40 37" stroke="#2D5A4C" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M37 27 L33 16 M37 27 L48 29" stroke="#3F7865" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M44 21 L41 12 M44 21 L53 21" stroke="#3F7865" strokeWidth="2.2" strokeLinecap="round" />
          {/* Červené bobulky cesmíny */}
          <circle cx="24" cy="43" r="3.4" fill="#B84A4A" stroke="#7A2D2D" strokeWidth="1.4" />
          <circle cx="30" cy="45" r="3" fill="#C95A5A" stroke="#7A2D2D" strokeWidth="1.4" />
          <circle cx="28" cy="39.5" r="2.8" fill="#B84A4A" stroke="#7A2D2D" strokeWidth="1.4" />
        </svg>
      );

    case 'stocking':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          {/* Poutko */}
          <path d="M22 14 C18 10 14 14 18 18" stroke="#9E6E24" strokeWidth="2" strokeLinecap="round" />
          {/* Punčocha */}
          <path
            d="M22 20 H40 V38 C40 43 47 43 49 48 C50.5 52 46 56 40 55 L27 52 C22 51 21 46 22 41 Z"
            fill="#C95A5A"
            stroke="#7A2D2D"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Pata a špička */}
          <path d="M41 44 C45 45 48 47 48.5 50.5 C46 54 42 54.5 39.5 54" fill="#D4A359" opacity="0.45" />
          {/* Bílý nadýchaný lem */}
          <rect
            x="19"
            y="13"
            width="24"
            height="9"
            rx="4.5"
            fill="#FDFBF7"
            stroke="#2D5A4C"
            strokeWidth="2"
          />
          {/* Vyšívaná hvězdička */}
          <path d="M31 28 V34 M28 31 H34" stroke="#FDFBF7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'candle':
    default:
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          {/* Záře plamínku */}
          <circle cx="32" cy="18" r="9" fill="#FAF2E1" opacity="0.9" />
          {/* Plamínek */}
          <path
            d="M32 10 C35.5 14.5 36.5 19.5 32 22.5 C27.5 19.5 28.5 14.5 32 10 Z"
            fill="#E5A93B"
            stroke="#9E6E24"
            strokeWidth="1.6"
          />
          {/* Knot */}
          <line x1="32" y1="22.5" x2="32" y2="26" stroke="#2C302E" strokeWidth="1.8" strokeLinecap="round" />
          {/* Tělo svíčky */}
          <rect
            x="23"
            y="26"
            width="18"
            height="24"
            rx="3"
            fill="#B84A4A"
            stroke="#7A2D2D"
            strokeWidth="2"
          />
          {/* Steklý vosk */}
          <path d="M23 29 C26 32 29 29 31 33 C33 36 35 30 41 29" fill="#FDFBF7" />
          {/* Zlatý svícen */}
          <path
            d="M17 50 H47 C47 53 43 55 32 55 C21 55 17 53 17 50 Z"
            fill="#E6BE73"
            stroke="#9E6E24"
            strokeWidth="2"
          />
        </svg>
      );
  }
}

export function Avatar({ avatarId = 'star', avatarBg = '#F5E6D3', size = 'md', className = '' }) {
  const sizeClasses = {
    xs: 'w-7 h-7 p-1',
    sm: 'w-9 h-9 p-1.5',
    md: 'w-12 h-12 p-1.5',
    lg: 'w-16 h-16 p-2',
    xl: 'w-20 h-20 p-2.5',
  };

  return (
    <div
      style={{ backgroundColor: avatarBg || '#F5E6D3' }}
      className={`rounded-full flex items-center justify-center shrink-0 border border-black/5 shadow-sm overflow-hidden ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {renderAvatarSvg(avatarId)}
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
 * Dekorativní SVG motivy pro hlavičku a tiskové šablony dopisů
 * Smrková větvička s kyvadlově se pohupující zlatou hvězdičkou a červenou mašlí
 */
export function SpruceCornerSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 140 120" className={className} fill="none" aria-hidden="true">
      {/* Smrková větvička */}
      <path d="M12 96 C42 74 74 48 118 16" stroke="#6E4E37" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M26 84 L18 64 M26 84 L48 88" stroke="#234B3E" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M44 70 L36 48 M44 70 L68 75" stroke="#234B3E" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M64 55 L56 33 M64 55 L88 60" stroke="#2D5A4C" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M84 40 L78 21 M84 40 L106 44" stroke="#2D5A4C" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M102 27 L98 13 M102 27 L119 29" stroke="#3F7865" strokeWidth="2" strokeLinecap="round" />
      {/* Červená vánoční mašle */}
      <path
        d="M52 62 C41 53 34 61 42 69 C46 72 50 67 52 62 Z"
        fill="#B23A3A"
        stroke="#8F2B2B"
        strokeWidth="1.4"
      />
      <path
        d="M55 62 C66 53 73 61 65 69 C61 72 57 67 55 62 Z"
        fill="#B23A3A"
        stroke="#8F2B2B"
        strokeWidth="1.4"
      />
      <path d="M51 65 L45 81 L51 78 L53 66" fill="#B23A3A" />
      <path d="M56 65 L62 81 L56 78 L54 66" fill="#B23A3A" />
      <circle cx="53.5" cy="63" r="3.2" fill="#8F2B2B" />
      {/* Pohupující se zlatá hvězdička na stužce */}
      <g className="hanging-star-swing">
        <line x1="88" y1="42" x2="88" y2="57" stroke="#C89646" strokeWidth="1.4" strokeDasharray="2 2" />
        <path
          d="M88 57 L91.2 64.2 L99 65 L93.2 70.2 L94.8 78 L88 73.8 L81.2 78 L82.8 70.2 L77 65 L84.8 64.2 Z"
          fill="#ECC778"
          stroke="#C89646"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="88" cy="68" r="2.2" fill="#FFFDF9" opacity="0.85" />
      </g>
    </svg>
  );
}

/**
 * Červená vosková pečeť s plastickým okrajem a reliéfem vánoční hvězdy
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
        <radialGradient id="waxRimGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#C44545" />
          <stop offset="55%" stopColor="#A63434" />
          <stop offset="100%" stopColor="#7A2222" />
        </radialGradient>
        <radialGradient id="waxInnerGrad" cx="65%" cy="70%" r="65%">
          <stop offset="0%" stopColor="#B83B3B" />
          <stop offset="100%" stopColor="#862626" />
        </radialGradient>
      </defs>
      {/* Měkký stín pod pečetí */}
      <ellipse cx="45" cy="48" rx="34" ry="33" fill="rgba(36, 40, 38, 0.16)" />
      {/* Nepravidelný zvlněný okraj roztaveného vosku */}
      <path
        d="M44 8 C53 7 59 11 66 15 C73 19 80 25 80 35 C80 44 79 52 75 60 C71 68 65 76 56 79 C47 82 39 79 30 77 C21 75 13 69 10 60 C7 51 8 42 10 33 C12 24 17 16 25 12 C33 8 36 9 44 8 Z"
        fill="url(#waxRimGrad)"
        stroke="#731F1F"
        strokeWidth="1.2"
      />
      {/* Lesk na horní hraně vosku */}
      <path
        d="M22 20 C29 13 41 11 52 13"
        stroke="#E88D8D"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Vnitřní vyražený kruh */}
      <circle
        cx="44"
        cy="44"
        r="24"
        fill="url(#waxInnerGrad)"
        stroke="#6B1D1D"
        strokeWidth="1.6"
      />
      <circle
        cx="44"
        cy="44"
        r="21.5"
        stroke="#D4A359"
        strokeWidth="0.9"
        strokeDasharray="2.5 2"
        opacity="0.65"
      />
      {/* Reliéf vánoční hvězdy uprostřed pečeti */}
      <path
        d="M44 27 L47.6 37.8 L59 38.6 L50.2 45.8 L53 56.8 L44 50.6 L35 56.8 L37.8 45.8 L29 38.6 L40.4 37.8 Z"
        fill="#D4A359"
        fillOpacity="0.28"
        stroke="#E6BE73"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="44" cy="44" r="2.3" fill="#FAF0D7" opacity="0.8" />
    </svg>
  );
}

/**
 * Detail dírky papírové dárkové jmenovky s provlečenou zlatou šňůrkou
 */
export function GiftTagCordSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 64 48" className={className} fill="none" aria-hidden="true">
      {/* Zlatá šňůrka směřující k okraji jmenovky */}
      <path
        d="M2 10 C12 6 24 14 34 24"
        stroke="#C89646"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M8 2 C16 10 26 16 34 24"
        stroke="#DFB46B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Kovový/zlatý kroužek dírky v papíru */}
      <circle
        cx="36"
        cy="25"
        r="7"
        fill="#EFE8D8"
        stroke="#C89646"
        strokeWidth="2.4"
      />
      <circle
        cx="36"
        cy="25"
        r="4.2"
        fill="#FFFDF9"
      />
    </svg>
  );
}

/**
 * Barevný vánoční stromeček do loga v horní liště
 */
export function ChristmasTreeLogoSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      {/* Kmen */}
      <rect x="27" y="50" width="10" height="8" rx="2" fill="#7D5233" />
      {/* Vrstvy jehličí */}
      <path
        d="M32 24 L12 51 H52 L32 24 Z"
        fill="#234B3E"
        stroke="#19382E"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M32 16 L15 39 H49 L32 16 Z"
        fill="#2D5A4C"
        stroke="#19382E"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M32 9 L19 27 H45 L32 9 Z"
        fill="#3B6E5C"
        stroke="#19382E"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Zlatý řetěz */}
      <path
        d="M21 25 Q32 30 42 24 M17 37 Q32 43 46 36 M15 48 Q32 54 49 47"
        stroke="#DFB46B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 2.5"
      />
      {/* Vánoční ozdoby */}
      <circle cx="27" cy="23" r="2.3" fill="#B23A3A" />
      <circle cx="37" cy="32" r="2.5" fill="#E6BE73" />
      <circle cx="23" cy="35" r="2.4" fill="#B23A3A" />
      <circle cx="28" cy="45" r="2.6" fill="#B23A3A" />
      <circle cx="40" cy="44" r="2.4" fill="#E6BE73" />
      {/* Hvězda na špičce */}
      <path
        d="M32 2 L34.2 6.8 L39.4 7.4 L35.5 11 L36.6 16 L32 13.4 L27.4 16 L28.5 11 L24.6 7.4 L29.8 6.8 Z"
        fill="#ECC778"
        stroke="#C89646"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Kompaktní jemná větvička jmelí nad nadpis dopisu „Milý Ježíšku,“
 */
export function CompactMistletoeSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 120 36" className={className} fill="none" aria-hidden="true">
      <path d="M12 24 Q55 14 104 20" stroke="#6E4E37" strokeWidth="1.8" strokeLinecap="round" />
      {/* Lístky jmelí */}
      <path
        d="M36 18 C28 9 20 12 25 20 C28 24 34 21 36 18 Z"
        fill="#4F7A65"
        stroke="#234B3E"
        strokeWidth="1.2"
      />
      <path
        d="M42 18 C46 8 55 10 51 18 C49 22 44 20 42 18 Z"
        fill="#68967E"
        stroke="#234B3E"
        strokeWidth="1.2"
      />
      <path
        d="M68 18 C62 8 54 11 58 19 C60 22 66 20 68 18 Z"
        fill="#4F7A65"
        stroke="#234B3E"
        strokeWidth="1.2"
      />
      <path
        d="M74 19 C80 10 89 12 85 20 C82 24 76 21 74 19 Z"
        fill="#68967E"
        stroke="#234B3E"
        strokeWidth="1.2"
      />
      {/* Bílé bobulky jmelí */}
      <circle cx="39" cy="20" r="2.8" fill="#FFFDF9" stroke="#C89646" strokeWidth="1.1" />
      <circle cx="43" cy="22" r="2.5" fill="#FFFDF9" stroke="#C89646" strokeWidth="1.1" />
      <circle cx="71" cy="20" r="2.8" fill="#FFFDF9" stroke="#C89646" strokeWidth="1.1" />
      <circle cx="67" cy="22.5" r="2.4" fill="#FFFDF9" stroke="#C89646" strokeWidth="1.1" />
    </svg>
  );
}

/**
 * Ilustrace jmelí do levého spodního rohu papírové dárkové jmenovky
 */
export function TagMistletoeCornerSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 96 84" className={className} fill="none" aria-hidden="true">
      {/* Stonky */}
      <path d="M10 74 C24 56 42 42 64 34" stroke="#5A422E" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 62 C26 44 34 30 46 18" stroke="#5A422E" strokeWidth="1.8" strokeLinecap="round" />
      {/* Lístky jmelí */}
      <path
        d="M32 50 C20 42 15 49 23 57 C27 61 31 54 32 50 Z"
        fill="#3E6B56"
        stroke="#234B3E"
        strokeWidth="1.3"
      />
      <path
        d="M44 42 C48 30 58 32 53 42 C50 47 45 45 44 42 Z"
        fill="#588770"
        stroke="#234B3E"
        strokeWidth="1.3"
      />
      <path
        d="M34 33 C24 23 20 30 27 38 C30 41 33 36 34 33 Z"
        fill="#588770"
        stroke="#234B3E"
        strokeWidth="1.3"
      />
      <path
        d="M42 24 C45 13 54 15 50 24 C48 28 43 26 42 24 Z"
        fill="#3E6B56"
        stroke="#234B3E"
        strokeWidth="1.3"
      />
      <path
        d="M54 38 C62 32 69 38 61 44 C57 47 54 41 54 38 Z"
        fill="#3E6B56"
        stroke="#234B3E"
        strokeWidth="1.3"
      />
      {/* Bílé bobulky */}
      <circle cx="36" cy="46" r="3.4" fill="#FFFDF9" stroke="#8C7355" strokeWidth="1.1" />
      <circle cx="41" cy="49" r="3" fill="#FFFDF9" stroke="#8C7355" strokeWidth="1.1" />
      <circle cx="39" cy="42" r="2.8" fill="#FFFDF9" stroke="#8C7355" strokeWidth="1.1" />
      <circle cx="36" cy="29" r="3" fill="#FFFDF9" stroke="#8C7355" strokeWidth="1.1" />
      <circle cx="41" cy="31" r="2.7" fill="#FFFDF9" stroke="#8C7355" strokeWidth="1.1" />
    </svg>
  );
}

/**
 * Červené poštovní razítko Ježíškovy pošty na dárkové jmenovce
 */
export function TagPostalStampSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 120 56" className={className} fill="none" aria-hidden="true">
      {/* Vlnovky poštovního razítka vlevo */}
      <path
        d="M4 18 Q16 14 28 18 T52 18 M4 26 Q16 22 28 26 T52 26 M4 34 Q16 30 28 34 T52 34 M4 42 Q16 38 28 42 T52 42"
        stroke="#A63A3A"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.65"
      />
      {/* Dvojitý kruh razítka vpravo */}
      <circle
        cx="84"
        cy="28"
        r="23"
        stroke="#A63A3A"
        strokeWidth="1.6"
        opacity="0.7"
      />
      <circle
        cx="84"
        cy="28"
        r="19"
        stroke="#A63A3A"
        strokeWidth="1"
        strokeDasharray="2.5 2"
        opacity="0.6"
      />
      <line x1="65" y1="22" x2="103" y2="22" stroke="#A63A3A" strokeWidth="1.1" opacity="0.65" />
      <line x1="65" y1="34" x2="103" y2="34" stroke="#A63A3A" strokeWidth="1.1" opacity="0.65" />
      <text
        x="84"
        y="31"
        textAnchor="middle"
        fill="#A63A3A"
        opacity="0.78"
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
        fill="#A63A3A"
        opacity="0.7"
        fontSize="5.5"
        fontWeight="600"
      >
        24 · XII
      </text>
    </svg>
  );
}

/**
 * 5 jedinečných izometrických ilustrací zabalených vánočních dárků pro Nákupní seznam
 */
export function WrappedPresentSvg({ seed = '', isBought = false, className = '' }) {
  const str = String(seed || 'gift');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  const variant = hash % 5;

  // 0: Krémově zlatá krabice s širokou červenou stuhou a velkou mašlí
  if (variant === 0) {
    return (
      <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
        <ellipse cx="48" cy="84" rx="30" ry="6" fill="rgba(36,40,38,0.12)" />
        {/* Levá a pravá stěna krabice */}
        <path d="M20 42 L48 54 V82 L20 70 Z" fill="#E5C896" stroke="#8C673A" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M76 42 L48 54 V82 L76 70 Z" fill="#D1B07B" stroke="#8C673A" strokeWidth="1.6" strokeLinejoin="round" />
        {/* Víko krabice */}
        <path d="M17 36 L48 24 L79 36 L48 49 Z" fill="#F3DEC0" stroke="#8C673A" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M17 36 L48 49 V55 L17 42 Z" fill="#E9CEA0" stroke="#8C673A" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M79 36 L48 49 V55 L79 42 Z" fill="#D8B884" stroke="#8C673A" strokeWidth="1.6" strokeLinejoin="round" />
        {/* Červená stuha přes stěny */}
        <path d="M31 47 L38 50 V78 L31 75 Z" fill="#B23A3A" stroke="#7A2222" strokeWidth="1.2" />
        <path d="M65 47 L58 50 V78 L65 75 Z" fill="#982D2D" stroke="#7A2222" strokeWidth="1.2" />
        <path d="M32 30 L64 42 L58 45 L26 33 Z" fill="#C44242" />
        <path d="M64 30 L32 42 L38 45 L70 33 Z" fill="#B23A3A" />
        {/* Velká červená mašle nahoře */}
        <path
          d="M48 34 C34 20 22 28 32 37 C37 41 44 37 48 34 Z"
          fill="#C94545"
          stroke="#7A2222"
          strokeWidth="1.5"
        />
        <path
          d="M48 34 C62 20 74 28 64 37 C59 41 52 37 48 34 Z"
          fill="#B23A3A"
          stroke="#7A2222"
          strokeWidth="1.5"
        />
        <path d="M46 35 L37 48 L43 47 L48 37" fill="#B23A3A" stroke="#7A2222" strokeWidth="1.1" />
        <path d="M50 35 L59 48 L53 47 L48 37" fill="#982D2D" stroke="#7A2222" strokeWidth="1.1" />
        <circle cx="48" cy="34" r="3.8" fill="#8F2828" stroke="#6B1B1B" strokeWidth="1.2" />
        {isBought && <circle cx="76" cy="20" r="4" fill="#D4A359" opacity="0.85" />}
      </svg>
    );
  }

  // 1: Červený balíček s bílými hvězdičkami a bohatou zlatou mašlí
  if (variant === 1) {
    return (
      <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
        <ellipse cx="48" cy="84" rx="30" ry="6" fill="rgba(36,40,38,0.12)" />
        {/* Stěny */}
        <path d="M19 40 L48 52 V81 L19 69 Z" fill="#BD3E3E" stroke="#7A2222" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M77 40 L48 52 V81 L77 69 Z" fill="#9E3030" stroke="#7A2222" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M19 40 L48 28 L77 40 L48 52 Z" fill="#D14E4E" stroke="#7A2222" strokeWidth="1.6" strokeLinejoin="round" />
        {/* Bílé hvězdičky na papíru */}
        <circle cx="27" cy="54" r="1.8" fill="#FFFDF9" opacity="0.85" />
        <circle cx="41" cy="68" r="1.8" fill="#FFFDF9" opacity="0.85" />
        <circle cx="26" cy="65" r="1.5" fill="#FFFDF9" opacity="0.75" />
        <circle cx="67" cy="54" r="1.8" fill="#FFFDF9" opacity="0.8" />
        <circle cx="56" cy="70" r="1.6" fill="#FFFDF9" opacity="0.8" />
        <circle cx="69" cy="65" r="1.5" fill="#FFFDF9" opacity="0.75" />
        {/* Zlatá stuha */}
        <path d="M31 45 L36 47 V76 L31 74 Z" fill="#E6BE73" stroke="#9A6F26" strokeWidth="1.2" />
        <path d="M65 45 L60 47 V76 L65 74 Z" fill="#D4A359" stroke="#9A6F26" strokeWidth="1.2" />
        <path d="M33 34 L63 46 L59 48 L29 36 Z" fill="#F0CF8E" />
        <path d="M63 34 L33 46 L37 48 L67 36 Z" fill="#E6BE73" />
        {/* Zlatá mašle */}
        <path
          d="M48 38 C35 25 24 32 33 40 C38 44 44 40 48 38 Z"
          fill="#F2D291"
          stroke="#9A6F26"
          strokeWidth="1.5"
        />
        <path
          d="M48 38 C61 25 72 32 63 40 C58 44 52 40 48 38 Z"
          fill="#E2B86B"
          stroke="#9A6F26"
          strokeWidth="1.5"
        />
        <circle cx="48" cy="38" r="3.5" fill="#C89646" stroke="#8C621E" strokeWidth="1.2" />
      </svg>
    );
  }

  // 2: Jedlově zelený balíček převázaný přírodním provázkem
  if (variant === 2) {
    return (
      <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
        <ellipse cx="48" cy="83" rx="30" ry="6" fill="rgba(36,40,38,0.12)" />
        {/* Zelený balicí papír */}
        <path d="M18 43 L48 55 V80 L18 68 Z" fill="#2E5E4E" stroke="#19382E" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M78 43 L48 55 V80 L78 68 Z" fill="#234B3E" stroke="#19382E" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M18 43 L48 30 L78 43 L48 55 Z" fill="#3D7562" stroke="#19382E" strokeWidth="1.6" strokeLinejoin="round" />
        {/* Sklady balicího papíru na boku */}
        <path d="M18 43 L30 58 L18 68" stroke="#19382E" strokeWidth="1.1" opacity="0.55" />
        <path d="M78 43 L64 59 L78 68" stroke="#142E26" strokeWidth="1.1" opacity="0.55" />
        {/* Přírodní jutový provázek */}
        <path d="M33 36.5 L63 49 V74" stroke="#D8BE98" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M63 36.5 L33 49 V74" stroke="#D8BE98" strokeWidth="2.2" strokeLinecap="round" />
        {/* Provázková mašlička */}
        <path
          d="M48 42 C38 32 30 38 39 44 C42 46 46 44 48 42 Z"
          stroke="#E5CFAF"
          strokeWidth="2.2"
          fill="none"
        />
        <path
          d="M48 42 C58 32 66 38 57 44 C54 46 50 44 48 42 Z"
          stroke="#E5CFAF"
          strokeWidth="2.2"
          fill="none"
        />
        <path d="M48 43 L42 52 M48 43 L55 51" stroke="#D8BE98" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="48" cy="42.5" r="2.4" fill="#C8A97E" />
      </svg>
    );
  }

  // 3: Přírodní kraftový balíček se sněhovými vločkami a červeno-bílým provázkem
  if (variant === 3) {
    return (
      <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
        <ellipse cx="48" cy="83" rx="29" ry="6" fill="rgba(36,40,38,0.12)" />
        <path d="M20 42 L48 54 V80 L20 68 Z" fill="#D5BC9E" stroke="#7D6043" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M76 42 L48 54 V80 L76 68 Z" fill="#C2A687" stroke="#7D6043" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M20 42 L48 30 L76 42 L48 54 Z" fill="#E3CCB0" stroke="#7D6043" strokeWidth="1.6" strokeLinejoin="round" />
        {/* Bílé tečky/vločky */}
        <circle cx="28" cy="56" r="1.7" fill="#FFFDF9" opacity="0.85" />
        <circle cx="40" cy="67" r="1.7" fill="#FFFDF9" opacity="0.85" />
        <circle cx="62" cy="59" r="1.7" fill="#FFFDF9" opacity="0.85" />
        <circle cx="68" cy="68" r="1.5" fill="#FFFDF9" opacity="0.85" />
        {/* Červený provázek */}
        <path d="M34 36 L62 48 V74" stroke="#B23A3A" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M62 36 L34 48 V74" stroke="#B23A3A" strokeWidth="2.4" strokeLinecap="round" />
        {/* Větvička jehličí zasunutá pod provázkem */}
        <path d="M44 41 L35 35 M44 41 L38 33" stroke="#234B3E" strokeWidth="2.2" strokeLinecap="round" />
        {/* Červená mašlička */}
        <path
          d="M48 42 C39 33 32 39 40 45 C43 47 46 44 48 42 Z"
          fill="#C94545"
          stroke="#7A2222"
          strokeWidth="1.4"
        />
        <path
          d="M48 42 C57 33 64 39 56 45 C53 47 50 44 48 42 Z"
          fill="#B23A3A"
          stroke="#7A2222"
          strokeWidth="1.4"
        />
        <circle cx="48" cy="42" r="2.8" fill="#8F2828" />
      </svg>
    );
  }

  // 4: Krémový sváteční balíček se smaragdově zelenou stuhou a mašlí
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
      <ellipse cx="48" cy="84" rx="29" ry="6" fill="rgba(36,40,38,0.12)" />
      <path d="M20 41 L48 53 V81 L20 69 Z" fill="#F2E8D5" stroke="#9C8869" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M76 41 L48 53 V81 L76 69 Z" fill="#E2D4BC" stroke="#9C8869" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20 41 L48 29 L76 41 L48 53 Z" fill="#FAF3E6" stroke="#9C8869" strokeWidth="1.6" strokeLinejoin="round" />
      {/* Smaragdová stuha */}
      <path d="M31 46 L37 48.5 V76.5 L31 74 Z" fill="#2D5A4C" stroke="#19382E" strokeWidth="1.2" />
      <path d="M65 46 L59 48.5 V76.5 L65 74 Z" fill="#234B3E" stroke="#19382E" strokeWidth="1.2" />
      <path d="M33 35 L63 47 L58 49 L28 37 Z" fill="#3B6E5C" />
      <path d="M63 35 L33 47 L38 49 L68 37 Z" fill="#2D5A4C" />
      {/* Smaragdová mašle se zlatým středem */}
      <path
        d="M48 39 C35 26 24 33 33 41 C38 45 44 41 48 39 Z"
        fill="#3B6E5C"
        stroke="#19382E"
        strokeWidth="1.5"
      />
      <path
        d="M48 39 C61 26 72 33 63 41 C58 45 52 41 48 39 Z"
        fill="#2D5A4C"
        stroke="#19382E"
        strokeWidth="1.5"
      />
      <circle cx="48" cy="39" r="3.6" fill="#D4A359" stroke="#8C621E" strokeWidth="1.2" />
    </svg>
  );
}

export function FairytaleOrnamentSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 220 36" className={className} fill="none" aria-hidden="true">
      <line x1="10" y1="18" x2="86" y2="18" stroke="#D4A359" strokeWidth="1.4" />
      <line x1="134" y1="18" x2="210" y2="18" stroke="#D4A359" strokeWidth="1.4" />
      <circle cx="94" cy="18" r="2.2" fill="#B84A4A" />
      <circle cx="126" cy="18" r="2.2" fill="#B84A4A" />
      <path
        d="M110 5 L113.5 13.5 L122 14.5 L115.5 20.5 L117.2 29 L110 24.5 L102.8 29 L104.5 20.5 L98 14.5 L106.5 13.5 Z"
        fill="#D4A359"
        stroke="#9E6E24"
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
