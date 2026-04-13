'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  // Reset index when lightbox opens with a new initialIndex
  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const prev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onOpenChange, prev, next]);

  if (!open || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute end-4 top-4 z-10 cursor-pointer text-white hover:bg-white/10"
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(false);
        }}
        aria-label="Close"
      >
        <X className="size-5" />
      </Button>

      {/* Previous */}
      {images.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute start-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer text-white hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous image"
        >
          <ChevronLeft className="size-6" />
        </Button>
      )}

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt={`Attachment ${index + 1} of ${images.length}`}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {images.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute end-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer text-white hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next image"
        >
          <ChevronRight className="size-6" />
        </Button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
