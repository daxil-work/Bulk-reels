import React from 'react';

export default function Sidebar({ ideas, selectedId, onSelect }) {
  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080a0e] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]">
      <div className="border-b border-white/[0.08] px-5 py-5">
        <h1 className="font-[Jost,sans-serif] text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
          Reel Ideas
        </h1>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent]">
        {ideas.map((idea) => {
          const active = idea.id === selectedId;
          return (
            <button
              key={idea.id}
              type="button"
              onClick={() => onSelect(idea.id)}
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
