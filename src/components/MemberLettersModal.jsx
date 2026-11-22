import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Gift, HeartHandshake, Sparkles, X } from 'lucide-react';
import { Avatar } from '../assets/avatars';
import { claimWish, getMemberLettersWithAvailability } from '../lib/db';
import { useAuth } from '../hooks/useAuth';

export function MemberLettersModal({ open, member, onClose }) {
  const { authUser, notify } = useAuth();
  const [letters, setLetters] = useState([]);
  const [activeLetterId, setActiveLetterId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claimingWishId, setClaimingWishId] = useState(null);
  const [error, setError] = useState('');

  const loadLetters = useCallback(async () => {
    if (!open || !member || !authUser) return;
    setLoading(true);
    setError('');
    try {
      const list = await getMemberLettersWithAvailability(authUser.uid, member.uid);
      setLetters(list);
      setActiveLetterId((prev) =>
        list.some((l) => l.id === prev) ? prev : list[0]?.id || null
      );
    } catch (err) {
      setError(err.message || 'Nepodařilo se načíst dopisy.');
    } finally {
      setLoading(false);
    }
  }, [open, member, authUser]);

  useEffect(() => {
    loadLetters();
  }, [loadLetters]);

  if (!open || !member) return null;

  const activeLetter = letters.find((l) => l.id === activeLetterId) || letters[0] || null;

  const handleClaim = async (wish) => {
    if (!activeLetter || !authUser) return;
    setClaimingWishId(wish.id);
    try {
      await claimWish(authUser.uid, activeLetter, wish);
      // Položka okamžitě zmizí ze seznamu volných přání (bez jakéhokoliv popisku „zamluveno“)
      setLetters((prev) =>
        prev.map((l) =>
          l.id === activeLetter.id
            ? {
                ...l,
                availableWishes: l.availableWishes.filter((w) => w.id !== wish.id),
              }
            : l
        )
      );
      notify(`„${wish.title}“ jsme tajně uložili do tvého seznamu Co mám koupit.`);
    } catch (err) {
      notify(err.message || 'Nepodařilo se přání uložit.', 'error');
      await loadLetters();
    } finally {
      setClaimingWishId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-text/45 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-3xl bg-paper rounded-3xl border border-paper-warm shadow-soft flex flex-col max-h-[90vh] animate-slide-up overflow-hidden"
      >
        {/* Hlavička */}
        <div className="px-5 py-4 bg-white border-b border-paper-warm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar avatarId={member.avatarId} avatarBg={member.avatarBg} size="md" />
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-text truncate">
                Dopis Ježíškovi ({member.displayName})
              </h2>
              <p className="text-xs text-slate-text-muted">
                {member.displayName}#{member.tag} · Když si dárek vybereš, ostatním se hned skryje
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-text-muted hover:text-slate-text hover:bg-paper-warm/40 transition"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Záložky (hlavní dopis + dětské dopisy) */}
        {letters.length > 0 && (
          <div className="px-5 py-3 bg-paper-warm/30 border-b border-paper-warm flex flex-wrap gap-2">
            {letters.map((l) => {
              const active = l.id === activeLetter?.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setActiveLetterId(l.id)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
                    active
                      ? 'bg-fir text-white shadow-sm'
                      : 'bg-white text-slate-text border border-paper-warm hover:bg-paper-warm/50'
                  }`}
                >
                  {l.isChildLetter ? `${l.recipientName} (dětský dopis)` : l.recipientName}
                </button>
              );
            })}
          </div>
        )}

        {/* Obsah vybraného dopisu */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-text-muted">
              Otevírám dopisy...
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-crimson-soft text-crimson text-sm">{error}</div>
          ) : letters.length === 0 ? (
            <div className="py-12 text-center">
              <Sparkles className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-base font-medium text-slate-text">
                {member.displayName} zatím nenapsal/a žádný dopis.
              </p>
              <p className="text-sm text-slate-text-muted mt-1">
                Až dopis uloží, objeví se automaticky tady.
              </p>
            </div>
          ) : (
            activeLetter && (
              <>
                {/* Textová část dopisu */}
                <div className="rounded-2xl bg-white border border-paper-warm p-5 sm:p-6 shadow-card">
                  <div className="text-xs uppercase tracking-wider text-gold font-semibold mb-2">
                    Dopis od: {activeLetter.recipientName}
                  </div>
                  {activeLetter.introText ? (
                    <p className="text-slate-text whitespace-pre-line leading-relaxed">
                      {activeLetter.introText}
                    </p>
                  ) : (
                    <p className="text-sm italic text-slate-text-muted">
                      (Úvodní oslovení zatím nebylo napsáno.)
                    </p>
                  )}

                  {activeLetter.outroText && (
                    <p className="mt-4 pt-4 border-t border-paper-warm/70 text-slate-text whitespace-pre-line leading-relaxed">
                      {activeLetter.outroText}
                    </p>
                  )}
                </div>

                {/* Volná přání */}
                <div>
                  <h3 className="text-base font-bold text-slate-text mb-3 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-crimson" />
                    Přání v dopise
                  </h3>

                  {activeLetter.availableWishes.length === 0 ? (
                    <div className="rounded-2xl bg-paper-warm/40 border border-paper-warm p-5 text-center text-sm text-slate-text-muted">
                      V tomto dopise teď není žádný další volný dárek k výběru. Můžeš ale přidat
                      vlastní tajný nápad přímo ve svém nákupním seznamu.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeLetter.availableWishes.map((wish) => (
                        <div
                          key={wish.id}
                          className="rounded-2xl bg-white border border-paper-warm p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="font-semibold text-slate-text text-base">
                              {wish.title}
                            </div>
                            {wish.note && (
                              <p className="text-sm text-slate-text-muted">{wish.note}</p>
                            )}
                            {wish.url && (
                              <a
                                href={wish.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-soft text-slate-text text-xs font-medium hover:bg-gold/25 transition mt-1"
                              >
                                Ukázka dárku
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={claimingWishId === wish.id}
                            onClick={() => handleClaim(wish)}
                            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-fir hover:bg-fir-dark text-white text-sm font-semibold shadow-sm transition disabled:opacity-60"
                          >
                            <HeartHandshake className="w-4 h-4" />
                            {claimingWishId === wish.id ? 'Ukládám...' : 'Tohle koupím já'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
