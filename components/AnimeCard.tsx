'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Bookmark, Check, Play } from 'lucide-react';
import { AnimeMedia } from '@/types/anime';
import { getAnimeTitle } from '@/lib/anilist';
import { isInWatchlist, toggleWatchlist } from '@/lib/watchlist';

interface AnimeCardProps {
  anime: AnimeMedia;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const title = getAnimeTitle(anime);
  const coverUrl = anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium;
  const score = anime.meanScore || anime.averageScore;

  useEffect(() => {
    setIsSaved(isInWatchlist(anime.id));
  }, [anime.id]);

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { isSaved: newSavedState } = toggleWatchlist(anime);
    setIsSaved(newSavedState);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-brand-surface border border-brand-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent/50 hover:shadow-lg hover:shadow-brand-accent/10">
      {/* Poster Container */}
      <Link href={`/anime/${anime.id}`} className="relative aspect-[3/4] w-full overflow-hidden bg-gray-900">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-brand-muted">
            No Poster
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10">
          {score ? (
            <span className="flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-xs font-bold text-amber-400 backdrop-blur-md border border-white/10">
              <Star className="h-3 w-3 fill-amber-400" />
              {(score / 10).toFixed(1)}
            </span>
          ) : <span />}

          <button
            onClick={handleWatchlistClick}
            aria-label={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-all backdrop-blur-md ${
              isSaved
                ? 'bg-brand-accent text-white shadow-glow-sm'
                : 'bg-black/60 text-white/80 hover:bg-black/90 hover:text-white'
            }`}
          >
            {isSaved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Hover Overlay Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-accent text-white shadow-glow">
            <Play className="h-5 w-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Season / Episode count overlay at bottom of poster */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-[11px] font-medium text-gray-300">
          <div className="flex items-center justify-between">
            <span>{anime.seasonYear ? anime.seasonYear : ''}</span>
            <span>{anime.episodes ? `${anime.episodes} EPS` : (anime.status || '')}</span>
          </div>
        </div>
      </Link>

      {/* Title & Metadata Details */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <Link href={`/anime/${anime.id}`}>
          <h3 className="text-sm font-bold text-white transition-colors group-hover:text-brand-accent line-clamp-1">
            {title}
          </h3>
        </Link>
        {anime.genres && anime.genres.length > 0 && (
          <p className="mt-1 text-[11px] text-brand-muted line-clamp-1">
            {anime.genres.slice(0, 2).join(' • ')}
          </p>
        )}
      </div>
    </div>
  );
}
