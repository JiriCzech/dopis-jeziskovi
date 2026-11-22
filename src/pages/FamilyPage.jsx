import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Gift,
  MailOpen,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Avatar,
  CompactMistletoeSvg,
  getChildAvatar,
  PaperClipSvg,
  TagMistletoeCornerSvg,
  TagPostalStampSvg,
  WaxSealSvg,
} from '../assets/avatars';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../hooks/useAppData';
import { renderGroupIcon } from '../pages/SharingPage';

function formatWishCount(count) {
  if (count === 0) return 'všechna přání splněna';
  if (count === 1) return '1 přání';
  if (count >= 2 && count <= 4) return `${count} přání`;
  return `${count} přání`;
}

/**
 * Přírodní kraftová dárková jmenovka (#EFE5D1) s 3D poštovní známkou člověka, jménem a počtem přání
 */
const KraftGiftTagCard = memo(function KraftGiftTagCard({
  card,
  showGroupFilters,
  onSelect,
}) {
  const wishCount = (card.availableWishes || []).length;
  const childVisual = card.isChildLetter ? getChildAvatar(card.recipientName) : null;
  const avatarId = childVisual ? childVisual.avatarId : card.ownerProfile?.avatarId || 'carp';
  const avatarBg = childVisual ? childVisual.avatarBg : card.ownerProfile?.avatarBg || '#F5E6D3';

  return (
    <button
      type="button"
      onClick={() => onSelect(card.cardId)}
      className="kraft-gift-tag-wrapper group relative text-center focus:outline-none pt-3 min-w-0"
    >
      {/* Jutový provázek vedoucí z otvoru nahoru mimo jmenovku */}
      <svg
        viewBox="0 0 40 36"
        className="w-10 h-9 absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M20 26 C18 16 22 7 25 1"
          stroke="#1B4332"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M21 26 C23 17 17 8 15 2"
          stroke="#C9963B"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>

      {/* Tělo přírodní kraftové jmenovky (#EFE5D1) s tmavě zeleným okrajem a zlatou vnitřní linkou */}
      <div className="kraft-gift-tag relative min-h-[284px] px-5 sm:px-6 pt-12 pb-6 flex flex-col items-center justify-between">
        {/* Dírka s kroužkem nahoře */}
        <div
          className="w-7 h-7 rounded-full bg-paper border-[3px] border-fir shadow-inner absolute top-3.5 left-1/2 -translate-x-1/2 z-10"
          aria-hidden="true"
        />

        {/* Vnitřní zlatá linka jmenovky */}
        <div
          className="pointer-events-none absolute inset-2.5 border border-gold/55 rounded-2xl"
          aria-hidden="true"
        />

        <TagPostalStampSvg className="w-24 h-12 absolute top-7 right-3 pointer-events-none" />
        <TagMistletoeCornerSvg className="w-24 h-20 absolute bottom-2 left-2 pointer-events-none" />

        {/* 3D Poštovní známka člověka + Jméno + Počet přání */}
        <div className="relative z-10 my-auto py-3 flex flex-col items-center space-y-2.5 max-w-full">
          <Avatar avatarId={avatarId} avatarBg={avatarBg} size="md" />

          <div className="space-y-1">
            <h2 className="font-fairytale font-bold text-3xl sm:text-[34px] text-slate-text leading-tight tracking-tight break-words">
              {card.recipientName}
            </h2>
            <p className="text-sm font-bold text-fir break-words">
              {card.isChildLetter && card.parentName
                ? `(píše ${card.parentName}) – ${formatWishCount(wishCount)}`
                : formatWishCount(wishCount)}
            </p>
            {showGroupFilters &&
              card.groupNames &&
              card.groupNames.length > 0 && (
                <p className="text-xs font-medium text-slate-text-muted break-words">
                  {card.groupNames.join(', ')}
                </p>
              )}
          </div>
        </div>

        <div className="relative z-10 pt-1">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sheet border border-fir/45 text-xs font-bold text-fir group-hover:bg-fir group-hover:text-white group-hover:border-fir transition-colors">
            <MailOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Rozpečetit obálku</span>
          </span>
        </div>
      </div>
    </button>
  );
});

export function FamilyPage() {
  const { notify, showUndoToast } = useAuth();
  const {
    familyCards,
    groups,
    pendingRequestsCount,
    optimisticClaimWish,
    optimisticUnclaimWish,
  } = useAppData();

  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [activeCardId, setActiveCardId] = useState(null);
  const [unsealedCardIds, setUnsealedCardIds] = useState({});
  const [breakingSealCardId, setBreakingSealCardId] = useState(null);
  const [exitingWishId, setExitingWishId] = useState(null);

  useEffect(() => {
    if (
      selectedGroupFilter !== 'all' &&
      !groups.some((g) => g.id === selectedGroupFilter)
    ) {
      setSelectedGroupFilter('all');
    }
  }, [groups, selectedGroupFilter]);

  const activeCard = useMemo(
    () => familyCards.find((c) => c.cardId === activeCardId) || null,
    [familyCards, activeCardId]
  );

  const showGroupFilters = groups.length >= 2;

  const visibleCards = useMemo(() => {
    if (!showGroupFilters || selectedGroupFilter === 'all') {
      return familyCards;
    }
    return familyCards.filter((c) => (c.groupIds || []).includes(selectedGroupFilter));
  }, [familyCards, showGroupFilters, selectedGroupFilter]);

  const handleSelectCard = useCallback((cardId) => {
    setActiveCardId(cardId);
  }, []);

  const handleBreakEnvelopeSeal = (cardId) => {
    if (breakingSealCardId) return;
    setBreakingSealCardId(cardId);
    setTimeout(() => {
      setUnsealedCardIds((prev) => ({ ...prev, [cardId]: true }));
      setBreakingSealCardId(null);
    }, 460);
  };

  const handleClaimWish = async (card, wish) => {
    if (!card?.letter) return;
    setExitingWishId(wish.id);

    setTimeout(async () => {
      setExitingWishId(null);
      try {
        const claimId = `${card.letter.id}_${wish.id}`;
        await optimisticClaimWish(card.letter, wish);

        showUndoToast({
          message: 'Přidáno do tvého nákupního seznamu',
          onUndo: async () => {
            try {
              await optimisticUnclaimWish(claimId);
              notify('Dárek byl vrácen zpět do dopisu.');
            } catch (undoErr) {
              notify(undoErr.message || 'Nepodařilo se vrátit dárek zpět.', 'error');
            }
          },
        });
      } catch (err) {
        notify(err.message || 'Přání se nepodařilo zamluvit.', 'error');
      }
    }, 180);
  };

  if (activeCard) {
    const letter = activeCard.letter;
    const wishes = activeCard.availableWishes || [];
    const childVisual = activeCard.isChildLetter
      ? getChildAvatar(activeCard.recipientName)
      : null;
    const avatarId = childVisual ? childVisual.avatarId : activeCard.ownerProfile.avatarId;
    const avatarBg = childVisual ? childVisual.avatarBg : activeCard.ownerProfile.avatarBg;
    const isUnsealed = Boolean(unsealedCardIds[activeCard.cardId]);
    const isBreaking = breakingSealCardId === activeCard.cardId;

    return (
      <div className="max-w-[780px] mx-auto space-y-6 animate-page-transition min-w-0">
        <div>
          <button
            type="button"
            onClick={() => setActiveCardId(null)}
            className="min-h-[48px] inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sheet border-[1.5px] border-fir hover:bg-fir-soft text-base font-bold text-slate-text shadow-card transition"
          >
            <ArrowLeft className="w-5 h-5 text-fir shrink-0" />
            <span>Zpět na jmenovky</span>
          </button>
        </div>

        {/* Zavřená kraftová obálka s voskovou pečetí a známkou v rohu — kliknutím se pečeť rozlomí */}
        {!isUnsealed ? (
          <div className="py-4">
            <button
              type="button"
              onClick={() => handleBreakEnvelopeSeal(activeCard.cardId)}
              className="kraft-envelope w-full rounded-[30px] p-6 sm:p-10 text-left relative overflow-hidden group transition-transform hover:-translate-y-1 focus:outline-none"
            >
              <div
                className="pointer-events-none absolute inset-3 rounded-2xl border border-gold/55"
                aria-hidden="true"
              />

              {/* Horní klopa obálky (SVG trojúhelníkový lem) */}
              <svg
                viewBox="0 0 400 130"
                preserveAspectRatio="none"
                className={`w-full h-32 sm:h-40 absolute top-0 inset-x-0 pointer-events-none transition-transform duration-500 origin-top ${
                  isBreaking ? 'scale-y-0 opacity-40' : ''
                }`}
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M0 0 L200 122 L400 0 Z"
                  fill="#E5D7BC"
                  stroke="#1B4332"
                  strokeWidth="3"
                />
                <path
                  d="M14 4 L200 114 L386 4"
                  stroke="#C9963B"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              </svg>

              {/* Horní řádek: Odesílatel + 3D poštovní známka v pravém horním rohu */}
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="bg-sheet/85 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-fir/30">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-fir">
                    Vánoční dopis od
                  </div>
                  <div className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text">
                    {activeCard.recipientName}
                  </div>
                  {activeCard.isChildLetter && activeCard.parentName && (
                    <div className="text-xs font-semibold text-slate-text-muted">
                      píše {activeCard.parentName}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-sheet/80 p-1.5 rounded-2xl border border-fir/25">
                  <TagPostalStampSvg className="w-20 h-10 hidden sm:block" />
                  <Avatar avatarId={avatarId} avatarBg={avatarBg} size="lg" />
                </div>
              </div>

              {/* Střed obálky: Červená vosková pečeť (kliknutím se rozlomí) */}
              <div className="relative z-20 my-8 flex flex-col items-center justify-center">
                <div
                  className={`transition-all duration-400 ${
                    isBreaking
                      ? 'scale-125 opacity-0 rotate-12'
                      : 'group-hover:scale-110'
                  }`}
                >
                  <WaxSealSvg className="w-24 h-24 sm:w-28 sm:h-28 mx-auto" />
                </div>
                <span className="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-crimson text-white text-sm sm:text-base font-bold shadow-md border border-gold/50 group-hover:bg-crimson-dark transition">
                  <MailOpen className="w-4 h-4 shrink-0" />
                  <span>
                    {isBreaking
                      ? 'Otevírám pečeť a vysouvám dopis...'
                      : 'Klikni na pečeť pro otevření dopisu'}
                  </span>
                </span>
              </div>

              {/* Spodní řádek obálky */}
              <div className="relative z-10 flex items-end justify-between gap-4 pt-2">
                <div className="text-sm font-bold text-fir">
                  {formatWishCount(wishes.length)} uvnitř obálky
                </div>
                <div className="font-handwritten font-bold text-2xl sm:text-3xl text-fir">
                  Ježíškova pošta · 24. XII.
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-letter-slide-out">
            {/* Vysunutý dopisní arch (#FFFDF8) */}
            <article className="stationery-sheet rounded-[28px] p-6 sm:p-11 relative overflow-hidden">
              <div className="stationery-inner-frame" aria-hidden="true" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-4 pb-6 border-b border-gold/40">
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar avatarId={avatarId} avatarBg={avatarBg} size="lg" />
                    <div className="min-w-0">
                      <h1 className="font-fairytale font-bold text-[32px] sm:text-[38px] leading-tight text-slate-text break-words">
                        {activeCard.recipientName}
                      </h1>
                      {activeCard.isChildLetter && activeCard.parentName && (
                        <p className="text-sm font-semibold text-fir mt-0.5">
                          píše {activeCard.parentName}
                        </p>
                      )}
                    </div>
                  </div>
                  <CompactMistletoeSvg className="w-28 h-9 hidden sm:block shrink-0" />
                </div>

                {/* Připnutá fotka ručně psaného papírového dopisu, pokud ji autor nahrál */}
                {letter?.handwrittenPhotoUrl && (
                  <div className="mt-6 mb-4 relative pt-3">
                    <PaperClipSvg className="w-8 h-14 absolute -top-2 left-6 z-20 pointer-events-none" />
                    <div className="rounded-2xl bg-kraft/80 border-[1.5px] border-fir p-4 shadow-sm">
                      <div className="font-fairytale font-bold text-lg text-fir mb-2 pl-6">
                        Přiložená fotka ručně psaného dopisu
                      </div>
                      <img
                        src={letter.handwrittenPhotoUrl}
                        alt={`Ručně psaný dopis — ${activeCard.recipientName}`}
                        className="max-h-[380px] w-full object-contain rounded-xl bg-sheet border border-fir/25 mx-auto"
                      />
                    </div>
                  </div>
                )}

                {!letter ? (
                  <p className="py-8 text-lg text-slate-text-muted text-center">
                    {activeCard.recipientName} zatím svůj dopis Ježíškovi teprve chystá.
                  </p>
                ) : (
                  <div className="mt-6 lined-letter-paper rounded-2xl px-4 py-4 space-y-5">
                    <div className="font-handwritten text-3xl sm:text-4xl font-bold text-fir w-full">
                      Milý Ježíšku,
                    </div>

                    {letter.introText && (
                      <p className="font-handwritten text-2xl sm:text-[28px] text-slate-text whitespace-pre-line leading-[38px] break-words">
                        {letter.introText}
                      </p>
                    )}

                    <div className="pt-5 border-t border-gold/35 flex items-end justify-between gap-4">
                      <p className="font-handwritten text-2xl sm:text-[28px] text-slate-text whitespace-pre-line leading-relaxed break-words">
                        {letter.outroText || activeCard.recipientName}
                      </p>
                      <WaxSealSvg className="w-16 h-16 sm:w-18 sm:h-18 shrink-0" />
                    </div>
                  </div>
                )}
              </div>
            </article>

            {/* Seznam přání k tajné rezervaci */}
            <section className="space-y-4">
              <h2 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text">
                Přání v dopise ({wishes.length})
              </h2>

              {wishes.length === 0 ? (
                <div className="stationery-sheet rounded-3xl p-8 text-center space-y-2">
                  <div className="w-11 h-11 rounded-2xl bg-gold-soft text-fir border border-gold/50 flex items-center justify-center mx-auto">
                    <Gift className="w-5 h-5" />
                  </div>
                  <p className="font-fairytale font-bold text-2xl text-slate-text">
                    Všechna přání z tohoto dopisu už mají svého tajného Ježíška
                  </p>
                  <p className="text-base text-slate-text-muted max-w-md mx-auto">
                    Pokud chceš přesto udělat radost něčím navíc, můžeš si připsat vlastní tajný
                    nápad ve svém nákupním seznamu.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wishes.map((wish) => {
                    const isExiting = exitingWishId === wish.id;
                    return (
                      <div
                        key={wish.id}
                        className={`gift-tag-card rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isExiting ? 'animate-wish-claim-exit' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full border-2 border-gold bg-sheet shadow-inner shrink-0 mt-2"
                            aria-hidden="true"
                          />
                          <div className="space-y-1 min-w-0 flex-1">
                            <h3 className="font-handwritten text-2xl sm:text-3xl font-bold text-slate-text leading-snug break-words">
                              {wish.title}
                            </h3>
                            {wish.note && (
                              <p className="text-base italic text-slate-text-muted leading-relaxed break-words">
                                {wish.note}
                              </p>
                            )}
                            {wish.url && (
                              <div className="pt-1">
                                <a
                                  href={wish.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gold-soft border border-gold/45 text-slate-text text-sm font-bold hover:bg-gold/30 transition"
                                >
                                  <span>Ukázka dárku</span>
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isExiting}
                          onClick={() => handleClaimWish(activeCard, wish)}
                          className="min-h-[50px] shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-fir hover:bg-fir-hover text-white text-base font-bold shadow-sm border border-gold/45 transition disabled:opacity-60"
                        >
                          <Gift className="w-5 h-5 text-gold-glow shrink-0" />
                          <span>Tohle koupím já</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page-transition min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-fairytale font-bold text-[32px] sm:text-[38px] leading-tight text-slate-text">
            Komu koupit dárek
          </h1>
          <p className="text-base text-slate-text-muted mt-0.5">
            Klikni na dárkovou jmenovku, rozlom pečeť na obálce a tajně si zamluv přání.
          </p>
        </div>

        <Link
          to="/sdileni"
          className="min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-sheet border-[1.5px] border-fir hover:bg-fir-soft text-base font-bold text-slate-text shadow-card transition shrink-0"
        >
          <UserPlus className="w-5 h-5 text-fir shrink-0" />
          <span>Pozvat blízké a skupiny</span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-crimson text-white">
              {pendingRequestsCount}
            </span>
          )}
        </Link>
      </div>

      {showGroupFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedGroupFilter('all')}
            className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-base font-bold border-[1.5px] transition ${
              selectedGroupFilter === 'all'
                ? 'bg-fir text-white border-fir shadow-xs'
                : 'bg-sheet text-slate-text border-fir/35 hover:bg-fir-soft'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Všichni</span>
          </button>

          {groups.map((grp) => {
            const active = selectedGroupFilter === grp.id;
            return (
              <button
                key={grp.id}
                type="button"
                onClick={() => setSelectedGroupFilter(grp.id)}
                className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-base font-bold border-[1.5px] transition ${
                  active
                    ? 'bg-fir text-white border-fir shadow-xs'
                    : 'bg-sheet text-slate-text border-fir/35 hover:bg-fir-soft'
                }`}
              >
                {renderGroupIcon(grp.icon, 'w-4 h-4 shrink-0')}
                <span>{grp.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {visibleCards.length === 0 ? (
        <div className="stationery-sheet rounded-3xl p-10 sm:p-12 text-center space-y-4 max-w-xl mx-auto relative overflow-hidden">
          <div className="stationery-inner-frame" aria-hidden="true" />
          <div className="relative z-10 space-y-3">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-[1.5px] border-fir shadow-sm bg-[#E8DEC8] mx-auto">
              <img
                src="/assets/kaprik.png"
                alt="Kapřík"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text">
              {familyCards.length === 0
                ? 'Zatím tu je klid jako před Štědrým večerem'
                : 'V této skupině zatím nejsou žádné dopisy'}
            </h2>
            <p className="text-base text-slate-text-muted leading-relaxed">
              {familyCards.length === 0
                ? 'Pozvi rodinu nebo přátele přes zvací odkaz, abyste si mohli rozpečetit obálky a tajně vybírat dárky.'
                : 'Přidej do skupiny své blízké nebo jim pošli zvací odkaz.'}
            </p>
            <div className="pt-2">
              <Link
                to="/sdileni"
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-fir hover:bg-fir-hover text-white text-base font-bold shadow-sm transition"
              >
                <UserPlus className="w-5 h-5 shrink-0" />
                <span>Pozvat blízké a spravovat skupiny</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-9 pt-4">
          {visibleCards.map((card) => (
            <KraftGiftTagCard
              key={card.cardId}
              card={card}
              showGroupFilters={showGroupFilters}
              onSelect={handleSelectCard}
            />
          ))}
        </div>
      )}
    </div>
  );
}
