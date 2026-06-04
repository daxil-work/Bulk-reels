import React, { useRef } from 'react';

function CloseButton({ onClose }) {
  if (!onClose) return null;
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 lg:hidden"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export default function Sidebar({
  ideas,
  selectedId,
  onSelect,
  onClose,
  onImportFolder,
  onImportPack,
}) {
  const folderRef = useRef(null);
  const packRef = useRef(null);

  const handleSelect = (id) => {
    onSelect(id);
    onClose?.();
  };

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080a0e] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] lg:w-[248px] lg:shrink-0">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-5">
        <h1 className="font-[Jost,sans-serif] text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
          Reel Ideas
        </h1>
        <CloseButton onClose={onClose} />
      </div>
      {(onImportFolder || onImportPack) && (
        <div className="space-y-2 border-b border-white/[0.08] px-4 py-3">
          <input
            ref={folderRef}
            type="file"
            className="hidden"
            webkitdirectory=""
            directory=""
            multiple
            onChange={(e) => {
              if (e.target.files?.length) onImportFolder?.(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={packRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportPack?.(f);
              e.target.value = '';
            }}
          />
          {onImportFolder && (
            <button
              type="button"
              onClick={() => folderRef.current?.click()}
              className="w-full rounded-lg bg-white/90 px-3 py-2 font-[Jost,sans-serif] text-[11px] font-medium text-[#04121f] hover:bg-white"
            >
              Import themes folder
            </button>
          )}
          {onImportPack && (
            <button
              type="button"
              onClick={() => packRef.current?.click()}
              className="w-full rounded-lg border border-white/10 px-3 py-2 font-[Jost,sans-serif] text-[11px] font-medium text-white/75 hover:bg-white/[0.06]"
            >
              Import theme-pack
            </button>
          )}
        </div>
      )}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent]">
        {ideas.map((idea) => {
          const active = idea.id === selectedId;
          return (
            <button
              key={idea.id}
              type="button"
              onClick={() => handleSelect(idea.id)}
              className={`w-full rounded-xl px-4 py-4 text-left transition-all duration-150 ${
                active
                  ? 'bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]'
                  : 'text-white/65 hover:bg-white/[0.04] hover:text-white/90'
              }`}
            >
              <div className="font-[Jost,sans-serif] text-[15px] font-medium leading-snug">{idea.name}</div>
              <div className="mt-2 font-[Jost,sans-serif] text-[12px] leading-relaxed text-white/40">
                {idea.description}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
