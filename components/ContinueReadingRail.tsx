'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, X, ChevronRight } from 'lucide-react';
import { MangaReadingProgress } from '@/types/manga';
import { getContinueReadingList, removeContinueReading } from '@/lib/readingProgress';

export default function ContinueReadingRail() {
  const [items, setItems] = useState<MangaReadingProgress[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setItems(getContinueReadingList());
  }, []);

  const handleRemove = (e: React.MouseEvent, mangaId: number) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = removeContinueReading(mangaId);
    setItems(updated);
  };

  if (!mounted || items.length === 0) return null;

  return (
    <section className="py-6 sm:py-8">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-brand-border/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-brand-accent inline-block" />
            <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand-accent" />
              Continue Reading
            </h2>
          </div>
        </div>

        {/* Horizontal Rail */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-brand-border">
          {items.map((item) => (
            <div
              key={item.mangaId}
              className="group relative min-w-[200px] w-[220px] sm:min-w-[240px] sm:w-[260px] shrink-0 overflow-hidden rounded-xl border border-brand-border/70 bg-brand-surface shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent/50 hover:shadow-xl"
            >
              <Link href={`/manga/${item.mangaId}/read?chapterId=${item.chapterId}`} className="relative block aspect-[16/9] w-full overflow-hidden bg-gray-900">
                <Image
                  src={item.coverImage}
                  alt={item.mangaTitle}
                  fill
                  sizes="260px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                <button
                  onClick={(e) => handleRemove(e, item.mangaId)}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-brand-muted hover:bg-black hover:text-white transition-colors z-10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs font-bold text-white z-10">
                  <span className="rounded-md bg-brand-accent px-2 py-0.5 text-[11px] font-extrabold">
                    CH {item.chapterNumber}
                  </span>
                  <span className="text-[11px] text-gray-300">
                    Page {item.pageNumber}/{item.totalPages || 1}
                  </span>
                </div>
              </Link>

              <div className="p-3">
                <Link href={`/manga/${item.mangaId}/read?chapterId=${item.chapterId}`}>
                  <h3 className="text-xs font-bold text-white transition-colors group-hover:text-brand-accent line-clamp-1">
                    {item.mangaTitle}
                  </h3>
                </Link>
                <p className="mt-0.5 text-[11px] text-brand-muted flex items-center justify-between">
                  <span>Chapter {item.chapterNumber}</span>
                  <span className="text-brand-accent group-hover:underline flex items-center gap-0.5 font-bold">
                    Resume <ChevronRight className="h-3 w-3" />
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
