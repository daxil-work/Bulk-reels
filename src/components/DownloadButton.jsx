import React from 'react';

export default function DownloadButton({
  accent,
  disabled,
  onClick,
  label,
  onResetAll,
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{ background: accent }}
        title={label}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border-0 px-3.5 py-2 font-[Jost,sans-serif] text-xs font-medium tracking-wide text-[#04121f] shadow-[0_6px_20px_-8px_rgba(0,0,0,0.55)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-90 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
      >
        {disabled ? (
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4">
            <circle cx="12" cy="12" r="9" stroke="rgba(4,18,31,0.3)" strokeWidth="3" />
            <path d="M12 3a9 9 0 0 1 9 9" stroke="#04121f" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4">
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
        <span className="max-w-[5.5rem] truncate sm:max-w-[9rem]">{label}</span>
      </button>
      {onResetAll ? (
        <button
          type="button"
          onClick={onResetAll}
          title="Reset all to defaults"
          className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 font-[Jost,sans-serif] text-[10px] font-medium whitespace-nowrap text-white/65 transition hover:bg-white/[0.08] hover:text-white/90 sm:px-3 sm:text-[11px]"
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}
