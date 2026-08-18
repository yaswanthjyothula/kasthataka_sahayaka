'use client';
import React, { useRef, useState } from 'react';
import { LANGUAGES } from '@/lib/i18n';
import { useLanguage } from '@/context/LanguageContext';

export default function LanguageSwitcher() {
  const { lang, setLang, isTranslating } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative" title="Select Language">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isTranslating}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-wait min-w-[72px] justify-center"
        aria-label="Select language"
      >
        {isTranslating ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span>...</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round" />
            </svg>
            <span>{current.native}</span>
            <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-emerald-100 rounded-2xl shadow-xl z-50 py-2 max-h-80 overflow-y-auto">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors text-left ${
                l.code === lang ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-700'
              }`}
            >
              <span className="text-base">{l.native}</span>
              {l.code === lang && <span className="text-emerald-600 text-xs font-bold">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
