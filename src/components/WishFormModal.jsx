import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Link as LinkIcon, StickyNote, X } from 'lucide-react';

export function WishFormModal({ open, initialWish = null, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(initialWish?.title || '');
      setUrl(initialWish?.url || '');
      setNote(initialWish?.note || '');
      setError('');
    }
  }, [open, initialWish]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Napiš prosím alespoň název dárku.');
      return;
    }
    onSave({
      ...(initialWish || {}),
      title: title.trim(),
      url: url.trim(),
      note: note.trim(),
    });
  };

  return createPortal(
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ backgroundColor: 'rgba(24, 26, 25, 0.68)', zIndex: 9999 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print"
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{ backgroundColor: '#FFFDF8' }}
        className="w-full max-w-lg rounded-2xl bg-[#FFFDF8] border-[1.5px] border-fir shadow-2xl p-6 animate-slide-up relative"
      >
        <div
          className="pointer-events-none absolute inset-2 rounded-xl border border-gold/40"
          aria-hidden="true"
        />
        <div className="relative z-10 flex items-center justify-between gap-3 mb-5">
          <h3 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text leading-tight">
            {initialWish ? 'Upravit přání' : 'Přidat přání'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-paper transition"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <div>
            <label htmlFor="wish-title" className="block text-base font-bold text-slate-text mb-1.5">
              Název dárku <span className="text-crimson">*</span>
            </label>
            <input
              id="wish-title"
              type="text"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Např. Dřevěná stavebnice Hrad"
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-paper-warm bg-paper text-base text-slate-text placeholder:text-slate-text-muted/60 focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="wish-note" className="block text-base font-bold text-slate-text mb-1.5">
              Upřesnění (nepovinné)
            </label>
            <div className="relative">
              <StickyNote className="w-5 h-5 text-slate-text-muted absolute left-3.5 top-3.5" />
              <textarea
                id="wish-note"
                rows={2}
                maxLength={240}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Např. velikost M, modrá barva nebo autor knihy"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-paper-warm bg-paper text-base text-slate-text placeholder:text-slate-text-muted/60 focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir"
              />
            </div>
          </div>

          <div>
            <label htmlFor="wish-url" className="block text-base font-bold text-slate-text mb-1.5">
              Odkaz na ukázku (nepovinné)
            </label>
            <div className="relative">
              <LinkIcon className="w-5 h-5 text-slate-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="wish-url"
                type="text"
                maxLength={2000}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full min-h-[48px] pl-11 pr-4 py-2.5 rounded-xl border border-paper-warm bg-paper text-base text-slate-text placeholder:text-slate-text-muted/60 focus:outline-none focus:ring-2 focus:ring-fir/30 focus:border-fir"
              />
            </div>
          </div>

          {error && (
            <p className="text-base text-crimson bg-crimson-soft px-4 py-2.5 rounded-xl">{error}</p>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-paper-warm bg-paper text-base font-semibold text-slate-text hover:bg-kraft transition"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-fir hover:bg-fir-hover text-white text-base font-bold shadow-sm transition"
            >
              <Check className="w-5 h-5 shrink-0" />
              <span>{initialWish ? 'Uložit' : 'Přidat přání'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
