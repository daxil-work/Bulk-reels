import React, { useRef } from 'react';

const iconClass = 'h-3 w-3 shrink-0';

function IconDownload({ color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path
        d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSpinner({ color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.3" strokeWidth="3" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconExport() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path
        d="M12 16V4m0 0l-4 4m4-4l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconImport() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path
        d="M12 8v12m0 0l-4-4m4 4l4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 6v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconReset() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path
        d="M4 12a8 8 0 0 1 13.5-5.7M20 12a8 8 0 0 1-13.5 5.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 4v5h5M20 20v-5h-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconZip() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path
        d="M8 4h8l3 3v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ToolbarBtn({
  onClick,
  disabled,
  title,
  icon,
  label,
  accent,
  primary,
}) {
  const base =
    'inline-flex h-8 min-w-0 shrink-0 items-center justify-center gap-1 rounded-md border px-2.5 font-[Jost,sans-serif] text-[9px] font-medium tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50';
  const variant = primary
    ? 'border-0 text-[#04121f] shadow-[0_4px_14px_-6px_rgba(0,0,0,0.55)] hover:brightness-[1.05]'
    : 'border-white/15 bg-white/[0.06] text-white/80 hover:bg-white/10';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      style={primary && accent ? { background: accent } : undefined}
      className={`${base} ${variant}`}
    >
      {icon}
      <span className="max-w-[3.25rem] truncate leading-none">{label}</span>
    </button>
  );
}

function shortDownloadLabel(label) {
  if (!label || label === 'Download') return 'Save';
  if (label.startsWith('Encoding')) return label.replace('Encoding ', 'Enc ');
  if (label.startsWith('Recording')) return label.replace('Recording ', 'Rec ');
  if (label.startsWith('Bulk')) return label.replace('Bulk ', 'Bulk ');
  if (label === 'Preparing…') return 'Prep…';
  if (label === 'Working…') return 'Work…';
  return label;
}

export default function DownloadButton({
  accent,
  disabled,
  onClick,
  label,
  note,
  onResetAll,
  onBulkDownload,
  bulkLabel = 'Bulk ZIP',
  bulkDisabled,
  onExportTweaks,
  onImportTweaks,
}) {
  const importRef = useRef(null);

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onImportTweaks) return;
    await onImportTweaks(file);
  };

  const saveLabel = shortDownloadLabel(label);
  const saveIcon = disabled ? <IconSpinner color="#04121f" /> : <IconDownload color="#04121f" />;
  const bulkShort = bulkLabel === 'Bulk ZIP' ? 'ZIP' : bulkLabel.replace('Exporting…', 'ZIP…');

  return (
    <div className="min-w-0">
      <div className="flex flex-nowrap items-center gap-1">
        <ToolbarBtn
          onClick={onClick}
          disabled={disabled}
          title={label}
          icon={saveIcon}
          label={saveLabel}
          accent={accent}
          primary
        />
        {onExportTweaks ? (
          <ToolbarBtn
            onClick={onExportTweaks}
            disabled={disabled}
            title="Export tweak settings for this theme"
            icon={<IconExport />}
            label="Export"
          />
        ) : null}
        {onImportTweaks ? (
          <>
            <input
              ref={importRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={onImportFile}
            />
            <ToolbarBtn
              onClick={() => importRef.current?.click()}
              disabled={disabled}
              title="Import tweak settings for this theme"
              icon={<IconImport />}
              label="Import"
            />
          </>
        ) : null}
        {onResetAll ? (
          <ToolbarBtn
            onClick={onResetAll}
            title="Reset all to defaults"
            icon={<IconReset />}
            label="Reset"
          />
        ) : null}
      </div>
      {onBulkDownload || note ? (
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
          {onBulkDownload ? (
            <ToolbarBtn
              onClick={onBulkDownload}
              disabled={bulkDisabled || disabled}
              title={bulkLabel}
              icon={<IconZip />}
              label={bulkShort}
            />
          ) : null}
          {note ? (
            <p
              className="min-w-0 flex-1 truncate font-[Jost,sans-serif] text-[9px] leading-snug text-white/45"
              title={note}
            >
              {note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
