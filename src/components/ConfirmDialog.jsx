import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, X } from 'lucide-react';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Potvrdit',
  cancelLabel = 'Zrušit',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
      style={{ backgroundColor: 'rgba(24, 26, 25, 0.68)', zIndex: 9999 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print"
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{ backgroundColor: '#FFFDF8' }}
        className="w-full max-w-md rounded-2xl bg-[#FFFDF8] border-[1.5px] border-fir shadow-2xl p-6 animate-slide-up relative"
      >
        <div
          className="pointer-events-none absolute inset-2 rounded-xl border border-gold/40"
          aria-hidden="true"
        />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                danger ? 'bg-crimson-soft text-crimson' : 'bg-gold-soft text-gold'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-fairytale font-bold text-2xl text-slate-text leading-tight">
                {title}
              </h3>
              <p className="mt-2 text-base text-slate-text-muted leading-relaxed">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-paper transition"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative z-10 mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[48px] px-5 py-2.5 rounded-xl border border-paper-warm bg-paper text-base font-semibold text-slate-text hover:bg-kraft transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-base font-bold text-white transition disabled:opacity-60 ${
              danger
                ? 'bg-crimson hover:bg-crimson-dark'
                : 'bg-fir hover:bg-fir-hover'
            }`}
          >
            <Check className="w-5 h-5 shrink-0" />
            <span>{loading ? 'Pracuji...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
