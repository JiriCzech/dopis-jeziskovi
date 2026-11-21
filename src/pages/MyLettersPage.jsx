import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  Edit3,
  ExternalLink,
  Gift,
  Loader2,
  Plus,
  Printer,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { CompactMistletoeSvg, WaxSealSvg } from '../assets/avatars';
import { useAuth } from '../hooks/useAuth';
import { deleteLetter, getUserLetters, saveLetter } from '../lib/db';
import { WishFormModal } from '../components/WishFormModal';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

function autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.max(el.scrollHeight, 84)}px`;
}

export function MyLettersPage() {
  const {
    authUser,
    profile,
    showOnboardingBanner,
    dismissOnboardingBanner,
    notify,
  } = useAuth();

  const [letters, setLetters] = useState([]);
  const [activeLetterId, setActiveLetterId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState('saved'); // 'saved' | 'saving'
  const [sealPulseKey, setSealPulseKey] = useState(0);
  const [newlyAddedWishId, setNewlyAddedWishId] = useState(null);
  const [draft, setDraft] = useState(null);

  // Modály
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

  useEffect(() => {
    latestDraftRef.current = draft;
  }, [draft]);

  const loadLetters = useCallback(async () => {
    if (!authUser || !profile) return;
    setLoading(true);
    try {
      let list = await getUserLetters(authUser.uid);
      if (list.length === 0) {
        const initialLetter = await saveLetter({
          ownerUid: authUser.uid,
          recipientName: profile.displayName,
          isChildLetter: false,
          introText: '',
          outroText: '',
          printTheme: 'handwritten',
          wishes: [],
        });
        list = [initialLetter];
      }
      setLetters(list);
      const selected = list[0];
      setActiveLetterId(selected.id);
      setDraft(selected);
      setSaveState('saved');
    } catch (err) {
      notify(err.message || 'Nepodařilo se načíst dopisy.', 'error');
    } finally {
      setLoading(false);
    }
  }, [authUser, profile, notify]);

  useEffect(() => {
    loadLetters();
  }, [loadLetters]);

  useEffect(() => {
    autoResizeTextarea(introRef.current);
    autoResizeTextarea(outroRef.current);
  }, [draft?.id, draft?.introText, draft?.outroText]);

  const persistLetterImmediate = useCallback(
    async (letterToSave) => {
      if (!letterToSave) return null;
      setSaveState('saving');
      try {
        const saved = await saveLetter(letterToSave);
        setLetters((prev) => {
          const exists = prev.some((l) => l.id === saved.id);
          return exists ? prev.map((l) => (l.id === saved.id ? saved : l)) : [...prev, saved];
        });
        setSaveState('saved');
        setSealPulseKey((k) => k + 1);
        return saved;
      } catch (err) {
        setSaveState('saved');
        notify(err.message || 'Automatické uložení dopisu se nezdařilo.', 'error');
        return null;
      }
    },
    [notify]
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

  const handleSaveWish = async (wishData) => {
    if (!draft) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const currentWishes = draft.wishes || [];
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
        setNewlyAddedWishId((curr) => (curr === createdId ? null : curr));
      }, 1250);
    }
    const nextDraft = { ...draft, wishes: updatedWishes };
    setDraft(nextDraft);
    setWishModalOpen(false);
    setEditingWish(null);
    await persistLetterImmediate(nextDraft);
  };

  const handleRemoveWish = async (wishId) => {
    if (!draft) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const updatedWishes = (draft.wishes || []).filter((w) => w.id !== wishId);
    const nextDraft = { ...draft, wishes: updatedWishes };
    setDraft(nextDraft);
    await persistLetterImmediate(nextDraft);
  };

  const handleCreateChildLetter = async (e) => {
    e.preventDefault();
    const cleaned = newChildName.trim();
    if (!cleaned || !authUser) return;
    const created = await persistLetterImmediate({
      ownerUid: authUser.uid,
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
      await deleteLetter(draft.id);
      const remaining = letters.filter((l) => l.id !== draft.id);
      setLetters(remaining);
      setConfirmDeleteOpen(false);
      if (remaining.length > 0) {
        setActiveLetterId(remaining[0].id);
        setDraft(remaining[0]);
      }
      notify(`Dopis pro ${draft.recipientName} byl smazán.`);
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

  if (loading || !draft) {
    return (
      <div className="py-16 text-center text-slate-text-muted text-lg">
        Načítám dopis...
      </div>
    );
  }

  const wishes = draft.wishes || [];
  const hasWrittenTextWithoutWishes =
    Boolean(draft.introText?.trim() || draft.outroText?.trim()) && wishes.length === 0;

  return (
    <div className="space-y-6 animate-page-transition">
      {/* Uvítací rozcestník po založení profilu */}
      {showOnboardingBanner && (
        <div className="max-w-[760px] mx-auto rounded-3xl bg-sheet border border-gold/40 shadow-soft p-6 relative">
          <button
            type="button"
            onClick={dismissOnboardingBanner}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-text-muted hover:text-slate-text hover:bg-paper-warm/50"
            aria-label="Zavřít uvítání"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-text">
            Vítej, {profile?.displayName}. Kde chceš začít?
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                dismissOnboardingBanner();
                introRef.current?.focus();
              }}
              className="min-h-[48px] flex items-center gap-3.5 p-4 rounded-2xl bg-paper border border-paper-warm hover:border-fir text-left transition"
            >
              <div className="w-11 h-11 rounded-2xl bg-crimson-soft text-crimson flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-text">Napsat dopis</div>
                <div className="text-sm text-slate-text-muted">
                  Rovnou piš na připravený papír níže.
                </div>
              </div>
            </button>

            <Link
              to="/rodina"
              onClick={dismissOnboardingBanner}
              className="min-h-[48px] flex items-center gap-3.5 p-4 rounded-2xl bg-paper border border-paper-warm hover:border-fir text-left transition"
            >
              <div className="w-11 h-11 rounded-2xl bg-fir-soft text-fir flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-text">Komu koupit dárek</div>
                <div className="text-sm text-slate-text-muted">
                  Prohlédni si dopisy rodiny nebo pozvi blízké.
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Přepínač dopisů nad papírem */}
      <div className="max-w-[760px] mx-auto flex flex-wrap items-center gap-2.5">
        {letters.map((l) => {
          const active = l.id === activeLetterId;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => selectLetter(l)}
              className={`min-h-[48px] px-5 py-2.5 rounded-2xl text-base font-bold transition ${
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
          className="min-h-[48px] inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-dashed border-fir/45 text-fir bg-sheet/70 hover:bg-fir-soft text-base font-semibold transition"
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
          <div className="flex-1">
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
        className="stationery-sheet paper-grain-overlay max-w-[760px] mx-auto rounded-[28px] border border-[#E5DBC3] p-7 sm:p-12 relative overflow-hidden animate-page-transition"
      >
        {/* Vnitřní jemná dvojitá zlatá linka odsazená 14px od okrajů */}
        <div className="stationery-inner-frame" aria-hidden="true" />

        <div className="relative z-10">
          {/* Horní lišta uvnitř papíru: drobný motiv jmelí + stav uložení a tisk vpravo */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-paper-warm/60">
            <CompactMistletoeSvg className="w-28 h-8 -ml-2 shrink-0" />

            <div className="flex items-center gap-2.5 ml-auto">
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

          {/* Nadpis dopisu s plným prostorem na jeden řádek */}
          <h1 className="font-handwritten text-4xl sm:text-5xl font-bold text-fir leading-none mb-5 w-full">
            Milý Ježíšku,
          </h1>

          {/* Bezrámečková textová plocha pro úvod dopisu přímo na papíře */}
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
                {wishes.map((wish) => {
                  const isNewlyAdded = newlyAddedWishId === wish.id;
                  return (
                    <li
                      key={wish.id}
                      className={`gift-tag-card rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 flex items-start justify-between gap-4 ${
                        isNewlyAdded
                          ? 'animate-wish-enter ring-2 ring-[#D4A359]/60 bg-[#FDF8EC]'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Zlatá dírka/kroužek papírové visačky */}
                        <span
                          className="w-3.5 h-3.5 rounded-full border-2 border-[#C89646]/75 bg-[#FFFDF9] shadow-inner shrink-0 mt-2"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="font-bold text-slate-text text-lg leading-snug">
                            {wish.title}
                          </div>
                          {wish.note && (
                            <p className="text-base text-slate-text-muted leading-relaxed">
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

                      {/* Ikonky tužky (upravit) a koše (smazat) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingWish(wish);
                            setWishModalOpen(true);
                          }}
                          title="Upravit přání"
                          aria-label={`Upravit přání ${wish.title}`}
                          className="w-10 h-10 rounded-xl inline-flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-sheet transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveWish(wish.id)}
                          title="Smazat přání"
                          aria-label={`Smazat přání ${wish.title}`}
                          className="w-10 h-10 rounded-xl inline-flex items-center justify-center text-slate-text-muted hover:text-crimson hover:bg-crimson-soft/60 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Připomínka, pokud je napsaný text dopisu, ale žádné přání */}
            {hasWrittenTextWithoutWishes && (
              <div className="rounded-2xl bg-gold-soft/85 border border-gold/50 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <div className="text-base text-slate-text leading-relaxed">
                  V dopise zatím nemáš přidaný žádný konkrétní dárek. Přidej ho tlačítkem níže, aby
                  si ho rodina mohla tajně zamluvit.
                </div>
              </div>
            )}

            {/* Tlačítko pro přidání přání */}
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
            <div className="flex-1">
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

            {/* Červená vosková pečeť s efektem při uložení */}
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

          {/* Diskrétní smazání dětského dopisu dole */}
          {draft.isChildLetter && (
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

      {/* Modál pro přidání / úpravu přání */}
      <WishFormModal
        open={wishModalOpen}
        initialWish={editingWish}
        onSave={handleSaveWish}
        onClose={() => {
          setWishModalOpen(false);
          setEditingWish(null);
        }}
      />

      {/* Modál náhledu tisku */}
      <PrintPreviewModal
        open={printOpen}
        letter={draft}
        onThemeChange={handlePrintThemeChange}
        onClose={() => setPrintOpen(false)}
      />

      {/* Potvrzení smazání dětského dopisu */}
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
