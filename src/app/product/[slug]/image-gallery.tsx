"use client";

import { useState, useRef, useCallback } from "react";

interface ImageGalleryProps {
  images: string[];
  title: string;
  primaryColor: string;
}

export default function ImageGallery({ images, title, primaryColor }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  // Touch/swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold && selected < images.length - 1) {
      setSelected((p) => p + 1);
    } else if (diff < -threshold && selected > 0) {
      setSelected((p) => p - 1);
    }
  }, [selected, images.length]);

  if (images.length === 0) {
    return (
      <div
        className="aspect-square rounded-xl flex flex-col items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}08 100%)`,
          border: `2px dashed ${primaryColor}30`,
        }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
          style={{ backgroundColor: primaryColor + "15" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="m21 15-5-5L5 21"/>
          </svg>
        </div>
        <span className="text-sm font-medium" style={{ color: primaryColor, opacity: 0.6 }}>
          No photos yet
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main image with swipe support */}
        <div
          className="aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in relative touch-pan-y"
          onClick={() => {
            setLightbox(true);
            const trackFn = (window as unknown as Record<string, unknown>).__mwsTrack;
            if (typeof trackFn === "function") (trackFn as (e: string) => void)("IMAGE_CLICK");
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={images[selected]}
            alt={`${title} ${selected + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />

          {/* Image counter badge */}
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
            {selected + 1} / {images.length}
          </div>

          {/* Swipe hint dots on mobile */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:hidden">
              {images.map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: i === selected ? "#fff" : "rgba(255,255,255,0.4)",
                    transform: i === selected ? "scale(1.3)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Desktop arrow buttons */}
          {images.length > 1 && (
            <div className="hidden sm:block">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((p) => (p - 1 + images.length) % images.length);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 backdrop-blur-sm transition-colors"
              >
                &#8249;
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((p) => (p + 1) % images.length);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 backdrop-blur-sm transition-colors"
              >
                &#8250;
              </button>
            </div>
          )}
        </div>

        {/* Thumbnails - scrollable */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all"
                style={{
                  borderColor: i === selected ? primaryColor : "transparent",
                  opacity: i === selected ? 1 : 0.7,
                }}
              >
                <img
                  src={img}
                  alt={`${title} thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={(e) => {
            handleTouchEnd();
            e.stopPropagation();
          }}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {images.length > 1 && (
            <div className="hidden sm:block">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((p) => (p - 1 + images.length) % images.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-5xl z-10 select-none"
              >
                &#8249;
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((p) => (p + 1) % images.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-5xl z-10 select-none"
              >
                &#8250;
              </button>
            </div>
          )}

          <img
            src={images[selected]}
            alt={`${title} ${selected + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelected(i); }}
                  className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{
                    backgroundColor: i === selected ? "#fff" : "rgba(255,255,255,0.4)",
                    transform: i === selected ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
