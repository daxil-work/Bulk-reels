import React from 'react';
import DownloadButton from './DownloadButton.jsx';
import ImageSlots from './ImageSlots.jsx';
import { DockedTweaksBody } from './TweaksPanel.jsx';

function SectionHeader({ children }) {
  return (
    <h2 className="mb-4 font-[Jost,sans-serif] text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
      {children}
    </h2>
  );
}

function CloseButton({ onClose }) {
  if (!onClose) return null;
  return (
    <button
      type="button"
      aria-label="Close settings"
      onClick={onClose}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 lg:hidden"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export default function SettingsPanel({
  accent,
  downloadLabel,
  downloadNote,
  recOn,
  onDownload,
  onBulkDownload,
  bulkDownloadLabel,
  bulkBusy,
  onResetAll,
  slots,
  setImage,
  resetImage,
  deleteImage,
  restoreImage,
  SettingsControls,
  t,
  setTweak,
  lookNames,
  onClose,
}) {
  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0e1016] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] lg:w-[380px] lg:shrink-0">
      <div className="shrink-0 border-b border-white/[0.08] px-5 py-5">
        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <h2 className="font-[Jost,sans-serif] text-sm font-semibold text-white/90">Settings</h2>
          <CloseButton onClose={onClose} />
        </div>
        <DownloadButton
          accent={accent}
          disabled={recOn}
          onClick={onDownload}
          label={downloadLabel}
          note={downloadNote}
          onBulkDownload={onBulkDownload}
          bulkLabel={bulkDownloadLabel}
          bulkDisabled={bulkBusy}
          onResetAll={onResetAll}
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-6 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.14)_transparent]">
        <section className="mb-10">
          <SectionHeader>Images</SectionHeader>
          <ImageSlots
            slots={slots}
            setImage={setImage}
            resetImage={resetImage}
            deleteImage={deleteImage}
            restoreImage={restoreImage}
          />
        </section>

        <section className="pb-4">
          <SectionHeader>Settings</SectionHeader>
          <div className="rounded-2xl border border-black/[0.08] bg-[#faf9f7] p-5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.75)]">
            <DockedTweaksBody>
              <SettingsControls t={t} setTweak={setTweak} lookNames={lookNames} />
            </DockedTweaksBody>
          </div>
        </section>
      </div>
    </aside>
  );
}
