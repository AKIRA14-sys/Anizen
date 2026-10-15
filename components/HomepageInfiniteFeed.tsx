'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { AnimeMedia } from '@/types/anime';
import { getTrendingAnime } from '@/lib/anilist';
import AnimeCard from './AnimeCard';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';

interface HomepageInfiniteFeedProps {
  initialItems: AnimeMedia[];
}

export default function HomepageInfiniteFeed({ initialItems }: HomepageInfiniteFeedProps) {
  const [items, setItems] = useState<AnimeMedia[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchNextBatch = useCallback(async () => {
    if (isFetchingRef.current || loadingMore || !hasNextPage) return;

    isFetchingRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const newMedia = await getTrendingAnime(nextPage, 18);

      if (!newMedia || newMedia.length === 0) {
        setHasNextPage(false);
      } else {
        setItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const filteredNew = newMedia.filter((item) => !existingIds.has(item.id));
          return [...prev, ...filteredNew];
        });
        setPage(nextPage);
      }
    } catch (e) {
      console.error('Failed to load next homepage batch:', e);
    } finally {
      isFetchingRef.current = false;
      setLoadingMore(false);
    }
  }, [page, hasNextPage, loadingMore]);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: fetchNextBatch,
    hasMore: hasNextPage,
    isLoading: loadingMore,
  });

  return (
    <section className="py-6 sm:py-8">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-4 flex items-center justify-between border-b border-brand-border/40 pb-3">
          <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-accent" />
            <span>Discover More Anime</span>
          </h2>
          <span className="text-xs text-brand-muted font-medium">
            Auto-loading continuous catalog
          </span>
        </div>

        {/* Anime Grid */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {items.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} density="compact" viewMode="grid" />
          ))}
        </div>

        {/* INFINITE SCROLL SENTINEL */}
        <div ref={sentinelRef} className="mt-8 py-6 text-center">
          {loadingMore && (
            <div className="flex items-center justify-center gap-2 text-sm text-brand-muted">
              <Loader2 className="h-5 w-5 animate-spin text-brand-accent" />
              <span>Loading more anime...</span>
            </div>
          )}
          {!hasNextPage && items.length > 0 && (
            <p className="text-xs font-semibold text-brand-muted">
              You've explored all current trending titles.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
