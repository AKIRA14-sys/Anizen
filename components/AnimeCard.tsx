'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Bookmark, Check, Play, Calendar, Tv } from 'lucide-react';
import { AnimeMedia } from '@/types/anime';
import { getAnimeTitle, cleanDescription } from '@/lib/anilist';
import { isInWatchlist, toggleWatchlist } from '@/lib/watchlist';
import { LayoutDensity, ViewMode } from '@/lib/userPreferences';

export interface AnimeCardProps {
  anime: AnimeMedia;
  density?: LayoutDensity;
  viewMode?: ViewMode;
}

export default function AnimeCard({ anime, density = 'compact', viewMode = 'grid' }: AnimeCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const title = getAnimeTitle(anime);
  const coverUrl = anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium;
  const score = anime.meanScore || anime.averageScore;
  const synopsis = cleanDescription(anime.description);

  useEffect(() => {
    setIsSaved(isInWatchlist(anime.id));
  }, [anime.id]);

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { isSaved: newSavedState } = toggleWatchlist(anime);
    setIsSaved(newSavedState);
  };

  // --- LIST VIEW FORMAT ---
  if (viewMode === 'list') {
    return (
      <div className="group relative flex flex-col sm:flex-row gap-4 overflow-hidden rounded-xl bg-brand-surface border border-brand-border/60 p-3 sm:p-4 transition-all duration-300 hover:border-brand-accent/50 hover:shadow-lg">
        {/* Thumbnail Poster */}
        <Link href={`/anime/${anime.id}`} className="relative h-44 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-900 mx-auto sm:mx-0">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={title}
              fill
              sizes="128px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-brand-muted">No Poster</div>
          )}
          {score && (
            <span className="absolute top-2 left-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
              <Star className="h-3 w-3 fill-amber-400" />
              {(score / 10).toFixed(1)}
            </span>
          )}
        </Link>

        {/* Content & Metadata */}
        <div className="flex flex-1 flex-col justify-between py-1">
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link href={`/anime/${anime.id}`}>
                <h3 className="text-base font-extrabold text-white transition-colors group-hover:text-brand-accent line-clamp-1">
                  {title}
                </h3>
              </Link>
              <button
                onClick={handleWatchlistClick}
                aria-label={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all ${
                  isSaved
                    ? 'border-brand-accent bg-brand-accent/20 text-brand-accent'
                    : 'border-brand-border bg-brand-dark text-brand-muted hover:text-white hover:border-brand-accent'
                }`}
              >
                {isSaved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
              {anime.seasonYear && (
                <span className="flex items-center gap-1 rounded bg-brand-dark px-2 py-0.5 border border-brand-border/60">
                  <Calendar className="h-3 w-3 text-brand-accent" />
                  {anime.seasonYear}
                </span>
              )}
              {anime.format && (
                <span className="flex items-center gap-1 rounded bg-brand-dark px-2 py-0.5 border border-brand-border/60">
                  <Tv className="h-3 w-3 text-blue-400" />
                  {anime.format}
                </span>
              )}
              {anime.episodes && (
                <span className="rounded bg-brand-dark px-2 py-0.5 border border-brand-border/60">
                  {anime.episodes} EPS
                </span>
              )}
              {anime.status && (
                <span className="rounded bg-brand-dark px-2 py-0.5 text-emerald-400 border border-brand-border/60">
                  {anime.status}
                </span>
              )}
            </div>

            <p className="mt-2 text-xs text-brand-muted line-clamp-2 leading-relaxed">
              {synopsis}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-brand-border/40">
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {anime.genres.slice(0, 3).map((g) => (
                  <span key={g} className="rounded bg-brand-dark/80 px-2 py-0.5 text-[10px] font-semibold text-gray-300">
                    {g}
                  </span>
                ))}
              </div>
            )}
            <Link
              href={`/watch/${anime.id}?ep=1`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-bold text-white shadow-glow hover:bg-brand-accent-hover transition-all ml-auto"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Watch</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- GRID VIEW FORMAT (COMPACT vs COMFORTABLE) ---
  const isCompact = density === 'compact';

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl bg-brand-surface border border-brand-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent/50 hover:shadow-lg hover:shadow-brand-accent/10"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      {/* Poster Container */}
      <Link href={`/anime/${anime.id}`} className="relative aspect-[3/4] w-full overflow-hidden bg-gray-900">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-brand-muted">
            No Poster
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1 z-10">
          {score ? (
            <span className="flex items-center gap-0.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] sm:text-xs font-bold text-amber-400 backdrop-blur-md border border-white/10">
              <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-amber-400" />
              {(score / 10).toFixed(1)}
            </span>
          ) : <span />}

          <button
            onClick={handleWatchlistClick}
            aria-label={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
            className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full transition-all backdrop-blur-md ${
              isSaved
                ? 'bg-brand-accent text-white shadow-glow-sm'
                : 'bg-black/60 text-white/80 hover:bg-black/90 hover:text-white'
            }`}
          >
            {isSaved ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Bookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
          </button>
        </div>

        {/* Hover Overlay Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-brand-accent text-white shadow-glow">
            <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Season / Format badge overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 text-[10px] sm:text-[11px] font-medium text-gray-300">
          <div className="flex items-center justify-between">
            <span>{anime.seasonYear ? anime.seasonYear : anime.format || ''}</span>
            <span>{anime.episodes ? `${anime.episodes} EPS` : (anime.status || '')}</span>
          </div>
        </div>
      </Link>

      {/* Title & Metadata Details */}
      <div className={`flex flex-1 flex-col justify-between ${isCompact ? 'p-2 sm:p-2.5' : 'p-3'}`}>
        <Link href={`/anime/${anime.id}`}>
          <h3 className={`font-bold text-white transition-colors group-hover:text-brand-accent line-clamp-1 ${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
            {title}
          </h3>
        </Link>
        {anime.genres && anime.genres.length > 0 && (
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-brand-muted line-clamp-1">
            {anime.genres.slice(0, isCompact ? 1 : 2).join(' • ')}
          </p>
        )}
      </div>

      {/* QUICK PREVIEW POPOVER (Desktop Hover) */}
      {showPreview && (
        <div className="hidden lg:block absolute left-0 bottom-full z-50 mb-2 w-64 rounded-xl border border-brand-border bg-brand-dark/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-200 pointer-events-none">
          <h4 className="font-extrabold text-sm text-white line-clamp-1 mb-1">{title}</h4>
          <div className="flex items-center gap-2 text-[11px] text-brand-muted mb-2">
            {score && <span className="text-amber-400 font-bold">★ {(score / 10).toFixed(1)}</span>}
            {anime.format && <span>• {anime.format}</span>}
            {anime.seasonYear && <span>• {anime.seasonYear}</span>}
            {anime.episodes && <span>• {anime.episodes} eps</span>}
          </div>
          <p className="text-[11px] text-gray-300 line-clamp-3 leading-relaxed mb-3">
            {synopsis}
          </p>
          {anime.genres && (
            <div className="flex flex-wrap gap-1 mb-2">
              {anime.genres.slice(0, 3).map((g) => (
                <span key={g} className="rounded bg-brand-surface border border-brand-border px-1.5 py-0.5 text-[9px] font-semibold text-gray-300">
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
