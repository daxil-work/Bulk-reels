import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  loadSlotMeta,
  saveSlotMeta,
  clearSlotMeta,
  fileToStoredDataUrl,
} from './storage.js';

function resolveImages(imageSlots, meta) {
  const beforeSlot = meta[imageSlots.before.key];
  const before = beforeSlot?.deleted
    ? null
    : beforeSlot?.customDataUrl || imageSlots.before.defaultSrc;

  const looks = imageSlots.looks
    .filter((look) => !meta[look.key]?.deleted)
    .map((look) => ({
      key: look.key,
      n: look.name,
      src: meta[look.key]?.customDataUrl || look.defaultSrc,
    }));

  return { before, looks };
}

function buildSlotList(imageSlots, meta) {
  const before = meta[imageSlots.before.key];
  const slots = [
    {
      key: imageSlots.before.key,
      label: imageSlots.before.label,
      src: before?.deleted ? null : before?.customDataUrl || imageSlots.before.defaultSrc,
      defaultSrc: imageSlots.before.defaultSrc,
      isCustom: !!before?.customDataUrl,
      deleted: !!before?.deleted,
      canDelete: false,
    },
  ];

  for (const look of imageSlots.looks) {
    const s = meta[look.key];
    slots.push({
      key: look.key,
      label: look.name,
      src: s?.deleted ? null : s?.customDataUrl || look.defaultSrc,
      defaultSrc: look.defaultSrc,
      isCustom: !!s?.customDataUrl,
      deleted: !!s?.deleted,
      canDelete: true,
    });
  }
  return slots;
}

export function useImages(imageSlots, ideaId) {
  const [meta, setMeta] = useState(() => loadSlotMeta(ideaId, imageSlots));
  const [ready, setReady] = useState(true);

  useEffect(() => {
    setMeta(loadSlotMeta(ideaId, imageSlots));
    setReady(true);
  }, [ideaId, imageSlots]);

  const setImage = useCallback(
    async (key, file) => {
      if (!file) return;
      setReady(false);
      try {
        const dataUrl = await fileToStoredDataUrl(file);
        setMeta((prev) => {
          const next = {
            ...prev,
            [key]: { ...prev[key], customDataUrl: dataUrl, deleted: false },
          };
          saveSlotMeta(ideaId, next);
          return next;
        });
      } finally {
        setReady(true);
      }
    },
    [ideaId]
  );

  const resetImage = useCallback(
    (key) => {
      setMeta((prev) => {
        const next = { ...prev, [key]: { customDataUrl: null, deleted: false } };
        saveSlotMeta(ideaId, next);
        return next;
      });
    },
    [ideaId]
  );

  const deleteImage = useCallback(
    (key) => {
      setMeta((prev) => {
        const next = { ...prev, [key]: { customDataUrl: null, deleted: true } };
        saveSlotMeta(ideaId, next);
        return next;
      });
    },
    [ideaId]
  );

  const restoreImage = useCallback(
    (key) => {
      setMeta((prev) => {
        const next = { ...prev, [key]: { customDataUrl: null, deleted: false } };
        saveSlotMeta(ideaId, next);
        return next;
      });
    },
    [ideaId]
  );

  const resetAllImages = useCallback(() => {
    clearSlotMeta(ideaId);
    setMeta(loadSlotMeta(ideaId, imageSlots));
  }, [ideaId, imageSlots]);

  const images = useMemo(() => resolveImages(imageSlots, meta), [imageSlots, meta]);
  const slots = useMemo(() => buildSlotList(imageSlots, meta), [imageSlots, meta]);

  return {
    images,
    slots,
    ready,
    setImage,
    resetImage,
    deleteImage,
    restoreImage,
    resetAllImages,
  };
}
