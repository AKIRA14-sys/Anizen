'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { AnimeMedia } from '@/types/anime';
import AnimeCard from './AnimeCard';

interface AnimeRailProps {
  title: string;
  items: AnimeMedia[];
  viewAllHref?: string;
  subtitle?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function AnimeRail({
  title,
  items,
  viewAllHref,
  subtitle,
  onLoadMore,
  hasMore = false,
}: AnimeRailProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    const nearEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 100;
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);

    if (nearEnd && hasMore && onLoadMore && !isLoadingMore) {
      setIsLoadingMore(true);
      onLoadMore();
      setTimeout(() => setIsLoadingMore(false), 800);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [items, hasMore, onLoadMore]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="py-5 sm:py-7">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-3.5 flex items-end justify-between border-b border-brand-border/40 pb-2.5">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl flex items-center gap-2">
              <span className="h-5 w-1.5 rounded-full bg-brand-accent inline-block" />
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-brand-muted">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {/* Scroll Navigation Buttons for Desktop */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                  canScrollLeft
                    ? 'border-brand-border bg-brand-surface text-white hover:border-brand-accent hover:bg-brand-accent/20'
                    : 'border-brand-border/30 bg-brand-dark text-brand-muted/40 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight && !hasMore}
                aria-label="Scroll right"
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                  canScrollRight || hasMore
                    ? 'border-brand-border bg-brand-surface text-white hover:border-brand-accent hover:bg-brand-accent/20'
                    : 'border-brand-border/30 bg-brand-dark text-brand-muted/40 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="group flex items-center gap-1 text-xs font-semibold text-brand-accent transition-colors hover:text-brand-accent-light sm:text-sm"
              >
                <span>View All</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>

        {/* Horizontal Scrollable Rail */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-brand-border hover:scrollbar-thumb-brand-accent no-scrollbar sm:scroll-smooth"
        >
          {items.map((anime) => (
            <div
              key={anime.id}
              className="w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] shrink-0"
            >
              <AnimeCard anime={anime} density="compact" viewMode="grid" />
            </div>
          ))}

          {isLoadingMore && (
            <div className="flex h-[240px] w-[140px] shrink-0 items-center justify-center rounded-xl bg-brand-surface border border-brand-border">
              <Loader2 className="h-6 w-6 animate-spin text-brand-accent" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
