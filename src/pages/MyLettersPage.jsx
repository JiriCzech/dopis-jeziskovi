import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Camera,
  Check,
  Edit3,
  ExternalLink,
  Loader2,
  Mail,
  Plus,
  Printer,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  Avatar,
  CompactMistletoeSvg,
  PaperClipSvg,
  TagPostalStampSvg,
  WaxSealSvg,
} from '../assets/avatars';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../hooks/useAppData';
import { WishFormModal } from '../components/WishFormModal';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { KaprikGuide } from '../components/KaprikGuide';

function autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.max(el.scrollHeight, 88)}px`;
}

/**
 * Komprese nahrané fotky ručně psaného dopisu na klientovi přes HTML5 canvas (~50–95 KB JPEG)
 */
function compressHandwrittenImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Soubor s fotkou se nepodařilo načíst.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Neplatný formát obrázku.'));
      img.onload = () => {
        const MAX_DIM = 860;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFDF8';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Jednotlivý řádek přání přímo na linkovaném dopisním papíře (žádné těžké boxy)
 */
const WishLetterLineItem = memo(function WishLetterLineItem({
  wish,
  isNewlyAdded,
  onEdit,
  onRemove,
}) {
  return (
    <li
      className={`letter-wish-line py-3 px-2 sm:px-3 rounded-xl flex items-start justify-between gap-3 ${
        isNewlyAdded ? 'animate-wish-enter bg-gold-soft/75 ring-1 ring-gold' : ''
      }`}
    >
      <div className="flex items-baseline gap-2.5 min-w-0 flex-1">
        <Star className="w-4 h-4 text-gold fill-gold shrink-0 translate-y-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="font-handwritten font-bold text-slate-text text-2xl sm:text-[28px] leading-snug break-words">
            {wish.title}
          </span>
          {wish.note && (
            <span className="font-handwritten italic text-xl sm:text-2xl text-slate-text-muted break-words">
              — {wish.note}
            </span>
          )}
          {wish.url && (
            <a
              href={wish.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Otevřít ukázku dárku"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold-soft border border-gold/45 text-slate-text text-xs font-sans font-bold hover:bg-gold/30 transition"
            >
              <ExternalLink className="w-3 h-3 text-fir shrink-0" />
              <span>Ukázka</span>
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
          className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-slate-text-muted hover:text-fir hover:bg-fir-soft transition"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(wish.id)}
          title="Smazat přání"
          aria-label={`Smazat přání ${wish.title}`}
          className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-slate-text-muted hover:text-crimson hover:bg-crimson-soft transition"
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

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);

  // Rituál zapečetění a odeslání obálky Ježíškovi ('idle' | 'folding' | 'sealing' | 'flying' | 'done')
  const [ritualStage, setRitualStage] = useState('idle');

  const introRef = useRef(null);
  const outroRef = useRef(null);
  const fileInputRef = useRef(null);
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
          handwrittenPhotoUrl: '',
          sealedAt: null,
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
      }, 550);
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

  const handlePhotoUploadChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !draft) return;

    setUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressHandwrittenImage(file);
      const nextDraft = { ...draft, handwrittenPhotoUrl: compressedDataUrl };
      setDraft(nextDraft);
      await persistLetterImmediate(nextDraft);
      notify('Fotka ručně psaného dopisu byla připnuta zlatou sponkou.');
    } catch (err) {
      notify(err.message || 'Fotku dopisu se nepodařilo nahrát.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemoveHandwrittenPhoto = async () => {
    if (!draft) return;
    const nextDraft = { ...draft, handwrittenPhotoUrl: '' };
    setDraft(nextDraft);
    await persistLetterImmediate(nextDraft);
    notify('Fotka papírového dopisu byla odebrána.');
  };

  const handleStartEnvelopeRitual = async () => {
    const curr = latestDraftRef.current;
    if (!curr || ritualStage !== 'idle') return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setRitualStage('folding');
    const nextDraft = { ...curr, sealedAt: Date.now() };
    setDraft(nextDraft);
    persistLetterImmediate(nextDraft);

    setTimeout(() => {
      setRitualStage('sealing');
    }, 850);

    setTimeout(() => {
      setRitualStage('flying');
    }, 1850);

    setTimeout(() => {
      setRitualStage('done');
    }, 2950);
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
      handwrittenPhotoUrl: '',
      sealedAt: null,
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
  const isOwnerOfDraft = draft.ownerUid === authUser?.uid;

  return (
    <div className="space-y-6 animate-page-transition min-w-0">
      {/* Jednorázová vřelá kapříkova bublina po prvním přihlášení */}
      {showOnboardingBanner && (
        <div className="max-w-[780px] mx-auto">
          <KaprikGuide
            pose="vitej"
            size="compact"
            bubbleDirection="left"
            onDismiss={dismissOnboardingBanner}
            message={
              <>
                „Vítej! Svůj dopis můžeš začít psát rovnou tady. Vánoční obrázek a kód pro pozvání
                rodiny najdeš kdykoliv v{' '}
                <Link to="/profil" className="font-bold text-fir underline hover:text-fir-hover">
                  profilu
                </Link>{' '}
                nebo v sekci{' '}
                <Link to="/sdileni" className="font-bold text-fir underline hover:text-fir-hover">
                  Sdílení a skupiny
                </Link>
                .“
              </>
            }
          />
        </div>
      )}

      {/* Záložky dopisů nad dopisním papírem: Můj dopis (Jirka), Julinka, Šárinka a + Napsat za dítě */}
      <div className="max-w-[780px] mx-auto flex flex-wrap items-center gap-2.5">
        {myLetters.map((l) => {
          const active = l.id === activeLetterId;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => selectLetter(l)}
              className={`min-h-[48px] px-4 sm:px-5 py-2.5 rounded-2xl text-base font-bold transition border-[1.5px] ${
                active
                  ? 'bg-fir text-white border-fir shadow-sm'
                  : 'bg-sheet text-slate-text border-fir/40 hover:bg-fir-soft'
              }`}
            >
              {l.isChildLetter ? l.recipientName : `Můj dopis (${l.recipientName})`}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setNewChildOpen(true)}
          className="min-h-[48px] inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl border-[1.5px] border-dashed border-fir text-fir bg-sheet/85 hover:bg-fir-soft text-base font-bold transition"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span>Napsat za dítě</span>
        </button>
      </div>

      {/* Formulář pro přidání dětského dopisu */}
      {newChildOpen && (
        <form
          onSubmit={handleCreateChildLetter}
          className="max-w-[780px] mx-auto rounded-3xl bg-sheet border-[1.5px] border-fir p-5 shadow-soft flex flex-col sm:flex-row items-stretch sm:items-end gap-3 animate-slide-up"
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
              className="min-h-[48px] px-6 py-2.5 rounded-2xl bg-fir hover:bg-fir-hover text-white text-base font-bold disabled:opacity-50"
            >
              Založit dopis
            </button>
          </div>
        </form>
      )}

      {/* Jeden celistvý dopisní arch (#FFFDF8) s tmavě zeleným okrajem a zlatou vnitřní linkou */}
      <article
        key={draft.id}
        className="stationery-sheet max-w-[780px] mx-auto rounded-[28px] p-5 sm:p-11 relative overflow-hidden animate-page-transition"
      >
        <div className="stationery-inner-frame" aria-hidden="true" />

        {/* Skrytý input pro nahrání fotky ručně psaného dopisu */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUploadChange}
          className="hidden"
        />

        <div className="relative z-10">
          {/* Horní lišta uvnitř dopisního archu */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 mb-6 border-b border-gold/35">
            <div className="flex flex-wrap items-center gap-2">
              <CompactMistletoeSvg className="w-24 h-7 -ml-1 shrink-0" />

              {draft.isChildLetter && coParentPartnerNames.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fir-soft border border-fir/25 text-fir text-xs font-bold">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>Spravujete společně s: {coParentPartnerNames.join(', ')}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {/* Automatické ukládání na pozadí */}
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper border border-gold/35 text-xs font-bold text-fir"
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
                    <span>Uloženo u Ježíška</span>
                  </>
                )}
              </div>

              {/* Nahrání fotky ručně psaného papírového dopisu */}
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-kraft hover:bg-paper-warm border border-fir/40 text-xs sm:text-sm font-bold text-slate-text transition disabled:opacity-60"
              >
                <Camera className="w-4 h-4 text-fir shrink-0" />
                <span>
                  {uploadingPhoto
                    ? 'Připínám fotku...'
                    : draft.handwrittenPhotoUrl
                      ? 'Změnit fotku dopisu'
                      : 'Nahrát fotku papírového dopisu'}
                </span>
              </button>

              {draft.isChildLetter && isOwnerOfDraft && (
                <button
                  type="button"
                  onClick={openCoParentModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper hover:bg-fir-soft border border-fir/35 text-xs sm:text-sm font-bold text-slate-text transition"
                >
                  <Users className="w-4 h-4 text-fir shrink-0" />
                  <span>Spravovat společně</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPrintOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper hover:bg-fir-soft border border-fir/35 text-xs sm:text-sm font-bold text-slate-text transition"
              >
                <Printer className="w-4 h-4 text-fir shrink-0" />
                <span>Vytisknout</span>
              </button>
            </div>
          </div>

          {/* Připnutá fotka ručně psaného papírového dopisu se zlatou sponkou */}
          {draft.handwrittenPhotoUrl && (
            <div className="mb-8 relative pt-4">
              <PaperClipSvg className="w-9 h-16 absolute -top-2 left-8 z-20 drop-shadow-sm pointer-events-none" />
              <div className="rounded-2xl bg-kraft/85 border-[1.5px] border-fir p-4 sm:p-5 shadow-card rotate-[-0.4deg]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pl-8">
                  <div>
                    <div className="font-fairytale font-bold text-xl text-fir">
                      Připnutý ručně psaný dopis na papíře
                    </div>
                    <p className="text-xs text-slate-text-muted">
                      Pod tuto fotku níže připiš seznam dárků v bodech, aby si je babičky a rodina
                      mohly tajně zamluvit.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPhotoPreviewOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-sheet border border-fir/30 text-xs font-bold text-fir hover:bg-fir-soft transition"
                    >
                      Zvětšit fotku
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveHandwrittenPhoto}
                      className="px-3 py-1.5 rounded-xl bg-sheet border border-crimson/30 text-xs font-bold text-crimson hover:bg-crimson-soft transition"
                    >
                      Odebrat
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPhotoPreviewOpen(true)}
                  className="block w-full overflow-hidden rounded-xl border border-fir/30 bg-sheet shadow-inner"
                >
                  <img
                    src={draft.handwrittenPhotoUrl}
                    alt={`Ručně psaný dopis — ${draft.recipientName}`}
                    className="max-h-[340px] w-full object-contain mx-auto"
                  />
                </button>
              </div>
            </div>
          )}

          {/* Celistvý linkovaný dopisní arch psaný rukopisem Caveat */}
          <div className="lined-letter-paper rounded-2xl px-3 sm:px-6 py-4 space-y-6">
            {/* 1. ÚVOD */}
            <div>
              <h1 className="font-handwritten text-4xl sm:text-5xl font-bold text-fir leading-none mb-3">
                Milý Ježíšku,
              </h1>
              <label htmlFor="letter-intro-input" className="sr-only">
                Úvod dopisu Ježíškovi
              </label>
              <textarea
                id="letter-intro-input"
                ref={introRef}
                rows={3}
                value={draft.introText}
                onChange={(e) => handleTextChange('introText', e.target.value, e.target)}
                placeholder="letos jsem se moc snažil/a a pod stromečkem by mi udělalo největší radost..."
                className="w-full border-0 bg-transparent p-0 font-handwritten text-2xl sm:text-[29px] text-slate-text placeholder:text-slate-text-muted/50 leading-[38px] focus:outline-none focus:ring-0 resize-none overflow-hidden"
              />
            </div>

            {/* 2. MOJE PŘÁNÍ (SEZNAM PŘÍMO NA PAPÍŘE) */}
            <div className="space-y-2 pt-2">
              <div className="font-handwritten font-bold text-2xl sm:text-3xl text-crimson">
                Moje přání pod stromeček:
              </div>

              {wishes.length > 0 && (
                <ul className="space-y-1">
                  {wishes.map((wish) => (
                    <WishLetterLineItem
                      key={wish.id}
                      wish={wish}
                      isNewlyAdded={newlyAddedWishId === wish.id}
                      onEdit={handleEditWishClick}
                      onRemove={handleRemoveWish}
                    />
                  ))}
                </ul>
              )}

              {/* Přirozený klikací řádek přímo na papíře */}
              <button
                type="button"
                onClick={() => {
                  setEditingWish(null);
                  setWishModalOpen(true);
                }}
                className="w-full text-left py-2.5 px-3 rounded-xl border border-dashed border-gold/70 hover:border-fir hover:bg-fir-soft/60 transition flex items-center gap-2.5 group"
              >
                <Plus className="w-5 h-5 text-crimson group-hover:scale-110 transition shrink-0" />
                <span className="font-handwritten font-bold text-2xl sm:text-[28px] text-crimson group-hover:text-fir">
                  Připsat další přání...
                </span>
              </button>
            </div>

            {/* 3. ZÁVĚR (ROZLOUČENÍ A PODPIS) */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex-1 min-w-0">
                <label htmlFor="letter-outro-input" className="sr-only">
                  Rozloučení a podpis
                </label>
                <textarea
                  id="letter-outro-input"
                  ref={outroRef}
                  rows={2}
                  value={draft.outroText}
                  onChange={(e) => handleTextChange('outroText', e.target.value, e.target)}
                  placeholder={`Moc děkuji a měj se krásně,\n${draft.recipientName || ''}`}
                  className="w-full border-0 bg-transparent p-0 font-handwritten text-2xl sm:text-[29px] text-slate-text placeholder:text-slate-text-muted/50 leading-[38px] focus:outline-none focus:ring-0 resize-none overflow-hidden"
                />
              </div>

              <div
                key={sealPulseKey}
                title="Vosková pečeť Ježíškovy pošty"
                className="self-end sm:self-auto shrink-0 select-none"
              >
                <WaxSealSvg
                  className="w-16 h-16 sm:w-20 sm:h-20"
                  pressed={sealPulseKey > 0}
                />
              </div>
            </div>
          </div>

          {/* Fyzický rituál odeslání (Kapřík + tlačítko Zapečetit a poslat Ježíškovi) */}
          <div className="mt-8 pt-6 border-t border-gold/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <KaprikGuide
              pose="dopis"
              size="compact"
              bubbleDirection="left"
              className="flex-1 w-full"
              message={
                draft.sealedAt ? (
                  <>
                    <strong className="text-fir">Dopis je zapečetěný a u Ježíška!</strong> Kdykoliv
                    do něj můžeš připsat další přání a znovu ho přepečetit.
                  </>
                ) : (
                  <>
                    „Krásný dopis! Pojďme ho vložit do obálky, natisknout známku a poslat
                    Ježíškovi.“
                  </>
                )
              }
            />

            <button
              type="button"
              onClick={handleStartEnvelopeRitual}
              className="min-h-[52px] w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-crimson hover:bg-crimson-dark text-white text-base sm:text-lg font-bold shadow-md border border-gold/50 transition"
            >
              <Mail className="w-5 h-5 shrink-0" />
              <span>Zapečetit a poslat Ježíškovi</span>
            </button>
          </div>

          {draft.isChildLetter && isOwnerOfDraft && (
            <div className="mt-5 pt-3 flex justify-end">
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

      {/* Modální animace rituálu: Obálka, poštovní známka, vosková pečeť a odlet k Ježíškovi */}
      {ritualStage !== 'idle' &&
        createPortal(
          <div
            onMouseDown={() => {
              if (ritualStage === 'done') setRitualStage('idle');
            }}
            style={{ backgroundColor: 'rgba(24, 30, 27, 0.76)', zIndex: 9999 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in no-print"
          >
            <div className="w-full max-w-lg text-center space-y-6">
              {ritualStage !== 'done' ? (
                <div
                  className={`relative mx-auto w-full max-w-md pt-16 ${
                    ritualStage === 'flying' ? 'animate-envelope-fly-away' : ''
                  }`}
                >
                  {/* Skládající se dopisní papír zajíždějící do obálky */}
                  {ritualStage === 'folding' && (
                    <div className="animate-letter-into-envelope mx-auto w-4/5 rounded-2xl bg-sheet border-[1.5px] border-fir p-5 shadow-lg text-left">
                      <div className="font-handwritten text-2xl font-bold text-fir">
                        Milý Ježíšku,
                      </div>
                      <div className="mt-1 font-handwritten text-lg text-slate-text truncate">
                        {draft.introText || `Dopis od: ${draft.recipientName}`}
                      </div>
                    </div>
                  )}

                  {/* Kraftová obálka s poštovní známkou z profilu a červenou voskovou pečetí */}
                  <div className="kraft-envelope relative rounded-3xl p-6 sm:p-8 min-h-[250px] flex flex-col justify-between overflow-hidden">
                    <div
                      className="pointer-events-none absolute inset-2.5 rounded-2xl border border-gold/55"
                      aria-hidden="true"
                    />

                    {/* Horní řádek obálky: Poštovní razítko a uživatelova 3D známka v pravém horním rohu */}
                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <div className="text-left">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-fir/80">
                          Odesílatel
                        </div>
                        <div className="font-fairytale font-bold text-xl text-slate-text">
                          {draft.recipientName}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <TagPostalStampSvg className="w-20 h-10" />
                        {profile && (
                          <Avatar
                            avatarId={profile.avatarId}
                            avatarBg={profile.avatarBg}
                            size="md"
                          />
                        )}
                      </div>
                    </div>

                    {/* Střed obálky: Vosková pečeť s vyraženou hvězdou */}
                    <div className="relative z-20 my-2 flex justify-center">
                      {(ritualStage === 'sealing' || ritualStage === 'flying') && (
                        <WaxSealSvg className="w-20 h-20 sm:w-24 sm:h-24" pressed />
                      )}
                    </div>

                    {/* Adresát na obálce */}
                    <div className="relative z-10 text-right">
                      <div className="text-xs font-bold uppercase tracking-widest text-fir/80">
                        Adresát
                      </div>
                      <div className="font-handwritten font-bold text-3xl text-fir leading-tight">
                        Ježíškova pošta — Boží Dar
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="stationery-sheet rounded-3xl p-6 sm:p-8 max-w-md mx-auto space-y-5 animate-slide-up relative">
                  <div className="stationery-inner-frame" aria-hidden="true" />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-fir shadow-md bg-[#E8DEC8]">
                      <img
                        src="/assets/kaprik.png"
                        alt="Kapřík"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-fairytale font-bold text-3xl text-fir">
                      Dopis letí k Ježíškovi!
                    </h3>
                    <p className="text-base text-slate-text-muted leading-relaxed">
                      Obálka byla opatřena tvou poštovní známkou a zapečetěna červeným voskem.
                      Tvoji blízcí si teď mohou přání z dopisu tajně zamluvit.
                    </p>
                    <button
                      type="button"
                      onClick={() => setRitualStage('idle')}
                      className="min-h-[48px] w-full px-6 py-2.5 rounded-2xl bg-fir hover:bg-fir-hover text-white text-base font-bold shadow-sm transition"
                    >
                      Zpět k dopisu
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Náhled připnuté fotky ručního dopisu na celou obrazovku */}
      {photoPreviewOpen &&
        draft.handwrittenPhotoUrl &&
        createPortal(
          <div
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setPhotoPreviewOpen(false);
            }}
            style={{ backgroundColor: 'rgba(24, 26, 25, 0.8)', zIndex: 9999 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in no-print"
          >
            <div className="relative max-w-3xl w-full rounded-3xl bg-sheet border-2 border-fir p-4 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-fairytale font-bold text-2xl text-slate-text">
                  Ručně psaný dopis — {draft.recipientName}
                </h3>
                <button
                  type="button"
                  onClick={() => setPhotoPreviewOpen(false)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-paper"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto rounded-2xl border border-paper-warm bg-paper">
                <img
                  src={draft.handwrittenPhotoUrl}
                  alt="Ručně psaný dopis"
                  className="w-full h-auto object-contain mx-auto"
                />
              </div>
            </div>
          </div>,
          document.body
        )}

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
              style={{ backgroundColor: '#FFFDF8' }}
              className="w-full max-w-md rounded-2xl bg-[#FFFDF8] border-[1.5px] border-fir shadow-2xl p-6 animate-slide-up space-y-5 relative"
            >
              <div
                className="pointer-events-none absolute inset-2 rounded-xl border border-gold/40"
                aria-hidden="true"
              />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <h3 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text leading-tight">
                  Spravovat dopis společně
                </h3>
                <button
                  type="button"
                  onClick={() => setCoParentModalOpen(false)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-paper transition"
                  aria-label="Zavřít"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="relative z-10 text-sm sm:text-base text-slate-text-muted leading-relaxed">
                Vyber druhého rodiče, který bude moci dopis pro{' '}
                <strong className="text-slate-text">{draft.recipientName}</strong> také upravovat,
                přidávat do něj přání a tisknout ho. Ani jeden z vás neuvidí, kdo z rodiny dárky
                zamluvil.
              </p>

              <form onSubmit={handleSaveCoParents} className="relative z-10 space-y-4">
                {acceptedContacts.length === 0 ? (
                  <div className="p-4 rounded-xl bg-paper border border-paper-warm text-sm text-slate-text-muted space-y-2">
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
                          className={`min-h-[54px] flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                            checked
                              ? 'border-fir bg-fir-soft'
                              : 'border-paper-warm bg-paper hover:bg-kraft/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCoParentUid(uid)}
                            className="w-5 h-5 accent-[#1B4332] rounded cursor-pointer shrink-0"
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
                    className="min-h-[48px] px-5 py-2.5 rounded-xl border border-paper-warm bg-paper text-base font-semibold text-slate-text hover:bg-kraft transition"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    disabled={savingCoParents}
                    className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-fir hover:bg-fir-hover text-white text-base font-bold shadow-sm transition disabled:opacity-60"
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
        description="Smazáním dopisu zmizí všechna přání v něm uvedená."
        confirmLabel="Smazat dopis"
        onConfirm={handleDeleteCurrentLetter}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
