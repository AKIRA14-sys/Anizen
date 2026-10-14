'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Plus, Check, ChevronLeft, ChevronRight, Star, Calendar } from 'lucide-react';
import { AnimeMedia } from '@/types/anime';
import { getAnimeTitle, cleanDescription } from '@/lib/anilist';
import { isInWatchlist, toggleWatchlist } from '@/lib/watchlist';

interface HeroCarouselProps {
  items: AnimeMedia[];
}

export default function HeroCarousel({ items }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHoveredOrTouched, setIsHoveredOrTouched] = useState(false);
  const [inWatchlistMap, setInWatchlistMap] = useState<Record<number, boolean>>({});

  // Touch Swipe State
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto Rotation Timer Ref
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync Watchlist state client-side
  useEffect(() => {
    if (items.length > 0) {
      const initialMap: Record<number, boolean> = {};
      items.forEach((item) => {
        initialMap[item.id] = isInWatchlist(item.id);
      });
      setInWatchlistMap(initialMap);
    }
  }, [items]);

  const handleToggleWatchlist = (media: AnimeMedia) => {
    const { isSaved } = toggleWatchlist(media);
    setInWatchlistMap((prev) => ({ ...prev, [media.id]: isSaved }));
  };

  const nextSlide = useCallback(() => {
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prevSlide = useCallback(() => {
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play setup (6 seconds)
  useEffect(() => {
    // Check reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || isHoveredOrTouched || items.length <= 1) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [items.length, isHoveredOrTouched, nextSlide]);

  // Touch Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsHoveredOrTouched(true);
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsHoveredOrTouched(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!items || items.length === 0) {
    return null;
  }

  const currentAnime = items[currentIndex];
  const title = getAnimeTitle(currentAnime);
  const description = cleanDescription(currentAnime.description);
  const bgImage = currentAnime.bannerImage || currentAnime.coverImage.extraLarge || currentAnime.coverImage.large;
  const isSaved = inWatchlistMap[currentAnime.id] || false;

  return (
    <section
      className="relative w-full overflow-hidden bg-brand-dark text-white select-none"
      onMouseEnter={() => setIsHoveredOrTouched(true)}
      onMouseLeave={() => setIsHoveredOrTouched(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Banner Container */}
      <div className="relative h-[480px] w-full sm:h-[540px] md:h-[600px] lg:h-[640px]">
        {bgImage ? (
          <Image
            src={bgImage}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center transition-all duration-700 brightness-90"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
        )}

        {/* Gradient Overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/80 to-transparent hidden sm:block" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/40 via-transparent to-brand-dark" />

        {/* Hero Slide Content */}
        <div className="absolute inset-0 flex items-end sm:items-center">
          <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pb-0 lg:px-8">
            <div className="max-w-2xl">
              {/* Badges / Meta Info */}
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="rounded bg-brand-accent px-2.5 py-1 font-bold tracking-wide text-white uppercase shadow-sm">
                  Featured
                </span>
                {currentAnime.seasonYear && (
                  <span className="flex items-center gap-1 rounded bg-black/50 backdrop-blur-md px-2.5 py-1 text-gray-300 border border-white/10">
                    <Calendar className="h-3.5 w-3.5 text-brand-accent" />
                    {currentAnime.season ? `${currentAnime.season} ` : ''}{currentAnime.seasonYear}
                  </span>
                )}
                {(currentAnime.meanScore || currentAnime.averageScore) && (
                  <span className="flex items-center gap-1 rounded bg-black/50 backdrop-blur-md px-2.5 py-1 text-amber-400 border border-white/10 font-semibold">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    {((currentAnime.meanScore || currentAnime.averageScore || 0) / 10).toFixed(1)}
                  </span>
                )}
                {currentAnime.genres && currentAnime.genres.length > 0 && (
                  <span className="hidden sm:inline-block text-gray-300 font-medium text-xs">
                    • {currentAnime.genres.slice(0, 3).join(', ')}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="mb-3 text-2xl font-black tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl line-clamp-2 leading-tight">
                {title}
              </h1>

              {/* Synopsis */}
              <p className="mb-6 text-sm text-gray-300 line-clamp-2 sm:line-clamp-3 sm:text-base leading-relaxed max-w-xl">
                {description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/anime/${currentAnime.id}`}
                  className="group flex items-center gap-2 rounded-xl bg-brand-accent px-6 py-3 font-bold text-white shadow-glow transition-all hover:bg-brand-accent-hover hover:scale-105 active:scale-95"
                >
                  <Play className="h-5 w-5 fill-white" />
                  <span>WATCH NOW</span>
                </Link>

                <button
                  onClick={() => handleToggleWatchlist(currentAnime)}
                  className={`flex items-center gap-2 rounded-xl border px-5 py-3 font-semibold transition-all backdrop-blur-md ${
                    isSaved
                      ? 'border-brand-accent bg-brand-accent/20 text-brand-accent'
                      : 'border-white/20 bg-black/40 text-white hover:bg-black/60 hover:border-white/40'
                  }`}
                  aria-label={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                >
                  {isSaved ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  <span>{isSaved ? 'In Watchlist' : 'Add Watchlist'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Prev/Next Buttons (Desktop / Tablet) */}
        <div className="absolute inset-y-0 left-4 hidden items-center sm:flex">
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-brand-accent hover:border-brand-accent"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-4 hidden items-center sm:flex">
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-brand-accent hover:border-brand-accent"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Indicators / Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-8 bg-brand-accent shadow-glow-sm'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
