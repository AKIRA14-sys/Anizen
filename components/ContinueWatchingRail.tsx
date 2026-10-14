'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, X, Clock, ChevronRight } from 'lucide-react';
import { WatchProgressItem, getContinueWatchingList, removeContinueWatching } from '@/lib/watchProgress';

export default function ContinueWatchingRail() {
  const [items, setItems] = useState<WatchProgressItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setItems(getContinueWatchingList());
  }, []);

  const handleRemove = (e: React.MouseEvent, animeId: number) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = removeContinueWatching(animeId);
    setItems(updated);
  };

  if (!mounted || items.length === 0) return null;

  return (
    <section className="py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-brand-border/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-brand-accent inline-block" />
            <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-accent" />
              Continue Watching
            </h2>
          </div>
        </div>

        {/* Horizontal Rail */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-brand-border hover:scrollbar-thumb-brand-accent">
          {items.map((item) => {
            const progressPercent = Math.min(
              100,
              Math.max(10, Math.round((item.episodeNumber / (item.totalEpisodes || 12)) * 100))
            );

            return (
              <div
                key={item.animeId}
                className="group relative min-w-[200px] w-[220px] sm:min-w-[240px] sm:w-[260px] flex-shrink-0 overflow-hidden rounded-xl border border-brand-border/70 bg-brand-surface shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent/50 hover:shadow-xl"
              >
                {/* Image Banner / Cover */}
                <Link href={`/watch/${item.animeId}?ep=${item.episodeNumber}`} className="relative block aspect-[16/9] w-full overflow-hidden bg-gray-900">
                  <Image
                    src={item.bannerImage || item.coverImage}
                    alt={item.animeTitle}
                    fill
                    sizes="(max-width: 640px) 200px, 260px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-accent text-white shadow-glow">
                      <Play className="h-5 w-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => handleRemove(e, item.animeId)}
                    aria-label="Remove from continue watching"
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-brand-muted hover:bg-black hover:text-white transition-colors z-10"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  {/* Episode Badge */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs font-bold text-white z-10">
                    <span className="rounded-md bg-brand-accent/90 px-2 py-0.5 text-[11px] font-extrabold shadow-sm">
                      EP {item.episodeNumber}
                    </span>
                    <span className="text-[11px] text-gray-300">
                      of {item.totalEpisodes || '?'}
                    </span>
                  </div>
                </Link>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-brand-dark">
                  <div
                    className="h-full bg-gradient-to-r from-brand-accent to-amber-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Footer Details */}
                <div className="p-3">
                  <Link href={`/watch/${item.animeId}?ep=${item.episodeNumber}`}>
                    <h3 className="text-xs font-bold text-white transition-colors group-hover:text-brand-accent line-clamp-1">
                      {item.animeTitle}
                    </h3>
                  </Link>
                  <p className="mt-0.5 text-[11px] text-brand-muted flex items-center justify-between">
                    <span>Episode {item.episodeNumber}</span>
                    <span className="text-brand-accent group-hover:underline flex items-center gap-0.5">
                      Resume <ChevronRight className="h-3 w-3" />
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
