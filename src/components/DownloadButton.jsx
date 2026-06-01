import React from 'react';

export default function DownloadButton({ accent, disabled, onClick, label, note }) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{ background: accent }}
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border-0 px-5 py-3.5 font-[Jost,sans-serif] text-sm font-medium tracking-[0.06em] text-[#04121f] shadow-[0_10px_28px_-10px_rgba(0,0,0,0.65)] transition-[transform,filter,box-shadow] duration-200 hover:-translate-y-0.5 hover:brightness-[1.05] hover:shadow-[0_14px_32px_-10px_rgba(0,0,0,0.7)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-90"
      >
        {disabled ? (
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
            <circle cx="12" cy="12" r="9" stroke="rgba(4,18,31,0.3)" strokeWidth="3" />
            <path d="M12 3a9 9 0 0 1 9 9" stroke="#04121f" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
            <path
              d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5"
              stroke="#04121f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
              stroke="#04121f"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {label}
      </button>
      <p className="px-1 font-[Jost,sans-serif] text-[12px] leading-relaxed text-white/45">
        {note}
      </p>
    </div>
  );
}
