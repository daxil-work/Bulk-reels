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

export default function SettingsPanel({
  accent,
  downloadLabel,
  downloadNote,
  recOn,
  onDownload,
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
}) {
  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0e1016] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]">
      <div className="shrink-0 border-b border-white/[0.08] px-5 py-5">
        <DownloadButton
          accent={accent}
          disabled={recOn}
          onClick={onDownload}
          label={downloadLabel}
          note={downloadNote}
        />
        <button
          type="button"
          onClick={onResetAll}
          className="mt-5 w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 font-[Jost,sans-serif] text-[12px] font-medium tracking-wide text-white/65 transition hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white/90"
        >
          Reset all to defaults
        </button>
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
