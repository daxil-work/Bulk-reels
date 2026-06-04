import React from 'react';

export default function BulkPreviewGrid({ themes, selectedId, onSelect }) {
  if (!themes.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-[Jost,sans-serif] text-sm text-white/50">
          Import a themes folder to see bulk preview cards here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-[Jost,sans-serif] text-sm font-semibold text-white/90">
          Bulk preview
        </h2>
        <span className="font-[Jost,sans-serif] text-[11px] text-white/40">
          {themes.length} theme{themes.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
        {themes.map((theme) => {
          const active = theme.id === selectedId;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelect(theme.id)}
              className={`group overflow-hidden rounded-xl border text-left transition ${
                active
                  ? 'border-white/25 bg-white/[0.08] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]'
              }`}
            >
              <div className="relative aspect-[9/12] w-full overflow-hidden bg-black/40">
                {theme.beforeSrc ? (
                  <img
                    src={theme.beforeSrc}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-white/30">
                    No image
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-8">
                  <p className="truncate font-[Jost,sans-serif] text-[12px] font-medium text-white">
                    {theme.displayName}
                  </p>
                  <p className="font-[Jost,sans-serif] text-[10px] text-white/55">
                    {theme.looks.length} look{theme.looks.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
