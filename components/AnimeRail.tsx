import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AnimeMedia } from '@/types/anime';
import AnimeCard from './AnimeCard';

interface AnimeRailProps {
  title: string;
  items: AnimeMedia[];
  viewAllHref?: string;
  subtitle?: string;
}

export default function AnimeRail({ title, items, viewAllHref, subtitle }: AnimeRailProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 flex items-end justify-between border-b border-brand-border/40 pb-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl flex items-center gap-2">
              <span className="h-5 w-1.5 rounded-full bg-brand-accent inline-block" />
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-xs text-brand-muted">{subtitle}</p>}
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

        {/* Responsive Grid */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.slice(0, 6).map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </div>
    </section>
  );
}
