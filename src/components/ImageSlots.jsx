import React, { useRef } from 'react';

export default function ImageSlots({
  slots,
  setImage,
  resetImage,
  deleteImage,
  restoreImage,
}) {
  const inputRefs = useRef({});

  const onReplace = (key) => {
    inputRefs.current[key]?.click();
  };

  const onFileChange = (key, e) => {
    const file = e.target.files?.[0];
    if (file) setImage(key, file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <p className="font-[Jost,sans-serif] text-[12px] leading-relaxed text-white/45">
        Replace or remove look slots. Changes save in your browser and persist after reload.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {slots.map((slot) => (
          <article
            key={slot.key}
            className={`overflow-hidden rounded-xl border shadow-sm transition ${
              slot.deleted
                ? 'border-red-400/25 bg-red-950/20 opacity-75'
                : 'border-white/[0.1] bg-white/[0.03] shadow-black/20 hover:border-white/[0.16]'
            }`}
          >
            <div className="relative aspect-[3/4] bg-black/50">
              {slot.deleted ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
                  <span className="font-[Jost,sans-serif] text-[10px] font-medium uppercase tracking-[0.12em] text-red-300/90">
                    Removed
                  </span>
                  <span className="font-[Jost,sans-serif] text-[11px] text-white/40">Not in reel</span>
                </div>
              ) : slot.src ? (
                <img src={slot.src} alt={slot.label} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center font-[Jost,sans-serif] text-[11px] text-white/35">
                  No image
                </div>
              )}
              {!slot.deleted && slot.isCustom ? (
                <span className="absolute left-2.5 top-2.5 rounded-md bg-black/75 px-2 py-1 font-[Jost,sans-serif] text-[9px] font-medium uppercase tracking-wider text-white/95 backdrop-blur-sm">
                  Custom
                </span>
              ) : null}
            </div>

            <div className="space-y-3 border-t border-white/[0.06] p-3.5">
              <h3 className="truncate font-[Jost,sans-serif] text-[12px] font-medium leading-snug text-white/90">
                {slot.label}
              </h3>

              {slot.deleted ? (
                <button
                  type="button"
                  onClick={() => restoreImage(slot.key)}
                  className="w-full rounded-lg bg-white/10 px-3 py-2.5 font-[Jost,sans-serif] text-[11px] font-medium text-white/90 transition hover:bg-white/15"
                >
                  Restore
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => onReplace(slot.key)}
                    className="w-full rounded-lg bg-white/10 px-3 py-2.5 font-[Jost,sans-serif] text-[11px] font-medium text-white/90 transition hover:bg-white/15"
                  >
                    Replace
                  </button>
                  <div className="flex gap-2">
                    {slot.isCustom ? (
                      <button
                        type="button"
                        onClick={() => resetImage(slot.key)}
                        className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-2 font-[Jost,sans-serif] text-[11px] text-white/70 transition hover:bg-white/[0.08]"
                      >
                        Reset
                      </button>
                    ) : null}
                    {slot.canDelete ? (
                      <button
                        type="button"
                        onClick={() => deleteImage(slot.key)}
                        className={`rounded-lg border border-red-400/20 bg-red-500/10 px-2 py-2 font-[Jost,sans-serif] text-[11px] font-medium text-red-300/95 transition hover:bg-red-500/20 ${
                          slot.isCustom ? 'flex-1' : 'w-full'
                        }`}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              <input
                ref={(el) => { inputRefs.current[slot.key] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFileChange(slot.key, e)}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
