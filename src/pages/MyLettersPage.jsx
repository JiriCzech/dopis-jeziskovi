import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  Edit3,
  ExternalLink,
  Loader2,
  Plus,
  Printer,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Avatar, CompactMistletoeSvg, WaxSealSvg } from '../assets/avatars';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../hooks/useAppData';
import { WishFormModal } from '../components/WishFormModal';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

function autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.max(el.scrollHeight, 84)}px`;
}

const WishTagItem = memo(function WishTagItem({
  wish,
  isNewlyAdded,
  onEdit,
  onRemove,
}) {
  return (
    <li
      className={`gift-tag-card rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 flex items-start justify-between gap-3 sm:gap-4 ${
        isNewlyAdded
          ? 'animate-wish-enter ring-2 ring-[#D4A359]/60 bg-[#FDF8EC]'
          : ''
      }`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span
          className="w-3.5 h-3.5 rounded-full border-2 border-[#C89646]/75 bg-[#FFFDF9] shadow-inner shrink-0 mt-2"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="font-bold text-slate-text text-lg leading-snug break-words">
            {wish.title}
          </div>
          {wish.note && (
            <p className="text-base text-slate-text-muted leading-relaxed break-words">
              {wish.note}
            </p>
          )}
          {wish.url && (
            <a
              href={wish.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gold-soft text-slate-text text-sm font-semibold hover:bg-gold/30 transition mt-1"
            >
              <span>Ukázka dárku</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(wish)}
          title="Upravit přání"
          aria-label={`Upravit přání ${wish.title}`}
          className="w-10 h-10 rounded-xl inline-flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-sheet transition"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(wish.id)}
          title="Smazat přání"
          aria-label={`Smazat přání ${wish.title}`}
          className="w-10 h-10 rounded-xl inline-flex items-center justify-center text-slate-text-muted hover:text-crimson hover:bg-crimson-soft/60 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
});

export function MyLettersPage() {
  const {
    authUser,
    profile,
    showOnboardingBanner,
    dismissOnboardingBanner,
    notify,
  } = useAuth();
  const {
    initialReady,
    myLetters,
    acceptedContacts,
    usersById,
    optimisticSaveMyLetter,
    optimisticDeleteMyLetter,
  } = useAppData();

  const [activeLetterId, setActiveLetterId] = useState(null);
  const [saveState, setSaveState] = useState('saved');
  const [sealPulseKey, setSealPulseKey] = useState(0);
  const [newlyAddedWishId, setNewlyAddedWishId] = useState(null);
  const [draft, setDraft] = useState(null);

  const [coParentModalOpen, setCoParentModalOpen] = useState(false);
  const [selectedCoParentUids, setSelectedCoParentUids] = useState([]);
  const [savingCoParents, setSavingCoParents] = useState(false);

  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [editingWish, setEditingWish] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [newChildOpen, setNewChildOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const introRef = useRef(null);
  const outroRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const latestDraftRef = useRef(null);
  const creatingDefaultRef = useRef(false);

  useEffect(() => {
    latestDraftRef.current = draft;
  }, [draft]);

  // Synchronizace aktivního dopisu z centrální paměti AppDataContext (0 ms při přepnutí záložky)
  useEffect(() => {
    if (!authUser || !profile) return;

    if (myLetters.length === 0) {
      if (initialReady && !creatingDefaultRef.current) {
        creatingDefaultRef.current = true;
        optimisticSaveMyLetter({
          ownerUid: authUser.uid,
          coParentUids: [],
          recipientName: profile.displayName,
          isChildLetter: false,
          introText: '',
          outroText: '',
          printTheme: 'handwritten',
          wishes: [],
        })
          .then((created) => {
            if (created) {
              setActiveLetterId(created.id);
              setDraft(created);
            }
          })
          .finally(() => {
            creatingDefaultRef.current = false;
          });
      }
      return;
    }

    setDraft((currDraft) => {
      if (!currDraft) {
        const first = myLetters[0];
        setActiveLetterId(first.id);
        return first;
      }
      const match = myLetters.find((l) => l.id === currDraft.id);
      if (!match) {
        const fallback = myLetters[0];
        setActiveLetterId(fallback.id);
        return fallback;
      }
      // Pokud zrovna nepíšeme (není naplánovaný debounce), převezmeme případné změny od druhého rodiče
      if (!debounceTimerRef.current) {
        return match;
      }
      return currDraft;
    });
  }, [authUser, profile, initialReady, myLetters, optimisticSaveMyLetter]);

  useEffect(() => {
    autoResizeTextarea(introRef.current);
    autoResizeTextarea(outroRef.current);
  }, [draft?.id, draft?.introText, draft?.outroText]);

  const persistLetterImmediate = useCallback(
    async (letterToSave) => {
      if (!letterToSave) return null;
      setSaveState('saving');
      try {
        const saved = await optimisticSaveMyLetter(letterToSave);
        setSaveState('saved');
        setSealPulseKey((k) => k + 1);
        return saved;
      } catch (err) {
        setSaveState('saved');
        notify(err.message || 'Automatické uložení dopisu se nezdařilo.', 'error');
        return null;
      }
    },
    [optimisticSaveMyLetter, notify]
  );

  const scheduleAutoSave = useCallback(
    (nextDraft) => {
      setSaveState('saving');
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        persistLetterImmediate(nextDraft);
        debounceTimerRef.current = null;
      }, 600);
    },
    [persistLetterImmediate]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const selectLetter = async (letter) => {
    if (debounceTimerRef.current && latestDraftRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      await persistLetterImmediate(latestDraftRef.current);
    }
    setActiveLetterId(letter.id);
    setDraft(letter);
    setSaveState('saved');
  };

  const handleTextChange = (field, value, textareaEl) => {
    if (textareaEl) autoResizeTextarea(textareaEl);
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      scheduleAutoSave(next);
      return next;
    });
  };

  const handleSaveWish = useCallback(
    async (wishData) => {
      const curr = latestDraftRef.current;
      if (!curr) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const currentWishes = curr.wishes || [];
      let updatedWishes;
      if (wishData.id) {
        updatedWishes = currentWishes.map((w) => (w.id === wishData.id ? wishData : w));
      } else {
        const createdId = `wish-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        updatedWishes = [
          ...currentWishes,
          {
            ...wishData,
            id: createdId,
            createdAt: Date.now(),
          },
        ];
        setNewlyAddedWishId(createdId);
        setTimeout(() => {
          setNewlyAddedWishId((id) => (id === createdId ? null : id));
        }, 1250);
      }
      const nextDraft = { ...curr, wishes: updatedWishes };
      setDraft(nextDraft);
      setWishModalOpen(false);
      setEditingWish(null);
      await persistLetterImmediate(nextDraft);
    },
    [persistLetterImmediate]
  );

  const handleEditWishClick = useCallback((wish) => {
    setEditingWish(wish);
    setWishModalOpen(true);
  }, []);

  const handleRemoveWish = useCallback(
    async (wishId) => {
      const curr = latestDraftRef.current;
      if (!curr) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const updatedWishes = (curr.wishes || []).filter((w) => w.id !== wishId);
      const nextDraft = { ...curr, wishes: updatedWishes };
      setDraft(nextDraft);
      await persistLetterImmediate(nextDraft);
    },
    [persistLetterImmediate]
  );

  const handleCreateChildLetter = async (e) => {
    e.preventDefault();
    const cleaned = newChildName.trim();
    if (!cleaned || !authUser) return;
    const created = await persistLetterImmediate({
      ownerUid: authUser.uid,
      coParentUids: [],
      recipientName: cleaned,
      isChildLetter: true,
      introText: '',
      outroText: '',
      printTheme: 'handwritten',
      wishes: [],
    });
    if (created) {
      setActiveLetterId(created.id);
      setDraft(created);
      setNewChildName('');
      setNewChildOpen(false);
      notify(`Dopis pro ${created.recipientName} je připraven.`);
    }
  };

  const handleDeleteCurrentLetter = async () => {
    if (!draft) return;
    try {
      const deletedName = draft.recipientName;
      const deletedId = draft.id;
      const remaining = myLetters.filter((l) => l.id !== deletedId);
      setConfirmDeleteOpen(false);
      if (remaining.length > 0) {
        setActiveLetterId(remaining[0].id);
        setDraft(remaining[0]);
      }
      await optimisticDeleteMyLetter(deletedId);
      notify(`Dopis pro ${deletedName} byl smazán.`);
    } catch (err) {
      notify(err.message || 'Smazání dopisu se nezdařilo.', 'error');
    }
  };

  const handlePrintThemeChange = async (nextTheme) => {
    if (!draft) return;
    const updated = { ...draft, printTheme: nextTheme };
    setDraft(updated);
    await persistLetterImmediate(updated);
  };

  const openCoParentModal = () => {
    if (!draft) return;
    setSelectedCoParentUids(Array.isArray(draft.coParentUids) ? draft.coParentUids : []);
    setCoParentModalOpen(true);
  };

  const toggleCoParentUid = (uid) => {
    setSelectedCoParentUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSaveCoParents = async (e) => {
    e.preventDefault();
    if (!draft) return;
    setSavingCoParents(true);
    try {
      const nextDraft = {
        ...draft,
        coParentUids: selectedCoParentUids,
      };
      setDraft(nextDraft);
      setCoParentModalOpen(false);
      await persistLetterImmediate(nextDraft);
      notify('Společná správa dětského dopisu byla uložena.');
    } finally {
      setSavingCoParents(false);
    }
  };

  const coParentPartnerNames = useMemo(() => {
    if (!draft?.isChildLetter) return [];
    const names = [];
    const isOwner = draft.ownerUid === authUser?.uid;
    if (!isOwner && draft.ownerUid) {
      const ownerName = usersById[draft.ownerUid]?.displayName;
      if (ownerName) names.push(ownerName);
    }
    (draft.coParentUids || []).forEach((uid) => {
      if (uid !== authUser?.uid) {
        const pName = usersById[uid]?.displayName;
        if (pName) names.push(pName);
      }
    });
    return names;
  }, [draft, authUser?.uid, usersById]);

  if (!draft) {
    return null;
  }

  const wishes = draft.wishes || [];
  const hasWrittenTextWithoutWishes =
    Boolean(draft.introText?.trim() || draft.outroText?.trim()) && wishes.length === 0;
  const isOwnerOfDraft = draft.ownerUid === authUser?.uid;

  return (
    <div className="space-y-6 animate-page-transition min-w-0">
      {/* Jemný, zavírací uvítací proužek po prvním přihlášení */}
      {showOnboardingBanner && (
        <div className="max-w-[760px] mx-auto rounded-2xl bg-sheet border border-gold/45 shadow-card px-5 py-4 flex items-start justify-between gap-4 relative">
          <p className="text-base text-slate-text leading-relaxed">
            Vítej! Svůj dopis můžeš začít psát rovnou tady. Vánoční obrázek a kód pro pozvání
            rodiny najdeš kdykoliv ve svém{' '}
            <Link to="/profil" className="font-bold text-fir underline hover:text-fir-dark">
              profilu
            </Link>{' '}
            nebo v sekci{' '}
            <Link to="/sdileni" className="font-bold text-fir underline hover:text-fir-dark">
              Sdílení a skupiny
            </Link>
            .
          </p>
          <button
            type="button"
            onClick={dismissOnboardingBanner}
            className="p-1.5 rounded-xl text-slate-text-muted hover:text-slate-text hover:bg-paper-warm/50 shrink-0"
            aria-label="Zavřít uvítání"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Přepínač dopisů nad papírem */}
      <div className="max-w-[760px] mx-auto flex flex-wrap items-center gap-2.5">
        {myLetters.map((l) => {
          const active = l.id === activeLetterId;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => selectLetter(l)}
              className={`min-h-[48px] px-4 sm:px-5 py-2.5 rounded-2xl text-base font-bold transition ${
                active
                  ? 'bg-fir text-white shadow-sm'
                  : 'bg-sheet text-slate-text border border-paper-warm hover:bg-paper-warm/50'
              }`}
            >
              {l.isChildLetter ? l.recipientName : `Můj dopis (${l.recipientName})`}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setNewChildOpen(true)}
          className="min-h-[48px] inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl border-2 border-dashed border-fir/45 text-fir bg-sheet/70 hover:bg-fir-soft text-base font-semibold transition"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span>Napsat dopis za dítě</span>
        </button>
      </div>

      {/* Formulář pro přidání dětského dopisu */}
      {newChildOpen && (
        <form
          onSubmit={handleCreateChildLetter}
          className="max-w-[760px] mx-auto rounded-3xl bg-sheet border border-fir/30 p-5 shadow-soft flex flex-col sm:flex-row items-stretch sm:items-end gap-3 animate-slide-up"
        >
          <div className="flex-1 min-w-0">
            <label
              htmlFor="new-child-letter-name"
              className="block text-base font-bold text-slate-text mb-1.5"
            >
              Jméno dítěte
            </label>
            <input
              id="new-child-letter-name"
              type="text"
              maxLength={40}
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              placeholder="Např. Julinka, Šárinka, Matýsek..."
              className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl border border-paper-warm bg-paper text-base focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir"
              autoFocus
            />
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => {
                setNewChildOpen(false);
                setNewChildName('');
              }}
              className="min-h-[48px] px-5 py-2.5 rounded-2xl border border-paper-warm text-base font-semibold text-slate-text hover:bg-paper-warm/40"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={!newChildName.trim()}
              className="min-h-[48px] px-6 py-2.5 rounded-2xl bg-fir hover:bg-fir-dark text-white text-base font-bold disabled:opacity-50"
            >
              Založit dopis
            </button>
          </div>
        </form>
      )}

      {/* Skutečný arch dopisního papíru (Tactile Stationery) */}
      <article
        key={draft.id}
        className="stationery-sheet paper-grain-overlay max-w-[760px] mx-auto rounded-[28px] border border-[#E5DBC3] p-6 sm:p-12 relative overflow-hidden animate-page-transition"
      >
        <div className="stationery-inner-frame" aria-hidden="true" />

        <div className="relative z-10">
          {/* Horní lišta uvnitř papíru */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 mb-5 border-b border-paper-warm/60">
            <div className="flex flex-wrap items-center gap-2">
              <CompactMistletoeSvg className="w-24 h-7 -ml-1 shrink-0" />

              {draft.isChildLetter && coParentPartnerNames.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fir-soft text-fir text-xs font-bold">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>Spravujete společně s: {coParentPartnerNames.join(', ')}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-text-muted"
                aria-live="polite"
              >
                {saveState === 'saving' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-gold animate-spin" />
                    <span>Ukládám...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-fir" />
                    <span>Uloženo</span>
                  </>
                )}
              </div>

              {draft.isChildLetter && isOwnerOfDraft && (
                <button
                  type="button"
                  onClick={openCoParentModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper/80 hover:bg-paper-warm/70 border border-paper-warm text-xs sm:text-sm font-semibold text-slate-text transition"
                >
                  <Users className="w-4 h-4 text-fir shrink-0" />
                  <span>Spravovat společně</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPrintOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper/80 hover:bg-paper-warm/70 border border-paper-warm text-xs sm:text-sm font-semibold text-slate-text transition"
              >
                <Printer className="w-4 h-4 text-fir shrink-0" />
                <span>Vytisknout</span>
              </button>
            </div>
          </div>

          <h1 className="font-handwritten text-4xl sm:text-5xl font-bold text-fir leading-none mb-5 w-full">
            Milý Ježíšku,
          </h1>

          <div>
            <label htmlFor="letter-intro-input" className="sr-only">
              Text dopisu Ježíškovi
            </label>
            <textarea
              id="letter-intro-input"
              ref={introRef}
              rows={3}
              value={draft.introText}
              onChange={(e) => handleTextChange('introText', e.target.value, e.target)}
              placeholder="napiš, co by ti letos pod stromečkem udělalo radost..."
              className="w-full border-0 bg-transparent p-0 text-lg sm:text-xl text-slate-text placeholder:text-slate-text-muted/55 leading-relaxed focus:outline-none focus:ring-0 resize-none overflow-hidden"
            />
          </div>

          {/* Přání jako papírové dárkové visačky */}
          <div className="my-8 space-y-4">
            <div className="text-sm font-bold uppercase tracking-wider text-fir/80">
              Přání pod stromeček
            </div>

            {wishes.length === 0 && !hasWrittenTextWithoutWishes && (
              <div className="rounded-2xl bg-[#FAF5EB]/80 border border-dashed border-[#D9C7A3] p-5 text-base text-slate-text-muted leading-relaxed">
                Papír čeká na tvá první vánoční přání — připiš je tlačítkem níže, aby Ježíšek
                věděl, co ti udělá největší radost.
              </div>
            )}

            {wishes.length > 0 && (
              <ul className="space-y-3">
                {wishes.map((wish) => (
                  <WishTagItem
                    key={wish.id}
                    wish={wish}
                    isNewlyAdded={newlyAddedWishId === wish.id}
                    onEdit={handleEditWishClick}
                    onRemove={handleRemoveWish}
                  />
                ))}
              </ul>
            )}

            {hasWrittenTextWithoutWishes && (
              <div className="rounded-2xl bg-gold-soft/85 border border-gold/50 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <div className="text-base text-slate-text leading-relaxed">
                  V dopise zatím nemáš přidaný žádný konkrétní dárek. Přidej ho tlačítkem níže, aby
                  si ho rodina mohla tajně zamluvit.
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingWish(null);
                setWishModalOpen(true);
              }}
              className="min-h-[48px] w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-crimson hover:bg-crimson-dark text-white text-base font-bold shadow-sm transition"
            >
              <Plus className="w-5 h-5 shrink-0" />
              <span>Přidat další přání</span>
            </button>
          </div>

          {/* Spodní část: Závěrečný pozdrav a červená vosková pečeť */}
          <div className="pt-6 border-t border-paper-warm/70 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex-1 min-w-0">
              <label htmlFor="letter-outro-input" className="sr-only">
                Závěrečný pozdrav a podpis
              </label>
              <textarea
                id="letter-outro-input"
                ref={outroRef}
                rows={2}
                value={draft.outroText}
                onChange={(e) => handleTextChange('outroText', e.target.value, e.target)}
                placeholder={`Děkuji,\n${draft.recipientName || ''}`}
                className="w-full border-0 bg-transparent p-0 text-lg sm:text-xl text-slate-text placeholder:text-slate-text-muted/55 leading-relaxed focus:outline-none focus:ring-0 resize-none overflow-hidden"
              />
            </div>

            <div
              key={sealPulseKey}
              title="Zapečetěno pro Ježíška"
              className="self-end sm:self-auto shrink-0 select-none"
            >
              <WaxSealSvg
                className="w-16 h-16 sm:w-20 sm:h-20"
                pressed={sealPulseKey > 0}
              />
            </div>
          </div>

          {draft.isChildLetter && isOwnerOfDraft && (
            <div className="mt-6 pt-4 border-t border-paper-warm/50 flex justify-end">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-text-muted hover:text-crimson transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Smazat dopis pro {draft.recipientName}</span>
              </button>
            </div>
          )}
        </div>
      </article>

      {/* Modální okno pro společnou správu dětského dopisu druhým rodičem */}
      {coParentModalOpen &&
        createPortal(
          <div
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !savingCoParents) {
                setCoParentModalOpen(false);
              }
            }}
            style={{ backgroundColor: 'rgba(24, 26, 25, 0.68)', zIndex: 9999 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print"
          >
            <div
              role="dialog"
              aria-modal="true"
              style={{ backgroundColor: '#FFFDF9' }}
              className="w-full max-w-md rounded-2xl bg-[#FFFDF9] border border-[#E5DEC9] shadow-2xl p-6 animate-slide-up space-y-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text leading-tight">
                  Spravovat dopis společně
                </h3>
                <button
                  type="button"
                  onClick={() => setCoParentModalOpen(false)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-[#F6F1E7] transition"
                  aria-label="Zavřít"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm sm:text-base text-slate-text-muted leading-relaxed">
                Vyber druhého rodiče, který bude moci dopis pro{' '}
                <strong className="text-slate-text">{draft.recipientName}</strong> také upravovat,
                přidávat do něj přání a tisknout ho. Ani jeden z vás neuvidí, kdo z rodiny dárky
                zamluvil.
              </p>

              <form onSubmit={handleSaveCoParents} className="space-y-4">
                {acceptedContacts.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F6F1E7] border border-[#E5DEC9] text-sm text-slate-text-muted space-y-2">
                    <p>Zatím nemáš žádného propojeného blízkého.</p>
                    <Link
                      to="/sdileni"
                      onClick={() => setCoParentModalOpen(false)}
                      className="inline-block font-bold text-fir underline"
                    >
                      Přejít do Sdílení a skupiny
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {acceptedContacts.map(({ uid, user }) => {
                      const checked = selectedCoParentUids.includes(uid);
                      return (
                        <label
                          key={uid}
                          style={{ backgroundColor: checked ? '#E3EFEA' : '#F6F1E7' }}
                          className={`min-h-[52px] flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                            checked
                              ? 'border-fir bg-[#E3EFEA]'
                              : 'border-[#E5DEC9] bg-[#F6F1E7] hover:bg-[#EAE1D0]/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCoParentUid(uid)}
                            className="w-5 h-5 accent-[#234B3E] rounded cursor-pointer shrink-0"
                          />
                          <Avatar avatarId={user.avatarId} avatarBg={user.avatarBg} size="xs" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-slate-text truncate">
                              {user.displayName}
                            </div>
                            <div className="text-xs text-slate-text-muted truncate">
                              {user.displayName}#{user.tag}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCoParentModalOpen(false)}
                    disabled={savingCoParents}
                    className="min-h-[48px] px-5 py-2.5 rounded-xl border border-[#E5DEC9] bg-[#F6F1E7] text-base font-semibold text-slate-text hover:bg-[#EAE1D0] transition"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    disabled={savingCoParents}
                    className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-fir hover:bg-fir-dark text-white text-base font-bold shadow-sm transition disabled:opacity-60"
                  >
                    <Check className="w-5 h-5 shrink-0" />
                    <span>{savingCoParents ? 'Ukládám...' : 'Uložit'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      <WishFormModal
        open={wishModalOpen}
        initialWish={editingWish}
        onSave={handleSaveWish}
        onClose={() => {
          setWishModalOpen(false);
          setEditingWish(null);
        }}
      />

      <PrintPreviewModal
        open={printOpen}
        letter={draft}
        onThemeChange={handlePrintThemeChange}
        onClose={() => setPrintOpen(false)}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        danger
        title={`Smazat dopis pro ${draft.recipientName}?`}
        description="Dopis i všechna jeho přání budou odstraněny."
        confirmLabel="Smazat dopis"
        onConfirm={handleDeleteCurrentLetter}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
