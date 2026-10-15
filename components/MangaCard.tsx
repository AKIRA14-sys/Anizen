'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, BookOpen, Bookmark, Check } from 'lucide-react';
import { MangaMedia } from '@/types/manga';
import { getMangaTitle } from '@/lib/manga';
import { isInMangaLibrary, toggleMangaLibrary } from '@/lib/mangaLibrary';

interface MangaCardProps {
  manga: MangaMedia;
}

export default function MangaCard({ manga }: MangaCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const title = getMangaTitle(manga);
  const coverUrl = manga.coverImage.extraLarge || manga.coverImage.large || manga.coverImage.medium;
  const score = manga.meanScore || manga.averageScore;

  useEffect(() => {
    setIsSaved(isInMangaLibrary(manga.id));
  }, [manga.id]);

  const handleLibraryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { isSaved: newSaved } = toggleMangaLibrary(manga);
    setIsSaved(newSaved);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-brand-surface border border-brand-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent/50 hover:shadow-lg">
      <Link href={`/manga/${manga.id}`} className="relative aspect-[3/4] w-full overflow-hidden bg-gray-900">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-brand-muted">No Cover</div>
        )}

        {/* Top Badges */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1 z-10">
          {score ? (
            <span className="flex items-center gap-0.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-md border border-white/10">
              <Star className="h-2.5 w-2.5 fill-amber-400" />
              {(score / 10).toFixed(1)}
            </span>
          ) : <span />}

          <button
            onClick={handleLibraryClick}
            aria-label={isSaved ? 'Remove from Library' : 'Add to Library'}
            className={`flex h-6 w-6 items-center justify-center rounded-full transition-all backdrop-blur-md ${
              isSaved
                ? 'bg-brand-accent text-white shadow-glow-sm'
                : 'bg-black/60 text-white/80 hover:bg-black/90 hover:text-white'
            }`}
          >
            {isSaved ? <Check className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
          </button>
        </div>

        {/* Read Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent text-white shadow-glow">
            <BookOpen className="h-4 w-4" />
          </div>
        </div>

        {/* Format / Chapters Badge */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 text-[10px] font-medium text-gray-300">
          <div className="flex items-center justify-between">
            <span>MANGA</span>
            <span>{manga.chapters ? `${manga.chapters} CHS` : (manga.status || '')}</span>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-between p-2.5">
        <Link href={`/manga/${manga.id}`}>
          <h3 className="text-xs sm:text-sm font-bold text-white transition-colors group-hover:text-brand-accent line-clamp-1">
            {title}
          </h3>
        </Link>
        {manga.genres && manga.genres.length > 0 && (
          <p className="mt-0.5 text-[10px] text-brand-muted line-clamp-1">
            {manga.genres.slice(0, 2).join(' • ')}
          </p>
        )}
      </div>
    </div>
  );
}
