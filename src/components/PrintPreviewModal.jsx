import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import {
  FairytaleOrnamentSvg,
  MinimalSnowflakeSvg,
} from '../assets/avatars';

const TEMPLATES = [
  {
    id: 'handwritten',
    label: 'Ručně psaný dopis',
    desc: 'Krémový papír a rukopisné písmo',
  },
  {
    id: 'fairytale',
    label: 'Pohádkové Vánoce',
    desc: 'Patkové písmo a ozdobný rámeček',
  },
  {
    id: 'minimal',
    label: 'Čistý minimalismus',
    desc: 'Vzdušná typografie a vločka',
  },
];

export function PrintPreviewModal({ open, letter, onThemeChange, onClose }) {
  const [theme, setTheme] = useState(letter?.printTheme || 'handwritten');

  useEffect(() => {
    if (open) {
      setTheme(letter?.printTheme || 'handwritten');
      document.body.classList.add('printing-letter');
    }
    return () => {
      document.body.classList.remove('printing-letter');
    };
  }, [open, letter]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !letter) return null;

  const handleSelectTheme = (nextTheme) => {
    setTheme(nextTheme);
    if (onThemeChange) {
      onThemeChange(nextTheme);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const wishes = letter.wishes || [];

  return createPortal(
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ backgroundColor: 'rgba(24, 26, 25, 0.68)', zIndex: 9999 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print-modal-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{ backgroundColor: '#FFFDF8' }}
        className="max-h-[90vh] w-full max-w-3xl flex flex-col bg-[#FFFDF8] border-[1.5px] border-fir rounded-2xl shadow-2xl overflow-hidden print-modal-container"
      >
        {/* Horní fixní lišta: výběr ze 3 šablon + zavírací křížek X */}
        <div
          style={{ backgroundColor: '#FFFDF8' }}
          className="no-print shrink-0 p-4 sm:p-5 border-b border-paper-warm bg-[#FFFDF8] space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-fairytale font-bold text-2xl sm:text-3xl text-slate-text leading-tight">
              Vzhled dopisu k tisku — {letter.recipientName}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-text-muted hover:text-slate-text hover:bg-paper transition"
              aria-label="Zavřít náhled tisku"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TEMPLATES.map((tpl) => {
              const active = theme === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTheme(tpl.id)}
                  className={`text-left px-3.5 py-2.5 rounded-xl border-[1.5px] transition ${
                    active
                      ? 'bg-fir-soft border-fir ring-1 ring-gold/40'
                      : 'bg-sheet border-paper-warm hover:bg-paper'
                  }`}
                >
                  <div className="text-sm font-bold text-slate-text">{tpl.label}</div>
                  <div className="text-xs text-slate-text-muted mt-0.5">{tpl.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prostřední rolovací část: samotný náhled dopisního papíru */}
        <div
          style={{ backgroundColor: '#EFE5D1' }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#EFE5D1] print-sheet-wrapper"
        >
          {theme === 'handwritten' && (
            <article
              style={{ backgroundColor: '#FFFDF8' }}
              className="print-sheet print-letter-sheet relative max-w-[700px] mx-auto bg-[#FFFDF8] rounded-xl shadow-md border border-[#E5DEC9] p-8 sm:p-12 overflow-hidden"
            >
              <div className="relative z-10 font-handwritten text-slate-text">
                <h2 className="text-4xl sm:text-5xl font-bold text-fir mb-6">
                  Milý Ježíšku,
                </h2>

                {letter.handwrittenPhotoUrl && (
                  <div className="mb-6">
                    <img
                      src={letter.handwrittenPhotoUrl}
                      alt="Ručně psaný dopis"
                      className="max-h-[340px] w-auto object-contain rounded-lg border border-gold/40"
                    />
                  </div>
                )}

                {letter.introText && (
                  <p className="text-2xl sm:text-[26px] leading-relaxed whitespace-pre-line mb-7">
                    {letter.introText}
                  </p>
                )}

                {wishes.length > 0 && (
                  <div className="my-7 pl-4 border-l-2 border-gold/60 space-y-3.5">
                    <div className="text-2xl font-bold text-fir">Moje přání:</div>
                    <ul className="space-y-3">
                      {wishes.map((w, idx) => (
                        <li key={w.id || idx} className="print-wish-item text-2xl sm:text-[25px] leading-snug">
                          <span className="text-gold mr-2">★</span>
                          <span className="font-semibold">{w.title}</span>
                          {w.note && (
                            <span className="block pl-5 text-xl italic text-slate-text-muted">
                              ({w.note})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {letter.outroText && (
                  <p className="text-2xl sm:text-[26px] leading-relaxed whitespace-pre-line mt-8 pt-4">
                    {letter.outroText}
                  </p>
                )}
              </div>
            </article>
          )}

          {theme === 'fairytale' && (
            <article
              style={{ backgroundColor: '#FFFDF8' }}
              className="print-sheet print-letter-sheet relative max-w-[700px] mx-auto bg-[#FFFDF8] shadow-md p-5 sm:p-8 border border-[#E4D5BC]"
            >
              <div className="border-2 border-gold/75 p-1.5">
                <div className="border border-crimson/45 p-6 sm:p-10 font-fairytale text-slate-text">
                  <div className="text-center mb-6">
                    <FairytaleOrnamentSvg className="w-52 h-9 mx-auto mb-2" />
                    <h2 className="text-3xl sm:text-4xl font-semibold text-fir mt-1">
                      Milý Ježíšku,
                    </h2>
                  </div>

                  {letter.handwrittenPhotoUrl && (
                    <div className="mb-6 text-center">
                      <img
                        src={letter.handwrittenPhotoUrl}
                        alt="Ručně psaný dopis"
                        className="max-h-[320px] w-auto object-contain mx-auto rounded-lg border border-gold/40"
                      />
                    </div>
                  )}

                  {letter.introText && (
                    <p className="text-xl sm:text-[22px] leading-relaxed whitespace-pre-line mb-7 italic">
                      {letter.introText}
                    </p>
                  )}

                  {wishes.length > 0 && (
                    <div className="my-7 bg-[#F7F2E7] border border-gold/40 rounded-lg p-5 sm:p-6">
                      <h3 className="text-xl font-bold text-crimson mb-4 text-center tracking-wide">
                        Přání pod stromeček
                      </h3>
                      <ol className="space-y-3 list-decimal list-inside">
                        {wishes.map((w, idx) => (
                          <li key={w.id || idx} className="print-wish-item text-lg sm:text-xl leading-relaxed">
                            <span className="font-semibold text-slate-text">{w.title}</span>
                            {w.note && (
                              <span className="block pl-6 text-base text-slate-text-muted italic">
                                {w.note}
                              </span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {letter.outroText && (
                    <p className="text-xl sm:text-[22px] leading-relaxed whitespace-pre-line mt-8 text-right italic">
                      {letter.outroText}
                    </p>
                  )}

                  <FairytaleOrnamentSvg className="w-44 h-8 mx-auto mt-8 opacity-80" />
                </div>
              </div>
            </article>
          )}

          {theme === 'minimal' && (
            <article className="print-sheet print-letter-sheet relative max-w-[700px] mx-auto bg-white shadow-md border border-stone-200 p-8 sm:p-12 font-sans text-slate-text">
              <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-6 mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-text">
                  Milý Ježíšku,
                </h2>
                <MinimalSnowflakeSvg className="w-10 h-10 text-gold shrink-0" />
              </div>

              {letter.handwrittenPhotoUrl && (
                <div className="mb-6">
                  <img
                    src={letter.handwrittenPhotoUrl}
                    alt="Ručně psaný dopis"
                    className="max-h-[320px] w-auto object-contain rounded-lg border border-stone-200"
                  />
                </div>
              )}

              {letter.introText && (
                <p className="text-base sm:text-lg leading-loose whitespace-pre-line text-slate-text mb-8">
                  {letter.introText}
                </p>
              )}

              {wishes.length > 0 && (
                <div className="my-8">
                  <h3 className="text-xs uppercase tracking-[0.16em] text-slate-text-muted font-semibold mb-4">
                    Seznam přání
                  </h3>
                  <ul className="divide-y divide-stone-100 border-t border-b border-stone-100">
                    {wishes.map((w, idx) => (
                      <li key={w.id || idx} className="print-wish-item py-3.5 flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full border border-fir/40 text-fir text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-text">{w.title}</div>
                          {w.note && (
                            <div className="text-sm text-slate-text-muted mt-0.5">{w.note}</div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {letter.outroText && (
                <p className="text-base sm:text-lg leading-relaxed whitespace-pre-line text-slate-text mt-10">
                  {letter.outroText}
                </p>
              )}
            </article>
          )}
        </div>

        {/* Spodní fixní lišta: vždy viditelné tlačítko Zavřít a Vytisknout dopis */}
        <div
          style={{ backgroundColor: '#FFFDF8' }}
          className="no-print shrink-0 border-t border-paper-warm bg-[#FFFDF8] p-4 flex justify-end gap-3"
        >
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-5 py-2.5 rounded-xl border border-paper-warm bg-paper hover:bg-kraft text-base font-semibold text-slate-text transition"
          >
            Zavřít
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[48px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-fir hover:bg-fir-hover text-white text-base font-bold shadow-sm transition"
          >
            <Printer className="w-5 h-5 shrink-0" />
            <span>Vytisknout dopis</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
