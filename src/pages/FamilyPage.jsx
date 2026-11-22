import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Gift,
  MailOpen,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Avatar,
  getChildAvatar,
  PaperClipSvg,
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
 * Svislá 3D dárková visačka s poštovní známkou člověka, jménem a počtem přání
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
      className="group relative text-center focus:outline-none min-w-0 w-full"
    >
      <img
        src="/assets/visacka-karta-3d.png"
        alt=""
        draggable={false}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none drop-shadow-[0_12px_24px_rgba(27,67,50,0.16)] group-hover:drop-shadow-[0_18px_32px_rgba(27,67,50,0.24)] transition-shadow duration-200"
      />

      <div className="relative z-10 min-h-[340px] sm:min-h-[360px] px-7 pt-24 pb-8 flex flex-col items-center justify-between">
        {/* 3D Poštovní známka člověka + Jméno + Počet přání */}
        <div className="my-auto py-2 flex flex-col items-center space-y-2.5 max-w-full">
          <Avatar avatarId={avatarId} avatarBg={avatarBg} size="lg" onTag />

          <div className="space-y-1">
            <h2 className="font-fairytale font-bold text-3xl sm:text-[34px] text-slate-text leading-tight tracking-tight break-words">
              {card.recipientName}
            </h2>
            <p className="text-sm font-bold text-fir break-words">
              {formatWishCount(wishCount)}
            </p>
            {card.isChildLetter && card.parentName && (
              <p className="text-xs font-semibold text-slate-text-muted break-words">
                píše {card.parentName}
              </p>
            )}
            {showGroupFilters &&
              card.groupNames &&
              card.groupNames.length > 0 && (
                <p className="text-xs font-medium text-slate-text-muted break-words">
                  {card.groupNames.join(', ')}
                </p>
              )}
          </div>
        </div>

        <div className="pt-2">
          <span className="inline-flex items-center gap-1 text-sm font-bold text-fir group-hover:text-fir-dark group-hover:translate-x-0.5 transition-all tracking-wide">
            Rozpečetit dopis →
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
    return () => {
      window.dispatchEvent(
        new CustomEvent('kaprik:family-state', { detail: { view: 'overview' } })
      );
    };
  }, []);

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

  useEffect(() => {
    const view = !activeCard
      ? 'overview'
      : unsealedCardIds[activeCard.cardId]
        ? 'detail'
        : 'envelope';
    window.dispatchEvent(new CustomEvent('kaprik:family-state', { detail: { view } }));
  }, [activeCard, unsealedCardIds]);

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

        {/* Zavřená 3D poštovní obálka s voskovou pečetí a známkou v pravém horním rohu */}
        {!isUnsealed ? (
          <div className="py-4">
            <button
              type="button"
              onClick={() => handleBreakEnvelopeSeal(activeCard.cardId)}
              className="w-full p-7 sm:p-11 text-left relative group focus:outline-none min-h-[340px] sm:min-h-[390px] flex flex-col justify-between"
            >
              <img
                src="/assets/obalka-3d.png"
                alt=""
                draggable={false}
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none drop-shadow-[0_18px_36px_rgba(27,67,50,0.22)]"
              />

              {/* Horní řádek: Odesílatel + 3D poštovní známka v pravém horním rohu */}
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="pt-4 sm:pt-6 pl-1 sm:pl-3">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-fir/85">
                    Dopis od
                  </div>
                  <div className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text leading-tight">
                    {activeCard.recipientName}
                  </div>
                  {activeCard.isChildLetter && activeCard.parentName && (
                    <div className="text-xs font-semibold text-slate-text-muted mt-0.5">
                      píše {activeCard.parentName}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <Avatar avatarId={avatarId} avatarBg={avatarBg} size="lg" onTag />
                </div>
              </div>

              {/* Střed obálky na klopě: 3D červená vosková pečeť */}
              <div className="relative z-20 my-6 flex flex-col items-center justify-center">
                <div
                  className={`transition-opacity duration-300 ${
                    isBreaking ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <WaxSealSvg className="w-24 h-24 sm:w-28 sm:h-28 mx-auto" />
                </div>
                <span className="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-crimson text-white text-sm sm:text-base font-bold shadow-md border border-gold/50 group-hover:bg-crimson-dark transition-colors">
                  <MailOpen className="w-4 h-4 shrink-0" />
                  <span>
                    {isBreaking ? 'Otevírám...' : 'Otevřít dopis'}
                  </span>
                </span>
              </div>

              {/* Spodní řádek obálky */}
              <div className="relative z-10 flex items-end justify-between gap-4 pt-2 px-1 sm:px-2">
                <div className="text-sm font-bold text-fir">
                  {formatWishCount(wishes.length)}
                </div>
                <div className="font-handwritten font-bold text-xl sm:text-2xl text-fir">
                  DOPIS JEŽÍŠKOVI • 24. 12.
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="animate-letter-slide-out">
            {/* Hmatatelný blok ručních dopisních papírů stejně jako při psaní dopisu */}
            <div className="relative my-2">
              <div
                aria-hidden="true"
                style={{ filter: 'url(#handmade-paper-edge)' }}
                className="print:hidden no-print absolute inset-0 -rotate-[0.7deg] translate-y-2 -translate-x-1 rounded-[18px] handmade-letter-paper opacity-90 pointer-events-none"
              />
              <div
                aria-hidden="true"
                style={{ filter: 'url(#handmade-paper-edge)' }}
                className="print:hidden no-print absolute inset-0 rotate-[0.5deg] translate-y-3 translate-x-1 rounded-[18px] handmade-letter-paper opacity-85 pointer-events-none"
              />

              <article className="relative p-6 sm:p-12 md:px-14 md:py-12">
                <div
                  aria-hidden="true"
                  style={{ filter: 'url(#handmade-paper-edge)' }}
                  className="print:hidden no-print absolute inset-0 rounded-[20px] handmade-letter-paper pointer-events-none"
                />

                <img
                  src="/assets/vetvicka-3d.png"
                  alt=""
                  draggable={false}
                  aria-hidden="true"
                  className="w-28 sm:w-36 h-auto absolute top-2 right-3 sm:top-3 sm:right-5 pointer-events-none select-none z-20 drop-shadow-[0_6px_12px_rgba(27,67,50,0.18)]"
                />

                <div className="relative z-10">
                  {/* Hlavička autora dopisu se známkou */}
                  <div className="flex items-center gap-4 pb-5 border-b border-[#8B7355]/25 pr-24 sm:pr-32">
                    <Avatar avatarId={avatarId} avatarBg={avatarBg} size="lg" onTag />
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

                  {/* Připnutá papírová fotografie ručně psaného dopisu se 3D mosaznou sponkou */}
                  {letter?.handwrittenPhotoUrl && (
                    <div className="mt-7 mb-7 relative pt-5 max-w-md mx-auto">
                      <PaperClipSvg className="w-9 h-14 sm:w-10 sm:h-16 absolute -top-2 left-8 z-30 pointer-events-none" />
                      <div className="-rotate-1 bg-[#FFFDF8] p-3 pb-4 rounded-xl shadow-[0_10px_24px_rgba(30,36,33,0.16)] border border-[#E2D6BE]">
                        <img
                          src={letter.handwrittenPhotoUrl}
                          alt={`Ručně psaný dopis (${activeCard.recipientName})`}
                          className="max-h-[360px] w-full object-contain rounded-lg bg-paper mx-auto"
                        />
                      </div>
                    </div>
                  )}

                  {!letter ? (
                    <p className="py-8 text-lg text-slate-text-muted text-center">
                      {activeCard.recipientName} zatím svůj dopis Ježíškovi teprve chystá.
                    </p>
                  ) : (
                    <div className="mt-6 space-y-6">
                      {/* 1. Úvodní vzkaz */}
                      <div className="space-y-3">
                        <div className="font-handwritten text-4xl sm:text-5xl font-bold text-fir leading-none">
                          Milý Ježíšku,
                        </div>

                        {letter.introText && (
                          <p className="lined-letter-paper font-handwritten text-[24px] sm:text-[26px] text-[#1E2421] whitespace-pre-line leading-[36px] break-words">
                            {letter.introText}
                          </p>
                        )}
                      </div>

                      {/* 2. Seznam přání přímo UVNITŘ dopisního papíru */}
                      <div className="space-y-2 pt-1">
                        <div className="font-handwritten font-bold text-2xl sm:text-3xl text-crimson">
                          Moje přání pod stromeček:
                        </div>

                        {wishes.length === 0 ? (
                          <p className="font-handwritten text-2xl text-slate-text-muted py-2">
                            Všechna přání jsou již tajně zamluvená ♥
                          </p>
                        ) : (
                          <ul className="space-y-0.5">
                            {wishes.map((wish, idx) => {
                              const isExiting = exitingWishId === wish.id;
                              return (
                                <li
                                  key={wish.id}
                                  className={`letter-wish-line py-2.5 px-1.5 sm:px-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 ${
                                    isExiting ? 'animate-wish-claim-exit' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                    <img
                                      src={`/assets/darek-${(idx % 3) + 1}-3d.png`}
                                      alt=""
                                      draggable={false}
                                      aria-hidden="true"
                                      className="w-7 h-7 object-contain shrink-0 translate-y-1 drop-shadow-[0_2px_4px_rgba(30,36,33,0.18)] select-none"
                                    />
                                    <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                      <span className="font-handwritten font-bold text-[#1E2421] text-[25px] sm:text-[28px] leading-snug break-words">
                                        {wish.title}
                                      </span>
                                      {wish.note && (
                                        <span className="font-handwritten italic text-xl sm:text-2xl text-slate-text-muted break-words">
                                          ({wish.note})
                                        </span>
                                      )}
                                      {wish.url && (
                                        <a
                                          href={wish.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title="Otevřít ukázku dárku"
                                          className="inline-flex items-center gap-0.5 text-xs sm:text-sm font-sans font-semibold text-fir/85 hover:text-fir underline underline-offset-2 transition"
                                        >
                                          <span>Ukázka ↗</span>
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={isExiting}
                                    onClick={() => handleClaimWish(activeCard, wish)}
                                    className="min-h-[42px] w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-fir hover:bg-fir-hover text-white text-sm font-bold shadow-xs border border-gold/40 transition disabled:opacity-60"
                                  >
                                    <Gift className="w-4 h-4 text-gold-glow shrink-0" />
                                    <span>Tohle koupím</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      {/* 3. Podpis / rozloučení a 3D vosková pečeť */}
                      <div className="pt-4 flex items-end justify-between gap-4">
                        <p className="lined-letter-paper flex-1 min-w-0 font-handwritten text-[24px] sm:text-[26px] text-[#1E2421] whitespace-pre-line leading-[36px] break-words">
                          {letter.outroText || activeCard.recipientName}
                        </p>
                        <WaxSealSvg className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" />
                      </div>
                    </div>
                  )}
                </div>
              </article>
            </div>
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
        </div>

        <Link
          to="/sdileni"
          className="min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-sheet border-[1.5px] border-fir hover:bg-fir-soft text-base font-bold text-slate-text shadow-card transition shrink-0"
        >
          <UserPlus className="w-5 h-5 text-fir shrink-0" />
          <span>Pozvat blízké</span>
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
        <div className="py-10 text-center space-y-4 max-w-xl mx-auto">
          <WaxSealSvg className="w-20 h-20 mx-auto" />
          <h2 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text">
            {familyCards.length === 0
              ? 'Zatím tu nejsou žádné dopisy'
              : 'Ve skupině nejsou žádné dopisy'}
          </h2>
          <div>
            <Link
              to="/sdileni"
              className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-fir hover:bg-fir-hover text-white text-base font-bold shadow-sm transition"
            >
              <UserPlus className="w-5 h-5 shrink-0" />
              <span>Pozvat blízké</span>
            </Link>
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
