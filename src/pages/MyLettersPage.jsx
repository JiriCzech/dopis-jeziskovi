import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Camera,
  Check,
  Edit3,
  ExternalLink,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  Avatar,
  WaxSealSvg,
} from '../assets/avatars';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../hooks/useAppData';
import { WishFormModal } from '../components/WishFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

function autoResizeTextarea(el, minHeight = 108) {
  if (!el) return;
  el.style.height = 'auto';
  const rawHeight = Math.max(el.scrollHeight, minHeight);
  const snapped = Math.ceil(rawHeight / 36) * 36;
  el.style.height = `${snapped}px`;
}

/**
 * Komprese nahrané fotky ručně psaného dopisu na klientovi přes HTML5 canvas (cca 50 az 95 KB JPEG)
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
 * Čistý řádek přání na dopisním papíře s nenápadnými akcemi zarovnanými k pravému okraji
 */
const WishLetterLineItem = memo(function WishLetterLineItem({
  wish,
  isNewlyAdded,
  onEdit,
  onRemove,
}) {
  return (
    <li
      className={`group letter-wish-line py-2.5 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 ${
        isNewlyAdded ? 'animate-wish-enter bg-gold-soft/75' : ''
      }`}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="font-sans font-semibold text-base sm:text-[17px] text-slate-text leading-snug break-words">
          {wish.title}
        </div>

        {wish.note && (
          <p className="font-sans text-sm text-slate-text-muted leading-snug break-words">
            {wish.note}
          </p>
        )}

        {wish.url && (
          <div className="pt-0.5">
            <a
              href={wish.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Otevřít ukázku dárku"
              className="min-h-[36px] inline-flex items-center gap-1 font-sans text-xs sm:text-sm font-semibold text-fir hover:text-fir-dark hover:underline transition"
            >
              <span>Ukázka dárku</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        )}
      </div>

      {/* Ztlumené akce zarovnané čistě k pravému okraji řádku (min. 44×44 px) */}
      <div className="ml-auto flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(wish)}
          title="Upravit přání"
          aria-label={`Upravit přání ${wish.title}`}
          className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 font-sans text-xs sm:text-sm font-medium text-[#525E58]/70 sm:opacity-70 group-hover:opacity-100 hover:opacity-100 hover:text-fir hover:bg-fir-soft/65 transition"
        >
          <Edit3 className="w-3.5 h-3.5 shrink-0" />
          <span>Upravit</span>
        </button>
        <button
          type="button"
          onClick={() => onRemove(wish.id)}
          title="Smazat přání"
          aria-label={`Smazat přání ${wish.title}`}
          className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 font-sans text-xs sm:text-sm font-medium text-[#525E58]/70 sm:opacity-70 group-hover:opacity-100 hover:opacity-100 hover:text-crimson hover:bg-crimson-soft/75 transition"
        >
          <Trash2 className="w-3.5 h-3.5 shrink-0" />
          <span>Smazat</span>
        </button>
      </div>
    </li>
  );
});

export function MyLettersPage() {
  const {
    authUser,
    profile,
    notify,
    showUndoToast,
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
  const [newlyAddedWishId, setNewlyAddedWishId] = useState(null);
  const [draft, setDraft] = useState(null);

  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [editingWish, setEditingWish] = useState(null);

  const [coParentModalOpen, setCoParentModalOpen] = useState(false);
  const [selectedCoParentUids, setSelectedCoParentUids] = useState([]);
  const [savingCoParents, setSavingCoParents] = useState(false);

  const [newChildOpen, setNewChildOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildError, setNewChildError] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [photoTextOpenMap, setPhotoTextOpenMap] = useState({});

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
    autoResizeTextarea(introRef.current, 108);
    autoResizeTextarea(outroRef.current, 72);
  }, [draft?.id, draft?.introText, draft?.outroText, draft?.handwrittenPhotoUrl, photoTextOpenMap]);

  const persistLetterImmediate = useCallback(
    async (letterToSave) => {
      if (!letterToSave) return null;
      setSaveState('saving');
      try {
        const saved = await optimisticSaveMyLetter(letterToSave);
        setSaveState('saved');
        return saved;
      } catch (err) {
        console.error('[MyLettersPage] Chyba ukládání dopisu/přání do Firestore:', {
          path: `letters/${letterToSave.id}`,
          code: err?.code || 'unknown',
          message: err?.message || String(err),
          wishCount: (letterToSave.wishes || []).length,
          payload: letterToSave,
        });
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
    if (textareaEl) autoResizeTextarea(textareaEl, field === 'outroText' ? 72 : 108);
    setDraft((prev) => {
      const next = {
        ...prev,
        [field]: value,
        updatedAt: Date.now(),
      };
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
      const nextDraft = {
        ...draft,
        handwrittenPhotoUrl: compressedDataUrl,
        updatedAt: Date.now(),
      };
      setDraft(nextDraft);
      await persistLetterImmediate(nextDraft);
      notify('Fotka ručně psaného dopisu byla připnuta.');
    } catch (err) {
      notify(err.message || 'Fotku dopisu se nepodařilo nahrát.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemoveHandwrittenPhoto = async () => {
    if (!draft) return;
    const nextDraft = {
      ...draft,
      handwrittenPhotoUrl: '',
      updatedAt: Date.now(),
    };
    setDraft(nextDraft);
    await persistLetterImmediate(nextDraft);
    notify('Fotka papírového dopisu byla odebrána.');
  };

  // Uložení nového nebo upraveného přání z čistého kompletního formuláře
  const handleSaveWish = useCallback(
    async (wishData) => {
      const curr = latestDraftRef.current;
      if (!curr) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      const currentWishes = curr.wishes || [];
      const now = Date.now();
      let updatedWishes;

      if (wishData.id) {
        updatedWishes = currentWishes.map((w) => (w.id === wishData.id ? wishData : w));
      } else {
        const createdId = `wish-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        updatedWishes = [
          ...currentWishes,
          {
            ...wishData,
            id: createdId,
            createdAt: now,
          },
        ];
        setNewlyAddedWishId(createdId);
        setTimeout(() => {
          setNewlyAddedWishId((id) => (id === createdId ? null : id));
        }, 900);
      }

      const nextDraft = {
        ...curr,
        wishes: updatedWishes,
        updatedAt: now,
      };

      setDraft(nextDraft);
      setWishModalOpen(false);
      setEditingWish(null);

      const saved = await persistLetterImmediate(nextDraft);
      if (!saved) {
        setDraft(curr);
      }
    },
    [persistLetterImmediate]
  );

  const handleEditWishClick = useCallback((wish) => {
    setEditingWish(wish);
    setWishModalOpen(true);
  }, []);

  // Okamžité smazání přání + 6s kompaktní notifikace Zpět
  const handleRemoveWish = useCallback(
    async (wishId) => {
      const curr = latestDraftRef.current;
      if (!curr) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const currentWishes = curr.wishes || [];
      const removedIndex = currentWishes.findIndex((w) => w.id === wishId);
      if (removedIndex === -1) return;
      const removedWish = currentWishes[removedIndex];

      const updatedWishes = currentWishes.filter((w) => w.id !== wishId);
      const nextDraft = {
        ...curr,
        wishes: updatedWishes,
        updatedAt: Date.now(),
      };
      setDraft(nextDraft);

      const saved = await persistLetterImmediate(nextDraft);
      if (!saved) {
        setDraft(curr);
        return;
      }

      showUndoToast({
        message: 'Přání smazáno',
        duration: 6000,
        onUndo: async () => {
          const latest = latestDraftRef.current || nextDraft;
          const latestWishes = latest.wishes || [];
          if (latestWishes.some((w) => w.id === removedWish.id)) return;
          const restoredWishes = [...latestWishes];
          restoredWishes.splice(Math.min(removedIndex, restoredWishes.length), 0, removedWish);
          const restoredDraft = {
            ...latest,
            wishes: restoredWishes,
            updatedAt: Date.now(),
          };
          setDraft(restoredDraft);
          const restored = await persistLetterImmediate(restoredDraft);
          if (!restored) {
            setDraft(latest);
          } else {
            notify('Přání vráceno zpět.');
          }
        },
      });
    },
    [persistLetterImmediate, showUndoToast, notify]
  );

  const handleCreateChildLetter = async (e) => {
    e.preventDefault();
    const cleaned = newChildName.trim();
    if (!cleaned || !authUser) {
      setNewChildError('Napiš prosím jméno dítěte.');
      return;
    }
    setNewChildError('');
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
  const hasPhoto = Boolean(draft.handwrittenPhotoUrl);
  const hasDigitalText = Boolean((draft.introText || '').trim() || (draft.outroText || '').trim());
  const showDigitalText =
    !hasPhoto ||
    (photoTextOpenMap[draft.id] !== undefined ? photoTextOpenMap[draft.id] : hasDigitalText);

  return (
    <div className="space-y-4 sm:space-y-5 animate-page-transition min-w-0">
      {/* Skrytý input pro nahrání fotky ručně psaného dopisu */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUploadChange}
        className="hidden"
      />

      {/* Čistá horní lišta: přepínač dopisů nalevo + vedlejší akce vpravo */}
      <div className="no-print space-y-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          <div className="flex items-center gap-2 overflow-x-auto flex-nowrap no-scrollbar pb-0.5 md:pb-0 min-w-0">
            {myLetters.map((l) => {
              const active = l.id === activeLetterId;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => selectLetter(l)}
                  className={`min-h-[44px] whitespace-nowrap shrink-0 px-4 py-2 rounded-xl text-sm sm:text-base font-bold transition border ${
                    active
                      ? 'bg-fir text-white border-fir shadow-xs'
                      : 'bg-sheet text-slate-text border-paper-warm hover:bg-fir-soft/75'
                  }`}
                >
                  {l.isChildLetter ? l.recipientName : 'Můj dopis'}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setNewChildError('');
                setNewChildOpen((prev) => !prev);
              }}
              className="min-h-[44px] whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-dashed border-fir/65 text-fir bg-sheet/85 hover:bg-fir-soft text-sm sm:text-base font-bold transition"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Napsat za dítě</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sheet border border-paper-warm hover:bg-kraft/60 text-sm font-semibold text-fir transition disabled:opacity-60"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>
                {uploadingPhoto
                  ? 'Připínám...'
                  : hasPhoto
                    ? 'Změnit fotku'
                    : 'Nahrát fotku'}
              </span>
            </button>

            {draft.isChildLetter && isOwnerOfDraft && (
              <button
                type="button"
                onClick={openCoParentModal}
                className="min-h-[44px] whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sheet border border-paper-warm hover:bg-fir-soft/80 text-sm font-semibold text-fir transition"
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Spravovat společně</span>
                <span className="lg:hidden">Společně</span>
              </button>
            )}
          </div>
        </div>

        {/* Štítek společné správy dětského dopisu mimo samotný dopisní papír */}
        {draft.isChildLetter && coParentPartnerNames.length > 0 && (
          <div className="flex items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fir-soft/90 border border-fir/25 text-fir text-xs sm:text-sm font-semibold">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Spravujete společně s: {coParentPartnerNames.join(', ')}</span>
            </span>
          </div>
        )}
      </div>

      {/* Formulář pro přidání dětského dopisu */}
      {newChildOpen && (
        <form
          onSubmit={handleCreateChildLetter}
          className="no-print rounded-2xl bg-sheet border border-paper-warm p-5 shadow-card space-y-3 animate-slide-up"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
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
                onChange={(e) => {
                  setNewChildName(e.target.value);
                  if (newChildError) setNewChildError('');
                }}
                placeholder="Např. Julinka, Šárinka, Matýsek..."
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-paper-warm bg-paper text-base text-slate-text focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewChildOpen(false);
                  setNewChildName('');
                  setNewChildError('');
                }}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-paper-warm bg-paper text-base font-semibold text-slate-text hover:bg-kraft transition"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="min-h-[48px] px-5 py-2.5 rounded-xl bg-fir hover:bg-fir-hover text-white text-base font-bold transition"
              >
                Založit dopis
              </button>
            </div>
          </div>
          {newChildError && (
            <p className="text-sm font-semibold text-crimson bg-crimson-soft px-3.5 py-2 rounded-xl">
              {newChildError}
            </p>
          )}
        </form>
      )}

      {/* Jeden čistý hmatatelný dopisní list */}
      <article
        key={draft.id}
        className="print-sheet relative rounded-2xl handmade-letter-paper p-5 sm:p-10 md:px-12 md:py-10 animate-page-transition"
      >
        {/* Jemná smrková větvička v pravém horním rohu papíru */}
        <img
          src="/assets/vetvicka-3d.png"
          alt=""
          draggable={false}
          aria-hidden="true"
          className="print:hidden no-print w-24 sm:w-32 h-auto absolute top-2 right-3 sm:top-3 sm:right-4 pointer-events-none select-none z-20 drop-shadow-[0_4px_10px_rgba(27,67,50,0.16)]"
        />

        <div className="relative z-10 space-y-6">
          {/* Připnutá papírová fotografie ručně psaného dopisu se 3D mosaznou sponkou */}
          {draft.handwrittenPhotoUrl && (
            <div className="relative pt-5 max-w-md mx-auto">
              <img
                src="/assets/sponka-3d.png"
                alt=""
                draggable={false}
                aria-hidden="true"
                className="print:hidden no-print w-9 h-14 sm:w-10 sm:h-16 absolute -top-2 left-8 z-30 pointer-events-none select-none drop-shadow-[0_5px_10px_rgba(30,24,14,0.25)]"
              />
              <div className="bg-[#FFFDF8] p-3 pb-3.5 rounded-xl shadow-card border border-[#E2D6BE]">
                <button
                  type="button"
                  onClick={() => setPhotoPreviewOpen(true)}
                  className="block w-full overflow-hidden rounded-lg bg-paper"
                >
                  <img
                    src={draft.handwrittenPhotoUrl}
                    alt={`Ručně psaný dopis (${draft.recipientName})`}
                    className="max-h-[300px] w-full object-contain mx-auto"
                  />
                </button>
                <div className="no-print mt-2.5 flex items-center justify-between gap-2 px-1">
                  <span className="font-fairytale font-bold text-lg text-slate-text">
                    Ručně psaný dopis ({draft.recipientName})
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPhotoPreviewOpen(true)}
                      className="min-h-[44px] px-3 rounded-xl text-sm font-bold text-fir hover:bg-fir-soft transition"
                    >
                      Zvětšit
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveHandwrittenPhoto}
                      className="min-h-[44px] px-3 rounded-xl text-sm font-bold text-crimson hover:bg-crimson-soft transition"
                    >
                      Odebrat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1. ÚVOD (Caveat vyhrazený pro osobní dopis) */}
          {showDigitalText && (
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2 pr-20 sm:pr-28">
                <h1 className="font-handwritten text-4xl sm:text-5xl font-bold text-fir leading-none">
                  Milý Ježíšku,
                </h1>
                {hasPhoto && (
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoTextOpenMap((prev) => ({ ...prev, [draft.id]: false }))
                    }
                    className="no-print min-h-[44px] px-2 font-sans text-sm font-semibold text-slate-text-muted hover:text-fir underline underline-offset-2 shrink-0 transition"
                  >
                    Skrýt textový vzkaz
                  </button>
                )}
              </div>
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
                className="lined-letter-paper w-full border-0 bg-transparent p-0 font-handwritten text-[24px] sm:text-[26px] text-[#1E2421] placeholder:text-[#4A544E]/60 leading-[36px] focus:outline-none focus:ring-0 resize-none overflow-hidden"
              />
            </div>
          )}

          {/* 2. SEZNAM PŘÁNÍ (ostrý Plus Jakarta Sans + čisté tlačítko + Přidat přání) */}
          <section className="space-y-3 pt-1">
            <h2 className="font-fairytale font-bold text-2xl sm:text-[26px] text-crimson leading-tight">
              Moje přání pod stromeček:
            </h2>

            {wishes.length > 0 && (
              <ul className="divide-y divide-[#8B7355]/20">
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

            <div className="no-print pt-1">
              <button
                type="button"
                onClick={() => {
                  setEditingWish(null);
                  setWishModalOpen(true);
                }}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFFDF8]/85 hover:bg-[#FFFDF8] border border-[#D5C4A6] text-fir hover:text-fir-dark font-sans text-sm sm:text-base font-bold shadow-2xs transition"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Přidat přání</span>
              </button>
            </div>

            {!showDigitalText && (
              <div className="no-print pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoTextOpenMap((prev) => ({ ...prev, [draft.id]: true }));
                    setTimeout(() => introRef.current?.focus(), 60);
                  }}
                  className="min-h-[44px] px-2 -ml-2 rounded-xl font-sans text-sm font-semibold text-fir hover:bg-fir-soft/60 hover:underline transition"
                >
                  + Připsat k fotce textový vzkaz
                </button>
              </div>
            )}
          </section>

          {/* 3. ZÁVĚR (ROZLOUČENÍ, PODPIS A KLIDNÝ STAV ULOŽENO ✓) */}
          <div className="pt-3 border-t border-[#8B7355]/20 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {showDigitalText ? (
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
                  className="lined-letter-paper w-full border-0 bg-transparent p-0 font-handwritten text-[24px] sm:text-[26px] text-[#1E2421] placeholder:text-[#4A544E]/60 leading-[36px] focus:outline-none focus:ring-0 resize-none overflow-hidden"
                />
              </div>
            ) : (
              <div className="flex-1 min-w-0 font-handwritten text-[26px] sm:text-[28px] text-[#1E2421] leading-snug">
                {draft.recipientName}
              </div>
            )}

            <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0 select-none">
              <WaxSealSvg className="w-12 h-12 sm:w-14 sm:h-14" />
              <div
                className="no-print font-sans text-sm font-semibold text-fir"
                aria-live="polite"
              >
                {saveState === 'saving' ? 'Ukládám…' : 'Uloženo ✓'}
              </div>
            </div>
          </div>

          {draft.isChildLetter && isOwnerOfDraft && (
            <div className="no-print pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-xl font-sans text-sm font-semibold text-slate-text-muted hover:text-crimson hover:bg-crimson-soft transition"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>Smazat dopis pro {draft.recipientName}</span>
              </button>
            </div>
          )}
        </div>
      </article>

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
            <div className="relative max-w-3xl w-full rounded-2xl bg-sheet border border-paper-warm p-4 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-fairytale font-bold text-2xl text-slate-text">
                  Ručně psaný dopis ({draft.recipientName})
                </h3>
                <button
                  type="button"
                  onClick={() => setPhotoPreviewOpen(false)}
                  className="min-w-[44px] min-h-[44px] -mr-1.5 rounded-xl flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-paper transition"
                  aria-label="Zavřít náhled fotky"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto rounded-xl border border-paper-warm bg-paper">
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
              className="w-full max-w-md rounded-2xl bg-[#FFFDF8] border border-paper-warm shadow-2xl p-6 animate-slide-up space-y-5 relative"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text leading-tight">
                  Spravovat společně
                </h3>
                <button
                  type="button"
                  onClick={() => setCoParentModalOpen(false)}
                  className="min-w-[44px] min-h-[44px] -mr-1.5 rounded-xl flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-paper transition"
                  aria-label="Zavřít"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCoParents} className="space-y-4">
                {acceptedContacts.length === 0 ? (
                  <div className="p-4 rounded-xl bg-paper border border-paper-warm text-sm text-slate-text-muted space-y-2">
                    <p>Zatím nemáš žádného propojeného blízkého.</p>
                    <Link
                      to="/sdileni"
                      onClick={() => setCoParentModalOpen(false)}
                      className="min-h-[44px] inline-flex items-center font-bold text-fir underline"
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
