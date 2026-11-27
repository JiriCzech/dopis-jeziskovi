import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Check,
  ExternalLink,
  FileText,
  Gift,
  Image as ImageIcon,
  UserPlus,
  Users,
  X,
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

function getCardAvatar(card) {
  const childVisual = card.isChildLetter ? getChildAvatar(card.recipientName) : null;
  return {
    avatarId: childVisual ? childVisual.avatarId : card.ownerProfile?.avatarId || 'carp',
    avatarBg: childVisual ? childVisual.avatarBg : card.ownerProfile?.avatarBg || '#F5EEDB',
  };
}

function cardHasLetterContent(card) {
  const letter = card?.letter;
  if (!letter) return false;
  return Boolean(
    (letter.introText || '').trim() ||
    (letter.outroText || '').trim() ||
    letter.handwrittenPhotoUrl
  );
}

const FamilyWishRow = memo(function FamilyWishRow({ wish, onClaim }) {
  return (
    <li className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-5 hover:bg-paper/30 transition-colors">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="font-sans font-semibold text-base sm:text-[17px] text-slate-text leading-snug break-words">
          {wish.title}
        </div>

        {wish.note && (
          <p className="font-sans text-sm text-slate-text-muted leading-relaxed break-words">
            {wish.note}
          </p>
        )}

        {wish.url && (
          <div className="pt-0.5">
            <a
              href={wish.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] -my-1.5 px-2 -ml-2 rounded-lg inline-flex items-center gap-1.5 text-sm font-sans font-semibold text-fir hover:text-fir-dark hover:bg-fir-soft/45 hover:underline transition"
            >
              <span>Ukázka dárku</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onClaim(wish)}
        className="min-h-[44px] w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-fir hover:bg-fir-hover text-white font-sans text-sm font-bold shadow-2xs transition"
      >
        <Gift className="w-4 h-4 text-gold-glow shrink-0" />
        <span>Tohle koupím</span>
      </button>
    </li>
  );
});

const PersonWishSection = memo(function PersonWishSection({
  card,
  onClaimWish,
  onOpenLetterPreview,
}) {
  const letter = card.letter;
  const wishes = card.availableWishes || [];
  const { avatarId, avatarBg } = getCardAvatar(card);
  const hasContent = cardHasLetterContent(card);
  const isPhotoOnly = Boolean(
    letter?.handwrittenPhotoUrl &&
    !(letter?.introText || '').trim() &&
    !(letter?.outroText || '').trim()
  );

  // Osoby bez volných přání: nenápadný, úsporný jednořádkový kraftový proužek bez vnořených krabiček
  if (wishes.length === 0) {
    const hasAnyTotalWishes = Boolean(letter && (letter.wishes || []).length > 0);
    return (
      <section className="px-4 sm:px-6 py-3 rounded-2xl bg-[#EFE5D1]/75 border border-[#D8C8AC] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <Avatar avatarId={avatarId} avatarBg={avatarBg} size="xs" onTag />
          <div className="min-w-0 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h2 className="font-fairytale font-bold text-xl sm:text-2xl text-slate-text leading-tight break-words">
              {card.recipientName}
            </h2>
            {card.isChildLetter && card.parentName && (
              <span className="font-sans text-xs text-slate-text-muted">
                píše {card.parentName}
              </span>
            )}
            {hasAnyTotalWishes ? (
              <span className="inline-flex items-center gap-1 font-sans text-xs sm:text-sm font-semibold text-fir">
                <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                <span>Všechna přání splněna</span>
              </span>
            ) : (
              <span className="font-sans text-xs sm:text-sm text-slate-text-muted">
                Zatím bez přání
              </span>
            )}
          </div>
        </div>

        {hasContent && (
          <button
            type="button"
            onClick={() => onOpenLetterPreview(card)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFFDF8]/85 hover:bg-[#FFFDF8] text-xs sm:text-sm font-sans font-semibold text-fir transition shrink-0"
          >
            {isPhotoOnly ? (
              <ImageIcon className="w-4 h-4 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 shrink-0" />
            )}
            <span>{isPhotoOnly ? 'Fotka dopisu' : 'Přečíst dopis'}</span>
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-[#FFFDF8] border border-[#D8C8AC] shadow-card overflow-hidden">
      {/* Čistá kraftová hlavička osoby: známka + jméno vlevo, nenápadné Přečíst dopis vpravo */}
      <header className="bg-[#EFE5D1] border-b border-[#D8C8AC] px-3.5 sm:px-6 py-3.5 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar avatarId={avatarId} avatarBg={avatarBg} size="sm" onTag />
          <div className="min-w-0">
            <h2 className="font-fairytale font-bold text-[22px] sm:text-[28px] text-slate-text leading-tight truncate">
              {card.recipientName}
            </h2>
            {card.isChildLetter && card.parentName && (
              <p className="font-sans text-xs sm:text-sm text-slate-text-muted leading-snug mt-0.5 truncate">
                píše {card.parentName}
              </p>
            )}
          </div>
        </div>

        {hasContent && (
          <button
            type="button"
            onClick={() => onOpenLetterPreview(card)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-[#FFFDF8]/85 hover:bg-[#FFFDF8] text-xs sm:text-sm font-sans font-semibold text-fir whitespace-nowrap transition shrink-0"
          >
            {isPhotoOnly ? (
              <ImageIcon className="w-4 h-4 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 shrink-0" />
            )}
            <span>{isPhotoOnly ? 'Fotka dopisu' : 'Přečíst dopis'}</span>
          </button>
        )}
      </header>

      {/* Čistý, vzdušný seznam přání na krémově bílém podkladu */}
      <ul className="divide-y divide-paper-warm/70">
        {wishes.map((wish) => (
          <FamilyWishRow
            key={wish.id}
            wish={wish}
            onClaim={(w) => onClaimWish(card, w)}
          />
        ))}
      </ul>
    </section>
  );
});

export function FamilyPage() {
  const { notify, showUndoToast } = useAuth();
  const {
    familyCards,
    groups,
    optimisticClaimWish,
    optimisticUnclaimWish,
  } = useAppData();

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [selectedPersonId, setSelectedPersonId] = useState('all');
  const [previewCard, setPreviewCard] = useState(null);

  useEffect(() => {
    if (
      selectedGroupFilter !== 'all' &&
      !groups.some((g) => g.id === selectedGroupFilter)
    ) {
      setSelectedGroupFilter('all');
    }
  }, [groups, selectedGroupFilter]);

  // Synchronizace přímého odkazu ze Sdílení (?person=...)
  useEffect(() => {
    const param = searchParams.get('person');
    if (!param) return;
    if (familyCards.length === 0) return;

    const exactCard = familyCards.find((c) => c.cardId === param);
    const byOwner =
      familyCards.find((c) => !c.isChildLetter && c.ownerProfile?.uid === param) ||
      familyCards.find((c) => c.ownerProfile?.uid === param);
    const target = exactCard || byOwner;

    if (target) {
      setSelectedGroupFilter('all');
      setSelectedPersonId(target.cardId);
    } else {
      setSelectedPersonId('all');
    }
  }, [searchParams, familyCards]);

  useEffect(() => {
    if (!previewCard) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPreviewCard(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewCard]);

  const showGroupFilters = groups.length >= 2;

  const sortedGroupCards = useMemo(() => {
    const filtered =
      !showGroupFilters || selectedGroupFilter === 'all'
        ? familyCards
        : familyCards.filter((c) => (c.groupIds || []).includes(selectedGroupFilter));

    return [...filtered].sort((a, b) => {
      const aActive = (a.availableWishes || []).length > 0 ? 0 : 1;
      const bActive = (b.availableWishes || []).length > 0 ? 0 : 1;
      return aActive - bActive;
    });
  }, [familyCards, showGroupFilters, selectedGroupFilter]);

  useEffect(() => {
    if (
      selectedPersonId !== 'all' &&
      !sortedGroupCards.some((c) => c.cardId === selectedPersonId)
    ) {
      setSelectedPersonId('all');
    }
  }, [sortedGroupCards, selectedPersonId]);

  const visibleCards = useMemo(() => {
    if (selectedPersonId === 'all') return sortedGroupCards;
    return sortedGroupCards.filter((c) => c.cardId === selectedPersonId);
  }, [sortedGroupCards, selectedPersonId]);

  const handleSelectPerson = useCallback(
    (cardId) => {
      const next = cardId === selectedPersonId ? 'all' : cardId;
      setSelectedPersonId(next);
      if (searchParams.has('person')) {
        const nextParams = new URLSearchParams(searchParams);
        if (next === 'all') {
          nextParams.delete('person');
        } else {
          nextParams.set('person', next);
        }
        setSearchParams(nextParams, { replace: true });
      }
    },
    [selectedPersonId, searchParams, setSearchParams]
  );

  const handleClaimWish = useCallback(
    async (card, wish) => {
      if (!card?.letter) return;
      try {
        const claimId = `${card.letter.id}_${wish.id}`;
        await optimisticClaimWish(card.letter, wish);

        showUndoToast({
          message: 'Přidáno do nákupního seznamu',
          duration: 4500,
          onUndo: async () => {
            try {
              await optimisticUnclaimWish(claimId);
              notify('Dárek vrácen zpět do dopisu.');
            } catch (undoErr) {
              notify(undoErr.message || 'Nepodařilo se vrátit dárek zpět.', 'error');
            }
          },
        });
      } catch (err) {
        notify(err.message || 'Přání se nepodařilo zamluvit.', 'error');
      }
    },
    [optimisticClaimWish, optimisticUnclaimWish, showUndoToast, notify]
  );

  const previewAvatar = previewCard ? getCardAvatar(previewCard) : null;

  return (
    <div className="space-y-4 animate-page-transition min-w-0">
      {/* Čistá hlavička stránky: nadpis vlevo, akce vpravo */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-fairytale font-bold text-[28px] sm:text-[38px] leading-tight text-slate-text">
          Komu koupit dárek
        </h1>

        <div className="flex items-center gap-2 shrink-0">
          {showGroupFilters && (
            <div
              className="hidden sm:inline-flex items-center rounded-xl bg-kraft/85 p-1 border border-[#D8C8AC]"
              role="group"
              aria-label="Filtr skupiny"
            >
              <button
                type="button"
                onClick={() => setSelectedGroupFilter('all')}
                className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs sm:text-sm font-bold transition ${
                  selectedGroupFilter === 'all'
                    ? 'bg-sheet text-fir shadow-2xs'
                    : 'text-slate-text-muted hover:text-slate-text'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Vše</span>
              </button>
              {groups.map((grp) => {
                const active = selectedGroupFilter === grp.id;
                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => setSelectedGroupFilter(grp.id)}
                    className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs sm:text-sm font-bold transition ${
                      active
                        ? 'bg-sheet text-fir shadow-2xs'
                        : 'text-slate-text-muted hover:text-slate-text'
                    }`}
                  >
                    {renderGroupIcon(grp.icon, 'w-3.5 h-3.5 shrink-0')}
                    <span>{grp.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          <Link
            to="/sdileni"
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-sheet border border-paper-warm hover:bg-fir-soft font-sans text-xs sm:text-sm font-bold text-slate-text shadow-2xs whitespace-nowrap transition shrink-0"
          >
            <UserPlus className="w-4 h-4 text-fir shrink-0" />
            <span>Pozvat blízké</span>
          </Link>
        </div>
      </div>

      {/* Mobilní přepínač skupin na jednom čistém řádku */}
      {showGroupFilters && (
        <div
          className="sm:hidden inline-flex items-center rounded-xl bg-kraft/85 p-1 border border-[#D8C8AC] max-w-full overflow-x-auto no-scrollbar"
          role="group"
          aria-label="Filtr skupiny"
        >
          <button
            type="button"
            onClick={() => setSelectedGroupFilter('all')}
            className={`min-h-[44px] whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-bold transition ${
              selectedGroupFilter === 'all'
                ? 'bg-sheet text-fir shadow-2xs'
                : 'text-slate-text-muted hover:text-slate-text'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Vše</span>
          </button>
          {groups.map((grp) => {
            const active = selectedGroupFilter === grp.id;
            return (
              <button
                key={grp.id}
                type="button"
                onClick={() => setSelectedGroupFilter(grp.id)}
                className={`min-h-[44px] whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-bold transition ${
                  active
                    ? 'bg-sheet text-fir shadow-2xs'
                    : 'text-slate-text-muted hover:text-slate-text'
                }`}
              >
                {renderGroupIcon(grp.icon, 'w-3.5 h-3.5 shrink-0')}
                <span>{grp.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Přehledná řada lidí s mini ladovskými známkami (bez číselných počítadel) */}
      {sortedGroupCards.length > 0 && (
        <div
          className="flex items-center gap-2 overflow-x-auto flex-nowrap sm:flex-wrap sm:overflow-visible no-scrollbar pb-0.5"
          role="tablist"
          aria-label="Filtrovat podle člověka"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedPersonId === 'all'}
            onClick={() => handleSelectPerson('all')}
            className={`min-h-[44px] whitespace-nowrap shrink-0 inline-flex items-center px-4 py-1.5 rounded-full border font-sans text-sm font-bold transition ${
              selectedPersonId === 'all'
                ? 'bg-fir text-white border-fir shadow-2xs'
                : 'bg-sheet text-slate-text border-paper-warm hover:bg-fir-soft/70'
            }`}
          >
            <span>Všichni</span>
          </button>

          {sortedGroupCards.map((card) => {
            const count = (card.availableWishes || []).length;
            const hasTotal = Boolean(card.letter && (card.letter.wishes || []).length > 0);
            const active = selectedPersonId === card.cardId;
            const { avatarId, avatarBg } = getCardAvatar(card);
            return (
              <button
                key={card.cardId}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSelectPerson(card.cardId)}
                className={`min-h-[44px] whitespace-nowrap shrink-0 inline-flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full border font-sans text-sm font-bold transition ${
                  active
                    ? 'bg-fir text-white border-fir shadow-2xs'
                    : count === 0
                      ? 'bg-sheet/75 text-slate-text-muted border-paper-warm hover:bg-sheet'
                      : 'bg-sheet text-slate-text border-paper-warm hover:bg-fir-soft/70'
                }`}
              >
                <Avatar avatarId={avatarId} avatarBg={avatarBg} size="pill" />
                <span>{card.recipientName}</span>
                {count === 0 && hasTotal && (
                  <Check
                    className={`w-3.5 h-3.5 shrink-0 stroke-[2.5] ${
                      active ? 'text-gold-glow' : 'text-fir'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {visibleCards.length === 0 ? (
        <div className="py-12 px-6 rounded-2xl bg-sheet border border-paper-warm text-center space-y-4 max-w-xl mx-auto">
          <WaxSealSvg className="w-16 h-16 mx-auto" />
          <h2 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text">
            {familyCards.length === 0
              ? 'Zatím tu nejsou žádní blízcí'
              : 'Ve skupině zatím nejsou žádné dopisy'}
          </h2>
          <div>
            <Link
              to="/sdileni"
              className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-fir hover:bg-fir-hover text-white font-sans text-base font-bold shadow-xs transition"
            >
              <UserPlus className="w-5 h-5 shrink-0" />
              <span>Pozvat blízké</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {visibleCards.map((card) => (
            <PersonWishSection
              key={card.cardId}
              card={card}
              onClaimWish={handleClaimWish}
              onOpenLetterPreview={setPreviewCard}
            />
          ))}
        </div>
      )}

      {/* Volitelný náhled samotného dopisu Ježíškovi nebo fotky ručního dopisu */}
      {previewCard &&
        createPortal(
          <div
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setPreviewCard(null);
            }}
            style={{ backgroundColor: 'rgba(24, 26, 25, 0.68)', zIndex: 9999 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print"
          >
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl handmade-letter-paper p-5 sm:p-8 shadow-2xl space-y-6 relative"
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#8B7355]/25">
                <div className="flex items-center gap-3.5 min-w-0">
                  {previewAvatar && (
                    <Avatar
                      avatarId={previewAvatar.avatarId}
                      avatarBg={previewAvatar.avatarBg}
                      size="md"
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text leading-tight break-words">
                      {previewCard.recipientName}
                    </h3>
                    <p className="font-sans text-sm font-medium text-slate-text-muted mt-0.5">
                      {previewCard.isChildLetter && previewCard.parentName
                        ? `Dopis Ježíškovi · píše ${previewCard.parentName}`
                        : 'Dopis Ježíškovi'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewCard(null)}
                  className="min-w-[44px] min-h-[44px] -mt-1 -mr-1.5 rounded-xl flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-sheet/70 transition shrink-0"
                  aria-label="Zavřít náhled dopisu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {previewCard.letter?.handwrittenPhotoUrl && (
                <div className="relative pt-4 max-w-md mx-auto">
                  <PaperClipSvg className="w-9 h-14 absolute -top-2 left-6 z-20 pointer-events-none" />
                  <div className="bg-[#FFFDF8] p-3 rounded-xl shadow-card border border-[#E2D6BE]">
                    <img
                      src={previewCard.letter.handwrittenPhotoUrl}
                      alt={`Ručně psaný dopis (${previewCard.recipientName})`}
                      className="max-h-[380px] w-full object-contain rounded-lg bg-paper mx-auto"
                    />
                  </div>
                </div>
              )}

              {((previewCard.letter?.introText || '').trim() ||
                (previewCard.letter?.outroText || '').trim()) && (
                  <div className="space-y-5">
                    <div className="font-handwritten text-4xl font-bold text-fir leading-none">
                      Milý Ježíšku,
                    </div>

                    {(previewCard.letter?.introText || '').trim() && (
                      <p className="lined-letter-paper font-handwritten text-[24px] sm:text-[26px] text-[#1E2421] whitespace-pre-line leading-[36px] break-words">
                        {previewCard.letter.introText}
                      </p>
                    )}

                    <div className="pt-2 flex items-end justify-between gap-4">
                      <p className="lined-letter-paper flex-1 min-w-0 font-handwritten text-[24px] sm:text-[26px] text-[#1E2421] whitespace-pre-line leading-[36px] break-words">
                        {previewCard.letter?.outroText || previewCard.recipientName}
                      </p>
                      <WaxSealSvg className="w-14 h-14 shrink-0" />
                    </div>
                  </div>
                )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
