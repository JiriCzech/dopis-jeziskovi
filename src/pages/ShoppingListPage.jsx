import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Check,
  Edit3,
  ExternalLink,
  Gift,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Avatar, getChildAvatar, WrappedPresentSvg } from '../assets/avatars';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../hooks/useAppData';
import { ConfirmDialog } from '../components/ConfirmDialog';

function formatForRecipient(rawName) {
  const name = (rawName || '').trim();
  if (!name) return 'Pro blízkého';

  const Inflections = {
    Dana: 'Pro Danu',
    Julinka: 'Pro Julinku',
    Šárinka: 'Pro Šárinku',
    Jirka: 'Pro Jirku',
    Tereza: 'Pro Terezu',
    Anička: 'Pro Aničku',
    Babička: 'Pro Babičku',
    'Babička Marie': 'Pro Babičku Marii',
    Marie: 'Pro Marii',
    Matýsek: 'Pro Matýska',
    Tomáš: 'Pro Tomáše',
  };
  if (Inflections[name]) return Inflections[name];

  if (name.endsWith('a') && !name.includes(' ')) {
    return `Pro ${name.slice(0, -1)}u`;
  }
  return `Pro: ${name}`;
}

const ShoppingItemRow = memo(function ShoppingItemRow({
  item,
  onToggleBought,
  onReleaseClaim,
  onEditIdea,
  onDeleteIdea,
}) {
  const titleText = item.kind === 'claim' ? item.wishTitleSnapshot : item.title;
  const noteText = item.kind === 'claim' ? item.wishNoteSnapshot : item.note;
  const urlLink = item.kind === 'claim' ? item.wishUrlSnapshot : item.url;

  return (
    <li
      className={`rounded-2xl bg-kraft/75 border-[1.5px] border-fir px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-150 ${
        item.isBought ? 'opacity-70 bg-paper' : 'shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
        {/* Jediné velké, vkusné zaškrtávací políčko */}
        <button
          type="button"
          onClick={() => onToggleBought(item)}
          aria-label={
            item.isBought
              ? `Odznačit dárek ${titleText}`
              : `Označit dárek ${titleText} jako zabalený`
          }
          className={`mt-1 w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition ${
            item.isBought
              ? 'bg-fir border-fir text-white shadow-xs'
              : 'bg-sheet border-fir/60 hover:border-fir'
          }`}
        >
          {item.isBought && <Check className="w-5 h-5 stroke-[3]" />}
        </button>

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleBought(item)}
              className={`text-left font-handwritten text-2xl sm:text-[28px] font-bold leading-snug break-words transition ${
                item.isBought
                  ? 'line-through decoration-slate-text-muted/60 text-slate-text-muted'
                  : 'text-slate-text'
              }`}
            >
              {titleText}
            </button>

            {item.kind === 'idea' && (
              <span className="px-2.5 py-0.5 rounded-full bg-gold-soft border border-gold/45 text-slate-text text-xs font-bold">
                Tajný nápad
              </span>
            )}
          </div>

          {noteText && (
            <p className="text-base italic text-slate-text-muted leading-snug break-words">
              {noteText}
            </p>
          )}

          {item.kind === 'claim' && item.orphanStatus === 'wish_deleted' && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-gold-soft border border-gold/50 text-slate-text text-sm font-semibold">
              <AlertTriangle className="w-4 h-4 text-gold shrink-0" />
              <span>Obdarovaný toto přání ze svého dopisu smazal</span>
            </div>
          )}
          {item.kind === 'claim' && item.orphanStatus === 'account_deleted' && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-crimson-soft border border-crimson/30 text-crimson text-sm font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Uživatel si zrušil účet, dopis už není dostupný</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {urlLink && (
              <a
                href={urlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-bold text-fir hover:underline"
              >
                <span>Ukázka</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            )}

            {item.kind === 'claim' ? (
              <button
                type="button"
                onClick={() => onReleaseClaim(item)}
                className="text-xs sm:text-sm font-medium text-slate-text-muted hover:text-crimson underline decoration-slate-text-muted/40 hover:decoration-crimson transition"
              >
                Uvolnit
              </button>
            ) : (
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEditIdea(item)}
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-text-muted hover:text-slate-text transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Upravit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteIdea(item)}
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-text-muted hover:text-crimson transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Smazat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3D ilustrace zabaleného dárku s indikátorem zabalení přímo u ilustrace */}
      <div
        onClick={() => onToggleBought(item)}
        className="cursor-pointer shrink-0 select-none flex flex-col items-center"
        title={
          item.isBought
            ? 'Dárek je kompletně připravený a zabalený'
            : 'Kliknutím označíš dárek jako připravený a zabalený'
        }
      >
        <WrappedPresentSvg
          seed={`${item.id}-${titleText}`}
          isBought={item.isBought}
          className={`w-16 h-16 sm:w-20 sm:h-20 transition-transform duration-200 ${
            item.isBought ? 'scale-105' : 'opacity-90 hover:scale-105'
          }`}
        />
        {item.isBought && (
          <span className="mt-0.5 px-2 py-0.5 rounded-full bg-fir text-white text-[10px] font-bold tracking-wide">
            Zabaleno
          </span>
        )}
      </div>
    </li>
  );
});

export function ShoppingListPage() {
  const { authUser, notify } = useAuth();
  const {
    shoppingClaims,
    privateIdeas,
    familyCards,
    optimisticToggleClaimBought,
    optimisticToggleIdeaBought,
    optimisticUnclaimWish,
    optimisticAddIdea,
    optimisticUpdateIdea,
    optimisticDeleteIdea,
  } = useAppData();

  const [ideaModalOpen, setIdeaModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [selectedPillName, setSelectedPillName] = useState('');
  const [isCustomPerson, setIsCustomPerson] = useState(false);
  const [customPersonName, setCustomPersonName] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [ideaError, setIdeaError] = useState('');
  const [submittingIdea, setSubmittingIdea] = useState(false);

  const [claimToRelease, setClaimToRelease] = useState(null);
  const [releasing, setReleasing] = useState(false);

  const familyRecipients = useMemo(() => {
    const seenNames = new Set();
    const pills = [];
    (familyCards || []).forEach((card) => {
      const name = (card.recipientName || '').trim();
      if (!name || seenNames.has(name.toLowerCase())) return;
      seenNames.add(name.toLowerCase());
      const childVisual = card.isChildLetter ? getChildAvatar(name) : null;
      pills.push({
        name,
        targetUid: card.ownerProfile?.uid || null,
        avatarId: childVisual ? childVisual.avatarId : card.ownerProfile?.avatarId || 'carp',
        avatarBg: childVisual ? childVisual.avatarBg : card.ownerProfile?.avatarBg || '#F5E6D3',
      });
    });
    return pills;
  }, [familyCards]);

  useEffect(() => {
    if (!ideaModalOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submittingIdea) {
        setIdeaModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ideaModalOpen, submittingIdea]);

  const handleToggleBought = useCallback(
    async (item) => {
      const nextVal = !item.isBought;
      try {
        if (item.kind === 'claim') {
          await optimisticToggleClaimBought(item.id, nextVal);
        } else {
          await optimisticToggleIdeaBought(item.id, nextVal);
        }
      } catch (err) {
        notify(err.message || 'Nepodařilo se změnit stav dárku.', 'error');
      }
    },
    [optimisticToggleClaimBought, optimisticToggleIdeaBought, notify]
  );

  const handleConfirmReleaseClaim = async () => {
    if (!claimToRelease) return;
    setReleasing(true);
    try {
      const target = claimToRelease;
      setClaimToRelease(null);
      await optimisticUnclaimWish(target.id);
      notify(
        target.orphanStatus === 'active'
          ? `„${target.wishTitleSnapshot}“ je zpět v dopise.`
          : 'Položka byla odebrána ze seznamu.'
      );
    } catch (err) {
      notify(err.message || 'Nepodařilo se uvolnit přání.', 'error');
    } finally {
      setReleasing(false);
    }
  };

  const handleDeleteIdea = useCallback(
    async (idea) => {
      try {
        await optimisticDeleteIdea(idea.id);
        notify('Tajný nápad byl smazán.');
      } catch (err) {
        notify(err.message || 'Smazání se nezdařilo.', 'error');
      }
    },
    [optimisticDeleteIdea, notify]
  );

  const openNewIdeaModal = () => {
    setEditingIdea(null);
    setIdeaError('');
    setTitle('');
    setUrl('');
    setNote('');
    if (familyRecipients.length > 0) {
      setSelectedPillName(familyRecipients[0].name);
      setIsCustomPerson(false);
      setCustomPersonName('');
    } else {
      setSelectedPillName('');
      setIsCustomPerson(true);
      setCustomPersonName('');
    }
    setIdeaModalOpen(true);
  };

  const openEditIdeaModal = useCallback(
    (idea) => {
      setEditingIdea(idea);
      setIdeaError('');
      setTitle(idea.title || '');
      setUrl(idea.url || '');
      setNote(idea.note || '');
      const matchingPill = familyRecipients.find(
        (r) => r.name.toLowerCase() === (idea.targetName || '').trim().toLowerCase()
      );
      if (matchingPill) {
        setSelectedPillName(matchingPill.name);
        setIsCustomPerson(false);
        setCustomPersonName('');
      } else {
        setSelectedPillName('');
        setIsCustomPerson(true);
        setCustomPersonName(idea.targetName || '');
      }
      setIdeaModalOpen(true);
    },
    [familyRecipients]
  );

  const handleSaveIdea = async (e) => {
    e.preventDefault();
    if (!authUser) return;

    const resolvedRecipient = isCustomPerson
      ? customPersonName.trim()
      : selectedPillName.trim();

    if (!resolvedRecipient) {
      setIdeaError('Vyber prosím, pro koho dárek je.');
      return;
    }
    if (!title.trim()) {
      setIdeaError('Napiš prosím název dárku.');
      return;
    }

    const matchingPill = familyRecipients.find(
      (r) => r.name.toLowerCase() === resolvedRecipient.toLowerCase()
    );
    const canonicalName = matchingPill ? matchingPill.name : resolvedRecipient;
    const targetUid = matchingPill ? matchingPill.targetUid : null;

    setSubmittingIdea(true);
    setIdeaError('');
    try {
      if (editingIdea) {
        await optimisticUpdateIdea(editingIdea.id, {
          targetUid,
          targetName: canonicalName,
          title,
          url,
          note,
        });
        notify('Tajný nápad byl upraven.');
      } else {
        await optimisticAddIdea({
          ownerUid: authUser.uid,
          targetUid,
          targetName: canonicalName,
          title,
          url,
          note,
        });
        notify('Tajný nápad byl přidán na nákupní seznam.');
      }
      setIdeaModalOpen(false);
      setEditingIdea(null);
    } catch (err) {
      setIdeaError(err.message || 'Uložení nápadu se nezdařilo.');
    } finally {
      setSubmittingIdea(false);
    }
  };

  const { grouped, recipientKeys, totalCount, boughtCount } = useMemo(() => {
    const map = {};
    const canonicalKeyMap = {};

    const getGroupKey = (rawName) => {
      const clean = (rawName || 'Blízký').trim();
      const lower = clean.toLowerCase();
      if (!canonicalKeyMap[lower]) {
        canonicalKeyMap[lower] = clean;
        map[clean] = [];
      }
      return canonicalKeyMap[lower];
    };

    shoppingClaims.forEach((c) => {
      const key = getGroupKey(c.recipientName || c.recipientNameSnapshot);
      map[key].push({ ...c, kind: 'claim' });
    });
    privateIdeas.forEach((p) => {
      const key = getGroupKey(p.targetName);
      map[key].push({ ...p, kind: 'idea' });
    });

    const keys = Object.keys(map).sort((a, b) => a.localeCompare(b, 'cs'));
    const total = shoppingClaims.length + privateIdeas.length;
    const bought =
      shoppingClaims.filter((c) => c.isBought).length +
      privateIdeas.filter((p) => p.isBought).length;

    return {
      grouped: map,
      recipientKeys: keys,
      totalCount: total,
      boughtCount: bought,
    };
  }, [shoppingClaims, privateIdeas]);

  return (
    <div className="space-y-6 animate-page-transition min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-fairytale font-bold text-[32px] sm:text-[38px] leading-tight text-slate-text">
            Nákupní seznam
          </h1>
          {totalCount > 0 && (
            <p className="text-base font-bold text-fir mt-0.5">
              {boughtCount} z {totalCount} koupeno
            </p>
          )}
        </div>

        {/* Jedno centrální velké tlačítko + Přidat nápad */}
        <button
          type="button"
          onClick={openNewIdeaModal}
          className="min-h-[50px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-crimson hover:bg-crimson-dark text-white text-base font-bold shadow-sm border border-gold/45 transition shrink-0"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span>Přidat nápad</span>
        </button>
      </div>

      {recipientKeys.length === 0 ? (
        <div className="py-12 text-center">
          <h2 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text">
            Seznam je prázdný
          </h2>
        </div>
      ) : (
        <div className="space-y-7">
          {recipientKeys.map((recipient) => (
            <section key={recipient} className="space-y-3">
              <h2 className="font-fairytale font-bold text-2xl sm:text-[30px] text-fir leading-none px-1">
                {formatForRecipient(recipient)}
              </h2>

              <ul className="space-y-3">
                {grouped[recipient].map((item) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    onToggleBought={handleToggleBought}
                    onReleaseClaim={setClaimToRelease}
                    onEditIdea={openEditIdeaModal}
                    onDeleteIdea={handleDeleteIdea}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {ideaModalOpen &&
        createPortal(
          <div
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !submittingIdea) {
                setIdeaModalOpen(false);
              }
            }}
            style={{ backgroundColor: 'rgba(24, 26, 25, 0.68)', zIndex: 9999 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print"
          >
            <div
              role="dialog"
              aria-modal="true"
              style={{ backgroundColor: '#FFFDF8' }}
              className="w-full max-w-lg rounded-2xl bg-[#FFFDF8] border-[1.5px] border-fir shadow-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto relative"
            >
              <div
                className="pointer-events-none absolute inset-2 rounded-xl border border-gold/40"
                aria-hidden="true"
              />
              <div className="relative z-10 flex items-center justify-between gap-3 mb-5">
                <h2 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text">
                  {editingIdea ? 'Upravit tajný nápad' : 'Přidat tajný nápad'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIdeaModalOpen(false)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-paper transition"
                  aria-label="Zavřít"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveIdea} className="relative z-10 space-y-5">
                <div>
                  <span className="block text-base font-bold text-slate-text mb-2">
                    Pro koho <span className="text-crimson">*</span>
                  </span>

                  {/* Klikací štítky (pills) s 3D známkami a jmény členů rodiny a dětí */}
                  <div className="flex flex-wrap gap-2">
                    {familyRecipients.map((person) => {
                      const active = !isCustomPerson && selectedPillName === person.name;
                      return (
                        <button
                          key={person.name}
                          type="button"
                          onClick={() => {
                            setIsCustomPerson(false);
                            setSelectedPillName(person.name);
                          }}
                          className={`min-h-[46px] inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border-[1.5px] text-base font-bold transition ${
                            active
                              ? 'bg-fir text-white border-fir shadow-xs'
                              : 'bg-paper text-slate-text border-paper-warm hover:bg-kraft'
                          }`}
                        >
                          <Avatar
                            avatarId={person.avatarId}
                            avatarBg={person.avatarBg}
                            size="xs"
                          />
                          <span>{person.name}</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPerson(true);
                        setSelectedPillName('');
                      }}
                      className={`min-h-[46px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-[1.5px] text-base font-bold transition ${
                        isCustomPerson
                          ? 'bg-fir text-white border-fir shadow-xs'
                          : 'bg-paper text-slate-text border-paper-warm hover:bg-kraft'
                      }`}
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      <span>Jiná osoba</span>
                    </button>
                  </div>

                  {isCustomPerson && (
                    <div className="mt-3">
                      <input
                        type="text"
                        maxLength={50}
                        value={customPersonName}
                        onChange={(e) => setCustomPersonName(e.target.value)}
                        placeholder="Napiš jméno (např. Paní učitelka, Sousedi)..."
                        className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-paper-warm bg-paper text-base text-slate-text focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="idea-title"
                    className="block text-base font-bold text-slate-text mb-1.5"
                  >
                    Název dárku <span className="text-crimson">*</span>
                  </label>
                  <input
                    id="idea-title"
                    type="text"
                    maxLength={120}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Např. Domácí pralinky"
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-paper-warm bg-paper text-base text-slate-text focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir"
                  />
                </div>

                <div>
                  <label
                    htmlFor="idea-note"
                    className="block text-base font-bold text-slate-text mb-1.5"
                  >
                    Poznámka (nepovinné)
                  </label>
                  <input
                    id="idea-note"
                    type="text"
                    maxLength={200}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Např. velikost nebo barva..."
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-paper-warm bg-paper text-base text-slate-text focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir"
                  />
                </div>

                <div>
                  <label
                    htmlFor="idea-url"
                    className="block text-base font-bold text-slate-text mb-1.5"
                  >
                    Odkaz na obchod (nepovinné)
                  </label>
                  <input
                    id="idea-url"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-paper-warm bg-paper text-base text-slate-text focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir"
                  />
                </div>

                {ideaError && (
                  <p className="text-base text-crimson bg-crimson-soft px-4 py-2.5 rounded-xl">
                    {ideaError}
                  </p>
                )}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIdeaModalOpen(false)}
                    disabled={submittingIdea}
                    className="min-h-[48px] px-5 py-2.5 rounded-xl border border-paper-warm bg-paper text-base font-semibold text-slate-text hover:bg-kraft transition"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    disabled={submittingIdea}
                    className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-fir hover:bg-fir-hover text-white text-base font-bold shadow-sm transition disabled:opacity-60"
                  >
                    <Check className="w-5 h-5 shrink-0" />
                    <span>
                      {submittingIdea
                        ? 'Ukládám...'
                        : editingIdea
                          ? 'Uložit úpravy'
                          : 'Uložit nápad'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      <ConfirmDialog
        open={Boolean(claimToRelease)}
        loading={releasing}
        title="Uvolnit dárek zpět do dopisu?"
        description={`Dárek „${claimToRelease?.wishTitleSnapshot || ''}“ se vrátí zpět mezi volná přání v dopise.`}
        confirmLabel="Uvolnit zpět"
        cancelLabel="Nechat v seznamu"
        onConfirm={handleConfirmReleaseClaim}
        onCancel={() => setClaimToRelease(null)}
      />
    </div>
  );
}
