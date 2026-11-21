import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Gift,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Avatar,
  CompactMistletoeSvg,
  getChildAvatar,
  TagMistletoeCornerSvg,
  TagPostalStampSvg,
  WaxSealSvg,
} from '../assets/avatars';
import { useAuth } from '../hooks/useAuth';
import {
  claimWish,
  getAllFamilyLettersOverview,
  unclaimWish,
} from '../lib/db';
import {
  FamilyInviteModal,
  renderGroupIcon,
} from '../components/FamilyInviteModal';

function formatWishCount(count) {
  if (count === 0) return 'všechna přání splněna';
  if (count === 1) return '1 přání v dopise';
  return `${count} přání v dopise`;
}

export function FamilyPage() {
  const {
    authUser,
    pendingRequestsCount,
    notify,
    showUndoToast,
    refreshPendingCount,
    refreshShoppingCount,
  } = useAuth();

  const [cards, setCards] = useState([]);
  const [connections, setConnections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [activeCardId, setActiveCardId] = useState(null);
  const [claimingWishId, setClaimingWishId] = useState(null);
  const [exitingWishId, setExitingWishId] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const loadFamilyOverview = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const data = await getAllFamilyLettersOverview(authUser.uid);
      setCards(data.cards);
      setConnections(data.connections);
      setGroups(data.groups);
      setUsersMap(data.usersMap);
      await refreshPendingCount();
    } catch (err) {
      notify(err.message || 'Nepodařilo se načíst dopisy.', 'error');
    } finally {
      setLoading(false);
    }
  }, [authUser, notify, refreshPendingCount]);

  useEffect(() => {
    loadFamilyOverview();
  }, [loadFamilyOverview]);

  useEffect(() => {
    if (
      selectedGroupFilter !== 'all' &&
      !groups.some((g) => g.id === selectedGroupFilter)
    ) {
      setSelectedGroupFilter('all');
    }
  }, [groups, selectedGroupFilter]);

  const activeCard = cards.find((c) => c.cardId === activeCardId) || null;
  const showGroupFilters = groups.length >= 2;

  const visibleCards =
    !showGroupFilters || selectedGroupFilter === 'all'
      ? cards
      : cards.filter((c) => (c.groupIds || []).includes(selectedGroupFilter));

  const handleClaimWish = async (card, wish) => {
    if (!card?.letter || !authUser) return;
    setClaimingWishId(wish.id);
    try {
      const createdClaim = await claimWish(authUser.uid, card.letter, wish);

      setExitingWishId(wish.id);
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.cardId === card.cardId
              ? {
                  ...c,
                  availableWishes: c.availableWishes.filter((w) => w.id !== wish.id),
                }
              : c
          )
        );
        setExitingWishId(null);
      }, 260);

      await refreshShoppingCount();

      showUndoToast({
        message: 'Přidáno do tvého nákupního seznamu',
        onUndo: async () => {
          try {
            await unclaimWish(createdClaim.id);
            await Promise.all([loadFamilyOverview(), refreshShoppingCount()]);
            notify('Dárek byl vrácen zpět do dopisu.');
          } catch (undoErr) {
            notify(undoErr.message || 'Nepodařilo se vrátit dárek zpět.', 'error');
          }
        },
      });
    } catch (err) {
      notify(err.message || 'Přání se nepodařilo zamluvit.', 'error');
      await loadFamilyOverview();
    } finally {
      setClaimingWishId(null);
    }
  };

  // Detail rozkliknutého dopisu
  if (activeCard) {
    const letter = activeCard.letter;
    const wishes = activeCard.availableWishes || [];
    const childVisual = activeCard.isChildLetter
      ? getChildAvatar(activeCard.recipientName)
      : null;
    const avatarId = childVisual ? childVisual.avatarId : activeCard.ownerProfile.avatarId;
    const avatarBg = childVisual ? childVisual.avatarBg : activeCard.ownerProfile.avatarBg;

    return (
      <div className="max-w-[760px] mx-auto space-y-6 animate-page-transition">
        <div>
          <button
            type="button"
            onClick={() => setActiveCardId(null)}
            className="min-h-[48px] inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sheet border border-paper-warm hover:bg-paper-warm/60 text-base font-bold text-slate-text shadow-card transition"
          >
            <ArrowLeft className="w-5 h-5 text-fir shrink-0" />
            <span>Zpět na jmenovky</span>
          </button>
        </div>

        {/* Vysázený dopis na papírenském archu s dvojitou zlatou linkou a voskovou pečetí */}
        <article className="stationery-sheet paper-grain-overlay rounded-[28px] border border-[#E5DBC3] p-7 sm:p-11 relative overflow-hidden">
          <div className="stationery-inner-frame" aria-hidden="true" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4 pb-6 border-b border-paper-warm/80">
              <div className="flex items-center gap-4">
                <Avatar avatarId={avatarId} avatarBg={avatarBg} size="lg" />
                <div>
                  <h1 className="font-fairytale font-bold text-[32px] sm:text-[36px] leading-tight text-slate-text">
                    {activeCard.recipientName}
                  </h1>
                  {activeCard.isChildLetter && activeCard.parentName && (
                    <p className="text-sm text-slate-text-muted mt-0.5">
                      píše {activeCard.parentName}
                    </p>
                  )}
                </div>
              </div>
              <CompactMistletoeSvg className="w-28 h-9 hidden sm:block shrink-0" />
            </div>

            {!letter ? (
              <p className="py-8 text-lg text-slate-text-muted text-center">
                {activeCard.recipientName} zatím svůj dopis Ježíškovi teprve chystá.
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="font-handwritten text-3xl sm:text-4xl font-bold text-fir w-full">
                  Milý Ježíšku,
                </div>

                {letter.introText && (
                  <p className="text-lg sm:text-xl text-slate-text whitespace-pre-line leading-relaxed">
                    {letter.introText}
                  </p>
                )}

                <div className="pt-5 border-t border-paper-warm/60 flex items-end justify-between gap-4">
                  <p className="text-lg sm:text-xl text-slate-text whitespace-pre-line leading-relaxed">
                    {letter.outroText || activeCard.recipientName}
                  </p>
                  <WaxSealSvg className="w-16 h-16 sm:w-18 sm:h-18 shrink-0" />
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Seznam volných přání pod dopisem */}
        <section className="space-y-4">
          <h2 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text">
            Přání v dopise ({wishes.length})
          </h2>

          {wishes.length === 0 ? (
            <div className="stationery-sheet rounded-3xl border border-[#E5DBC3] p-8 text-center space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-gold-soft text-gold flex items-center justify-center mx-auto">
                <Gift className="w-5 h-5" />
              </div>
              <p className="font-fairytale font-bold text-2xl text-slate-text">
                Všechna přání z tohoto dopisu už mají svého tajného Ježíška
              </p>
              <p className="text-base text-slate-text-muted max-w-md mx-auto">
                Pokud chceš přesto udělat radost něčím navíc, můžeš si připsat vlastní tajný nápad
                ve svém nákupním seznamu.
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
                    <div className="flex items-start gap-3.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full border-2 border-[#C89646]/75 bg-[#FFFDF9] shadow-inner shrink-0 mt-2"
                        aria-hidden="true"
                      />
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-xl font-bold text-slate-text leading-snug">
                          {wish.title}
                        </h3>
                        {wish.note && (
                          <p className="text-base text-slate-text-muted leading-relaxed">
                            {wish.note}
                          </p>
                        )}
                        {wish.url && (
                          <div className="pt-1">
                            <a
                              href={wish.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gold-soft text-slate-text text-sm font-semibold hover:bg-gold/30 transition"
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
                      disabled={claimingWishId === wish.id || isExiting}
                      onClick={() => handleClaimWish(activeCard, wish)}
                      className="min-h-[48px] shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-fir hover:bg-fir-dark text-white text-base font-bold shadow-sm transition disabled:opacity-60"
                    >
                      <Gift className="w-5 h-5 shrink-0" />
                      <span>
                        {claimingWishId === wish.id ? 'Ukládám...' : 'Tohle koupím já'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page-transition">
      {/* Čistá horní lišta s pohádkovým nadpisem */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-fairytale font-bold text-[32px] sm:text-[36px] leading-tight text-slate-text">
          Komu koupit dárek
        </h1>

        <Link
          to="/sdileni"
          className="min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-sheet border border-paper-warm hover:bg-paper-warm/60 text-base font-bold text-slate-text shadow-card transition shrink-0"
        >
          <UserPlus className="w-5 h-5 text-fir shrink-0" />
          <span>Sdílení a skupiny</span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-crimson text-white">
              {pendingRequestsCount}
            </span>
          )}
        </Link>
      </div>

      {/* Chytré filtrování podle skupin (zobrazí se pouze tehdy, když má uživatel 2 a více skupin) */}
      {showGroupFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedGroupFilter('all')}
            className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-base font-bold transition ${
              selectedGroupFilter === 'all'
                ? 'bg-fir text-white shadow-xs'
                : 'bg-sheet text-slate-text border border-paper-warm hover:bg-paper-warm/50'
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
                className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-base font-bold transition ${
                  active
                    ? 'bg-fir text-white shadow-xs'
                    : 'bg-sheet text-slate-text border border-paper-warm hover:bg-paper-warm/50'
                }`}
              >
                {renderGroupIcon(grp.icon, 'w-4 h-4 shrink-0')}
                <span>{grp.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Mřížka historických/přírodních papírových dárkových jmenovek */}
      {loading ? (
        <div className="py-16 text-center text-lg text-slate-text-muted">
          Otevírám dopisy blízkých...
        </div>
      ) : visibleCards.length === 0 ? (
        <div className="stationery-sheet paper-grain-overlay rounded-3xl border border-[#E5DBC3] p-10 sm:p-12 text-center space-y-4 max-w-xl mx-auto relative overflow-hidden">
          <div className="stationery-inner-frame" aria-hidden="true" />
          <div className="relative z-10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-fir-soft text-fir flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text">
              {cards.length === 0
                ? 'Zatím tu je klid jako před Štědrým večerem'
                : 'V této skupině zatím nejsou žádné dopisy'}
            </h2>
            <p className="text-base text-slate-text-muted leading-relaxed">
              {cards.length === 0
                ? 'Pozvi rodinu nebo přátele přes zvací odkaz, abyste si mohli číst dopisy a tajně vybírat dárky.'
                : 'Přidej do skupiny své blízké nebo jim pošli zvací odkaz.'}
            </p>
            <div className="pt-2">
              <Link
                to="/sdileni"
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-fir hover:bg-fir-dark text-white text-base font-bold shadow-sm transition"
              >
                <UserPlus className="w-5 h-5 shrink-0" />
                <span>Přejít do Sdílení a skupiny</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-9 pt-4">
          {visibleCards.map((card) => {
            const wishCount = (card.availableWishes || []).length;
            const subtitleParts = [];
            if (card.isChildLetter && card.parentName) {
              subtitleParts.push(`píše ${card.parentName}`);
            }
            subtitleParts.push(formatWishCount(wishCount));

            return (
              <button
                key={card.cardId}
                type="button"
                onClick={() => setActiveCardId(card.cardId)}
                className="kraft-gift-tag-wrapper group relative text-center focus:outline-none pt-3"
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
                    stroke="#8A6B4A"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M21 26 C23 17 17 8 15 2"
                    stroke="#A68560"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Samotné tělo přírodní papírové jmenovky se zkosenými horními rohy */}
                <div className="kraft-gift-tag relative min-h-[268px] px-6 pt-12 pb-6 flex flex-col items-center justify-between">
                  {/* Kulatý vyztužený otvor pro provázek nahoře uprostřed */}
                  <div
                    className="w-7 h-7 rounded-full bg-[#EFE8D8] border-[3.5px] border-[#9C7A56] shadow-inner absolute top-3.5 left-1/2 -translate-x-1/2 z-10"
                    aria-hidden="true"
                  />

                  {/* Vnitřní jemná linka a ornamentální rohy jmenovky */}
                  <div
                    className="pointer-events-none absolute inset-3 border border-[#8E6F4E]/35 rounded-b-xl"
                    style={{
                      clipPath:
                        'polygon(18px 0%, calc(100% - 18px) 0%, 100% 18px, 100% 100%, 0% 100%, 0% 18px)',
                    }}
                    aria-hidden="true"
                  />

                  {/* Poštovní razítko Ježíškovy pošty vpravo nahoře */}
                  <TagPostalStampSvg className="w-24 h-12 absolute top-7 right-3.5 pointer-events-none" />

                  {/* Ilustrace větvičky jmelí v levém spodním rohu */}
                  <TagMistletoeCornerSvg className="w-24 h-20 absolute bottom-2 left-2 pointer-events-none" />

                  {/* Jemný rohový ornament v pravém spodním rohu */}
                  <svg
                    viewBox="0 0 36 36"
                    className="w-8 h-8 absolute bottom-3.5 right-3.5 text-[#8A6B4A]/55 pointer-events-none"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M32 10 V28 C32 30.2 30.2 32 28 32 H10 M27 18 C23 23 23 27 18 27"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                    <circle cx="28" cy="28" r="1.6" fill="currentColor" />
                  </svg>

                  {/* Střed jmenovky: Velké jméno a podtitulek */}
                  <div className="relative z-10 my-auto py-4 space-y-1.5">
                    <h2 className="font-fairytale font-bold text-3xl sm:text-[34px] text-[#242826] leading-tight tracking-tight">
                      {card.recipientName}
                    </h2>
                    <p className="text-sm font-semibold text-[#5C4938]">
                      {subtitleParts.join(' · ')}
                    </p>
                    {showGroupFilters &&
                      card.groupNames &&
                      card.groupNames.length > 0 && (
                        <p className="text-xs font-medium text-[#6E5844]">
                          ({card.groupNames.join(', ')})
                        </p>
                      )}
                  </div>

                  {/* Jemné integrované zakončení ve spodní části jmenovky */}
                  <div className="relative z-10 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EFE4D4]/75 border border-[#8E6F4E]/30 text-xs font-bold text-[#3D2E20] group-hover:bg-fir group-hover:text-white group-hover:border-fir transition-colors">
                      Otevřít dopis a přání
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <FamilyInviteModal
        open={inviteModalOpen}
        connections={connections}
        groups={groups}
        usersMap={usersMap}
        onUpdated={loadFamilyOverview}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
}
