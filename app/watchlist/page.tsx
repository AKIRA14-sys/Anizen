'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, Trash2, Play, Star, Compass, Filter, Check } from 'lucide-react';
import { WatchlistItem, WatchlistCategory } from '@/types/anime';
import { getWatchlist, removeFromWatchlist, updateWatchlistCategory, clearWatchlist } from '@/lib/watchlist';

const CATEGORIES: Array<WatchlistCategory | 'All'> = [
  'All',
  'Watching',
  'Plan to Watch',
  'Completed',
  'On Hold',
  'Dropped',
  'Favourites',
];

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<WatchlistCategory | 'All'>('All');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWatchlist(getWatchlist());
  }, []);

  const handleRemove = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = removeFromWatchlist(id);
    setWatchlist(updated);
  };

  const handleCategoryChange = (id: number, newCat: WatchlistCategory, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = updateWatchlistCategory(id, newCat);
    setWatchlist(updated);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear your entire watchlist?')) {
      const updated = clearWatchlist();
      setWatchlist(updated);
    }
  };

  const filteredList = selectedCategory === 'All'
    ? watchlist
    : watchlist.filter((item) => item.category === selectedCategory);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-brand-muted">
        <p className="text-sm">Loading your watchlist...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 min-h-[70vh]">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-4xl flex items-center gap-2">
            <Bookmark className="h-7 w-7 text-brand-accent fill-brand-accent" />
            My Watchlist
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Organize saved anime into personal categories. Stored locally in your browser.
          </p>
        </div>

        {watchlist.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-brand-border bg-brand-surface px-4 py-2 text-xs font-bold text-brand-accent">
              {watchlist.length} Saved {watchlist.length === 1 ? 'Title' : 'Titles'}
            </span>
            <button
              onClick={handleClearAll}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="mb-6 flex overflow-x-auto pb-2 no-scrollbar border-b border-brand-border/40">
        <div className="flex items-center gap-2">
          {CATEGORIES.map((cat) => {
            const count = cat === 'All'
              ? watchlist.length
              : watchlist.filter((item) => item.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-brand-accent text-white shadow-glow-sm'
                    : 'bg-brand-surface text-brand-muted hover:bg-brand-border hover:text-white'
                }`}
              >
                <span>{cat}</span>
                <span className="rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] text-white">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Watchlist Grid or Empty State */}
      {filteredList.length === 0 ? (
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-12 text-center">
          <Bookmark className="mx-auto h-12 w-12 text-brand-border mb-3" />
          <h2 className="text-xl font-bold text-white mb-1">
            {selectedCategory === 'All' ? 'Your Watchlist is Empty' : `No anime in "${selectedCategory}"`}
          </h2>
          <p className="text-sm text-brand-muted max-w-md mx-auto mb-6">
            Explore the catalog and save anime to your personal collection.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-6 py-3 text-xs font-bold text-white shadow-glow hover:bg-brand-accent-hover transition-colors"
          >
            <Compass className="h-4 w-4" />
            <span>Discover Anime Catalog</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-xl bg-brand-surface border border-brand-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent/50 hover:shadow-lg hover:shadow-brand-accent/10"
            >
              <Link href={`/anime/${item.id}`} className="relative aspect-[3/4] w-full overflow-hidden bg-gray-900">
                {item.coverImage ? (
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-brand-muted">
                    No Poster
                  </div>
                )}

                {/* Score & Remove button */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                  {item.meanScore ? (
                    <span className="flex items-center gap-1 rounded-md bg-black/85 px-2 py-0.5 text-xs font-bold text-amber-400 backdrop-blur-md border border-white/10">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {(item.meanScore / 10).toFixed(1)}
                    </span>
                  ) : <span />}

                  <button
                    onClick={(e) => handleRemove(item.id, e)}
                    aria-label="Remove from Watchlist"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-red-400 hover:bg-red-500 hover:text-white transition-all backdrop-blur-md"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Play Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-accent text-white shadow-glow">
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  </div>
                </div>
              </Link>

              <div className="flex flex-1 flex-col justify-between p-3 gap-2">
                <Link href={`/anime/${item.id}`}>
                  <h3 className="text-xs font-bold text-white transition-colors group-hover:text-brand-accent line-clamp-1">
                    {item.title}
                  </h3>
                </Link>

                {/* Category Dropdown Selector */}
                <select
                  value={item.category || 'Plan to Watch'}
                  onChange={(e) => handleCategoryChange(item.id, e.target.value as WatchlistCategory, e)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-md border border-brand-border bg-brand-dark px-2 py-1 text-[10px] font-bold text-brand-accent focus:border-brand-accent focus:outline-none"
                >
                  <option value="Watching">Watching</option>
                  <option value="Plan to Watch">Plan to Watch</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Dropped">Dropped</option>
                  <option value="Favourites">Favourites</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
