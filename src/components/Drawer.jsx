import React, { useEffect } from 'react';

export default function Drawer({ open, onClose, side = 'left', children, title }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const isLeft = side === 'left';
  const closedClass = isLeft ? '-translate-x-full' : 'translate-x-full';
  const positionClass = isLeft ? 'left-0' : 'right-0';

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className={`absolute inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute top-0 ${positionClass} flex h-full w-[min(100vw-2rem,400px)] max-w-full flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : closedClass
        }`}
      >
        {children}
      </div>
    </div>
  );
}
