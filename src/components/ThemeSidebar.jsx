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

function ActionBtn({ children, onClick, primary, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-lg px-3 py-2 font-[Jost,sans-serif] text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? 'bg-white/90 text-[#04121f] hover:bg-white'
          : 'border border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export default function ThemeSidebar({
  themes,
  selectedId,
  onSelect,
  viewMode,
  onViewModeChange,
  onImportFolder,
  onImportPack,
  onExportPack,
  onBulkDownload,
  onClearThemes,
  importWarnings,
  bulkBusy,
  onClose,
}) {
  const folderRef = useRef(null);
  const packRef = useRef(null);

  const handleFolder = (e) => {
    const files = e.target.files;
    if (files?.length) onImportFolder(files);
    e.target.value = '';
  };

  const handlePack = (e) => {
    const file = e.target.files?.[0];
    if (file) onImportPack(file);
    e.target.value = '';
  };

  const handleSelect = (id) => {
    onSelect(id);
    onClose?.();
  };

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080a0e] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] lg:w-[248px] lg:shrink-0">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-5">
        <h1 className="font-[Jost,sans-serif] text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
          Themes
        </h1>
        <CloseButton onClose={onClose} />
      </div>

      <div className="space-y-2 border-b border-white/[0.08] px-4 py-3">
        <input
          ref={folderRef}
          type="file"
          className="hidden"
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFolder}
        />
        <input
          ref={packRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handlePack}
        />
        <ActionBtn primary onClick={() => folderRef.current?.click()}>
          Import folder
        </ActionBtn>
        <ActionBtn onClick={() => packRef.current?.click()}>Import theme-pack</ActionBtn>
        {themes.length > 0 && (
          <>
            <ActionBtn onClick={onExportPack}>Export theme-pack</ActionBtn>
            <ActionBtn onClick={onBulkDownload} disabled={bulkBusy}>
              {bulkBusy ? 'Bulk exporting…' : 'Bulk download ZIP'}
            </ActionBtn>
            <div className="flex gap-2">
              <ActionBtn
                onClick={() => onViewModeChange('grid')}
              >
                {viewMode === 'grid' ? '· Grid' : 'Grid'}
              </ActionBtn>
              <ActionBtn
                onClick={() => onViewModeChange('editor')}
              >
                {viewMode === 'editor' ? '· Editor' : 'Editor'}
              </ActionBtn>
            </div>
          </>
        )}
      </div>

      {importWarnings?.length > 0 && (
        <div className="max-h-24 overflow-y-auto border-b border-amber-500/20 bg-amber-500/10 px-4 py-2">
          {importWarnings.map((w, i) => (
            <p key={i} className="font-[Jost,sans-serif] text-[10px] leading-snug text-amber-200/90">
              {w}
            </p>
          ))}
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent]">
        {themes.length === 0 ? (
          <p className="px-2 py-4 font-[Jost,sans-serif] text-[12px] leading-relaxed text-white/40">
            Pick your <code className="text-white/55">themes</code> parent folder. Each subfolder
            needs <code className="text-white/55">random/ref</code> (before) and{' '}
            <code className="text-white/55">random/wr</code> (after).
          </p>
        ) : (
          themes.map((theme) => {
            const active = theme.id === selectedId;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelect(theme.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  active
                    ? 'bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]'
                    : 'text-white/65 hover:bg-white/[0.04] hover:text-white/90'
                }`}
              >
                <div className="h-10 w-8 shrink-0 overflow-hidden rounded-md bg-black/30">
                  {theme.beforeSrc && (
                    <img src={theme.beforeSrc} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-[Jost,sans-serif] text-[13px] font-medium">
                    {theme.displayName}
                  </div>
                  <div className="font-[Jost,sans-serif] text-[11px] text-white/40">
                    {theme.looks.length} looks
                  </div>
                </div>
              </button>
            );
          })
        )}
      </nav>

      {themes.length > 0 && (
        <div className="border-t border-white/[0.08] px-4 py-3">
          <ActionBtn onClick={onClearThemes}>Clear all themes</ActionBtn>
        </div>
      )}
    </aside>
  );
}
