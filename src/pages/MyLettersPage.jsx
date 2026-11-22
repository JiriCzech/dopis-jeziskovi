import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Camera,
  Check,
  Edit3,
  Loader2,
  Mail,
  Plus,
  Printer,
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
import { PrintPreviewModal } from '../components/PrintPreviewModal';
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
 * Jednotlivý řádek přání přímo na linkovaném dopisním papíře (žádné těžké boxy)
 */
const WishLetterLineItem = memo(function WishLetterLineItem({
  wish,
  index,
  isNewlyAdded,
  onEdit,
  onRemove,
}) {
  const giftSrc = `/assets/darek-${(index % 3) + 1}-3d.png`;

  return (
    <li
      className={`letter-wish-line py-2.5 px-1.5 sm:px-2.5 rounded-xl flex items-start justify-between gap-3 ${
        isNewlyAdded ? 'animate-wish-enter bg-gold-soft/75 ring-1 ring-gold' : ''
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <img
          src={giftSrc}
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
  const [photoTextOpenMap, setPhotoTextOpenMap] = useState({});

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

  useEffect(() => {
    if (!draft) return;
    const isModifiedAfterSeal = Boolean(draft.sealedAt && (draft.updatedAt || 0) > draft.sealedAt);
    const isCleanlySealed = Boolean(draft.sealedAt && !isModifiedAfterSeal);
    window.dispatchEvent(
      new CustomEvent('kaprik:letter-state', {
        detail: {
          isSealed: isCleanlySealed,
          justSealed: ritualStage === 'sealing' || ritualStage === 'done',
          modalOpen: ritualStage !== 'idle',
        },
      })
    );
  }, [draft?.id, draft?.sealedAt, draft?.updatedAt, ritualStage]);

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
    if (textareaEl) autoResizeTextarea(textareaEl, field === 'outroText' ? 72 : 108);
    setDraft((prev) => {
      const now = Date.now();
      const next = {
        ...prev,
        [field]: value,
        updatedAt: prev.sealedAt ? Math.max(now, prev.sealedAt + 1) : now,
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
      const now = Date.now();
      const nextDraft = {
        ...draft,
        handwrittenPhotoUrl: compressedDataUrl,
        updatedAt: draft.sealedAt ? Math.max(now, draft.sealedAt + 1) : now,
      };
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
    const now = Date.now();
    const nextDraft = {
      ...draft,
      handwrittenPhotoUrl: '',
      updatedAt: draft.sealedAt ? Math.max(now, draft.sealedAt + 1) : now,
    };
    setDraft(nextDraft);
    await persistLetterImmediate(nextDraft);
    notify('Fotka papírového dopisu byla odebrána.');
  };

  const handleStartEnvelopeRitual = async (replayOnly = false) => {
    const curr = latestDraftRef.current;
    if (!curr || ritualStage !== 'idle') return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setRitualStage('folding');
    if (!replayOnly) {
      const now = Date.now();
      const nextDraft = { ...curr, sealedAt: now, updatedAt: now };
      setDraft(nextDraft);
      persistLetterImmediate({ ...curr, _justSealed: true });
    }

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
      const now = Date.now();
      const nextDraft = {
        ...curr,
        wishes: updatedWishes,
        updatedAt: curr.sealedAt ? Math.max(now, curr.sealedAt + 1) : now,
      };
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
      const now = Date.now();
      const updatedWishes = (curr.wishes || []).filter((w) => w.id !== wishId);
      const nextDraft = {
        ...curr,
        wishes: updatedWishes,
        updatedAt: curr.sealedAt ? Math.max(now, curr.sealedAt + 1) : now,
      };
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
    const isModifiedAfterSeal = Boolean(draft.sealedAt && (draft.updatedAt || 0) > draft.sealedAt);
    const updated = { ...draft, printTheme: nextTheme };
    setDraft(updated);
    await persistLetterImmediate({ ...updated, _preserveSealClean: !isModifiedAfterSeal });
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
      const isModifiedAfterSeal = Boolean(draft.sealedAt && (draft.updatedAt || 0) > draft.sealedAt);
      const nextDraft = {
        ...draft,
        coParentUids: selectedCoParentUids,
      };
      setDraft(nextDraft);
      setCoParentModalOpen(false);
      await persistLetterImmediate({ ...nextDraft, _preserveSealClean: !isModifiedAfterSeal });
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

  const hasBeenSealed = Boolean(draft.sealedAt);
  const isModifiedAfterSeal = Boolean(draft.sealedAt && (draft.updatedAt || 0) > draft.sealedAt);
  const isSealedClean = hasBeenSealed && !isModifiedAfterSeal && saveState !== 'saving';

  return (
    <div className="space-y-3 sm:space-y-5 animate-page-transition min-w-0">
      {/* Skrytý input pro nahrání fotky ručně psaného dopisu */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUploadChange}
        className="hidden"
      />

      {/* Kompaktní horní lišta: přepínač dopisů nalevo + odlehčené akce vpravo (desktop 1 řada, mobil 2 kompaktní řádky) */}
      <div className="no-print max-w-[780px] mx-auto space-y-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap no-scrollbar pb-0.5 md:pb-0 min-w-0">
            {myLetters.map((l) => {
              const active = l.id === activeLetterId;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => selectLetter(l)}
                  className={`min-h-[40px] sm:min-h-[42px] whitespace-nowrap shrink-0 px-3.5 sm:px-4 py-1.5 rounded-xl sm:rounded-2xl text-sm sm:text-[15px] font-bold transition border-[1.5px] ${
                    active
                      ? 'bg-fir text-white border-fir shadow-xs'
                      : 'bg-sheet text-slate-text border-fir/35 hover:bg-fir-soft'
                  }`}
                >
                  {l.isChildLetter ? l.recipientName : 'Můj dopis'}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setNewChildOpen(true)}
              className="min-h-[40px] sm:min-h-[42px] whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl sm:rounded-2xl border-[1.5px] border-dashed border-fir/70 text-fir bg-sheet/80 hover:bg-fir-soft text-sm sm:text-[15px] font-bold transition"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Napsat za dítě</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-1.5 shrink-0 flex-wrap">
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[36px] sm:min-h-[38px] whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-kraft/60 hover:bg-kraft border border-fir/25 text-xs sm:text-[13px] font-semibold text-fir transition disabled:opacity-60"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {uploadingPhoto
                  ? 'Připínám...'
                  : hasPhoto
                    ? 'Změnit fotku'
                    : 'Nahrát fotku'}
              </span>
              <span className="sm:hidden">
                {uploadingPhoto
                  ? 'Připínám...'
                  : hasPhoto
                    ? 'Změnit fotku'
                    : 'Fotka dopisu'}
              </span>
            </button>

            {draft.isChildLetter && isOwnerOfDraft && (
              <button
                type="button"
                onClick={openCoParentModal}
                className="min-h-[36px] sm:min-h-[38px] whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-fir-soft/80 border border-fir/20 text-xs sm:text-[13px] font-semibold text-fir transition"
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">Spravovat společně</span>
                <span className="lg:hidden">Společně</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setPrintOpen(true)}
              className="min-h-[36px] sm:min-h-[38px] whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-fir-soft/80 border border-fir/20 text-xs sm:text-[13px] font-semibold text-fir transition"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Vytisknout</span>
              <span className="sm:hidden">Tisk</span>
            </button>
          </div>
        </div>

        {/* Štítek společné správy dětského dopisu mimo samotný dopisní papír */}
        {draft.isChildLetter && coParentPartnerNames.length > 0 && (
          <div className="flex items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fir-soft/90 border border-fir/25 text-fir text-xs font-semibold">
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
          className="no-print max-w-[780px] mx-auto rounded-3xl bg-sheet border-[1.5px] border-fir p-5 shadow-soft flex flex-col sm:flex-row items-stretch sm:items-end gap-3 animate-slide-up"
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

      {/* Hmatatelný blok ručních dopisních papírů (2 pootočené spodní archy + hlavní list s organickými okraji) */}
      <div className="relative max-w-[780px] mx-auto my-2">
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

        <article
          key={draft.id}
          className="print-sheet relative p-6 sm:p-12 md:px-14 md:py-12 animate-page-transition"
        >
          {/* Organický okraj a textura aplikované jen na vrstvu papíru, aby text zůstal dokonale ostrý */}
          <div
            aria-hidden="true"
            style={{ filter: 'url(#handmade-paper-edge)' }}
            className="print:hidden no-print absolute inset-0 rounded-[20px] handmade-letter-paper pointer-events-none"
          />

          {/* 3D smrková větvička se šiškou a zvonečkem v pravém horním rohu papíru */}
          <img
            src="/assets/vetvicka-3d.png"
            alt=""
            draggable={false}
            aria-hidden="true"
            className="print:hidden no-print w-28 sm:w-36 h-auto absolute top-2 right-3 sm:top-3 sm:right-5 pointer-events-none select-none z-20 drop-shadow-[0_6px_12px_rgba(27,67,50,0.18)]"
          />

          <div className="relative z-10">
            {/* Připnutá papírová fotografie ručně psaného dopisu se 3D mosaznou sponkou */}
            {draft.handwrittenPhotoUrl && (
              <div className="mb-8 relative pt-5 max-w-md mx-auto">
                <img
                  src="/assets/sponka-3d.png"
                  alt=""
                  draggable={false}
                  aria-hidden="true"
                  className="print:hidden no-print w-10 h-16 sm:w-11 sm:h-18 absolute -top-2 left-8 z-30 pointer-events-none select-none drop-shadow-[0_5px_10px_rgba(30,24,14,0.28)]"
                />
                <div className="-rotate-1 bg-[#FFFDF8] p-3 pb-4 rounded-xl shadow-[0_12px_28px_rgba(30,36,33,0.16)] border border-[#E2D6BE]">
                  <button
                    type="button"
                    onClick={() => setPhotoPreviewOpen(true)}
                    className="block w-full overflow-hidden rounded-lg bg-paper"
                  >
                    <img
                      src={draft.handwrittenPhotoUrl}
                      alt={`Ručně psaný dopis (${draft.recipientName})`}
                      className="max-h-[320px] w-full object-contain mx-auto"
                    />
                  </button>
                  <div className="no-print mt-2.5 flex items-center justify-between gap-2 px-1">
                    <span className="font-handwritten text-xl text-slate-text-muted">
                      Ručně psaný dopis ({draft.recipientName})
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPhotoPreviewOpen(true)}
                        className="text-xs font-bold text-fir hover:underline"
                      >
                        Zvětšit
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveHandwrittenPhoto}
                        className="text-xs font-bold text-crimson hover:underline"
                      >
                        Odebrat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Jednolitý tok psaní na ručním papíře */}
            <div className="py-1 space-y-6">
              {/* 1. ÚVOD (sbalitelný pokud je nahraná fotka papírového dopisu) */}
              {showDigitalText && (
                <div>
                  <div className="flex items-baseline justify-between gap-3 mb-3 pr-24 sm:pr-32">
                    <h1 className="font-handwritten text-4xl sm:text-5xl font-bold text-fir leading-none">
                      Milý Ježíšku,
                    </h1>
                    {hasPhoto && (
                      <button
                        type="button"
                        onClick={() =>
                          setPhotoTextOpenMap((prev) => ({ ...prev, [draft.id]: false }))
                        }
                        className="no-print text-xs font-semibold text-slate-text-muted hover:text-fir underline underline-offset-2 shrink-0 transition"
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
                    className="lined-letter-paper w-full border-0 bg-transparent p-0 font-handwritten text-[24px] sm:text-[26px] text-[#1E2421] placeholder:text-[#4A544E]/50 leading-[36px] focus:outline-none focus:ring-0 resize-none overflow-hidden"
                  />
                </div>
              )}

              {/* 2. SEZNAM PŘÁNÍ UVNITŘ DOPISU */}
              <div className="space-y-2 pt-1">
                <div className="font-handwritten font-bold text-2xl sm:text-3xl text-crimson">
                  Moje přání pod stromeček:
                </div>

                {wishes.length > 0 && (
                  <ul className="space-y-0.5">
                    {wishes.map((wish, idx) => (
                      <WishLetterLineItem
                        key={wish.id}
                        wish={wish}
                        index={idx}
                        isNewlyAdded={newlyAddedWishId === wish.id}
                        onEdit={handleEditWishClick}
                        onRemove={handleRemoveWish}
                      />
                    ))}
                  </ul>
                )}

                {/* Klidné tlačítko přímo na řádku papíru */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingWish(null);
                    setWishModalOpen(true);
                  }}
                  className="no-print w-full text-left py-2 px-1.5 rounded-lg hover:bg-fir-soft/45 transition flex items-center gap-2 group"
                >
                  <Plus className="w-5 h-5 text-crimson group-hover:text-fir transition shrink-0" />
                  <span className="font-handwritten font-bold text-[24px] sm:text-[27px] text-crimson group-hover:text-fir">
                    Přidat přání
                  </span>
                </button>

                {/* Jemný odkaz pro připsání textového vzkazu k fotce papírového dopisu */}
                {!showDigitalText && (
                  <div className="no-print pt-1 px-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoTextOpenMap((prev) => ({ ...prev, [draft.id]: true }));
                        setTimeout(() => introRef.current?.focus(), 60);
                      }}
                      className="text-sm font-semibold text-fir/85 hover:text-fir underline underline-offset-2 transition"
                    >
                      {hasDigitalText
                        ? '+ Zobrazit textový vzkaz k fotce'
                        : '+ Připsat k fotce textový vzkaz'}
                    </button>
                  </div>
                )}
              </div>

              {/* 3. ZÁVĚR (ROZLOUČENÍ, PODPIS A 3D VOSKOVÁ PEČEŤ) */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
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
                      className="lined-letter-paper w-full border-0 bg-transparent p-0 font-handwritten text-[24px] sm:text-[26px] text-[#1E2421] placeholder:text-[#4A544E]/50 leading-[36px] focus:outline-none focus:ring-0 resize-none overflow-hidden"
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 font-handwritten text-[26px] sm:text-[28px] text-[#1E2421] leading-snug">
                    {draft.recipientName}
                  </div>
                )}

                <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                  <div
                    key={sealPulseKey}
                    title="Vosková pečeť Dopisu Ježíškovi"
                    className="print:hidden no-print"
                  >
                    <WaxSealSvg
                      className="w-16 h-16 sm:w-20 sm:h-20"
                      pressed={sealPulseKey > 0}
                    />
                  </div>
                  {!isSealedClean && (
                    <div
                      className="no-print inline-flex items-center gap-1 text-xs font-semibold text-fir/85"
                      aria-live="polite"
                    >
                      {saveState === 'saving' ? (
                        <>
                          <Loader2 className="w-3 h-3 text-gold animate-spin" />
                          <span>Ukládám...</span>
                        </>
                      ) : (
                        <span>Uloženo ✓</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Jednotný spodek dopisu: buď klidný zapečetěný stav nebo hlavní akční tlačítko */}
            <div className="no-print mt-8 pt-6 border-t border-[#8B7355]/25">
              {isSealedClean ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-base sm:text-lg font-bold text-fir">
                    <span className="w-6 h-6 rounded-full bg-fir text-white inline-flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span>Dopis je zapečetěný u Ježíška ✓</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartEnvelopeRitual(true)}
                    className="text-sm font-semibold text-fir/85 hover:text-fir underline underline-offset-4 transition"
                  >
                    Zobrazit obálku
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleStartEnvelopeRitual(false)}
                    className="min-h-[52px] w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-crimson hover:bg-crimson-dark text-white text-base sm:text-lg font-bold shadow-md border border-gold/50 transition"
                  >
                    <Mail className="w-5 h-5 shrink-0" />
                    <span>{hasBeenSealed ? 'Znovu zapečetit a poslat' : 'Zapečetit a poslat'}</span>
                  </button>
                </div>
              )}
            </div>

            {draft.isChildLetter && isOwnerOfDraft && (
              <div className="no-print mt-5 pt-3 flex justify-end">
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
      </div>

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
                  className={`relative mx-auto w-full max-w-md pt-12 ${
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

                  {/* 3D poštovní obálka s uživatelovou známkou v pravém horním rohu a 3D voskovou pečetí uprostřed klopy */}
                  <div className="relative px-7 py-6 sm:px-9 sm:py-7 min-h-[280px] sm:min-h-[300px] flex flex-col justify-between">
                    <img
                      src="/assets/obalka-3d.png"
                      alt=""
                      draggable={false}
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none drop-shadow-[0_22px_44px_rgba(20,16,12,0.38)]"
                    />

                    {/* Horní řádek obálky: známka v pravém horním rohu */}
                    <div className="relative z-10 flex items-start justify-end">
                      {profile && (
                        <Avatar
                          avatarId={profile.avatarId}
                          avatarBg={profile.avatarBg}
                          size="md"
                          onTag
                        />
                      )}
                    </div>

                    {/* Odesílatel v čisté ploše levého křídla obálky pod horní šikmou linkou */}
                    <div className="relative z-10 flex items-center justify-start -mt-6 pl-1 sm:pl-2">
                      <div className="text-left leading-tight">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-fir/80">
                          Odesílatel
                        </div>
                        <div className="font-fairytale font-bold text-xl sm:text-2xl text-slate-text mt-0.5">
                          {draft.recipientName}
                        </div>
                      </div>
                    </div>

                    {/* Střed obálky na klopě: 3D vosková pečeť s vyraženou hvězdou */}
                    <div className="relative z-20 -mt-10 mb-2 flex justify-center pointer-events-none">
                      {(ritualStage === 'sealing' || ritualStage === 'flying') && (
                        <WaxSealSvg className="w-20 h-20 sm:w-24 sm:h-24" pressed />
                      )}
                    </div>

                    {/* Adresát na spodní klopě obálky čistě zarovnaný nad celým textem */}
                    <div className="relative z-10 flex justify-center sm:justify-end pr-0 sm:pr-2">
                      <div className="inline-block text-center sm:text-left">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-fir/80">
                          Adresát
                        </div>
                        <div className="font-handwritten font-bold text-[22px] sm:text-[26px] text-fir leading-none mt-0.5 whitespace-nowrap">
                          DOPIS JEŽÍŠKOVI • 24. 12.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="stationery-sheet rounded-3xl p-6 sm:p-8 max-w-md mx-auto space-y-5 animate-slide-up relative">
                  <div className="stationery-inner-frame" aria-hidden="true" />
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <WaxSealSvg className="w-20 h-20" pressed />
                    <h3 className="font-fairytale font-bold text-3xl text-fir">
                      Dopis letí k Ježíškovi!
                    </h3>
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
                  Ručně psaný dopis ({draft.recipientName})
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
                  Spravovat společně
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
