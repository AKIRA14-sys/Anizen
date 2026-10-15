'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart2,
  Tv,
  CheckCircle,
  Bookmark,
  Star,
  FileText,
  Clock,
  Compass,
  Bell,
  Trash2,
} from 'lucide-react';
import { getContinueWatchingList, clearWatchHistory, WatchProgressItem } from '@/lib/watchProgress';
import { getWatchlist } from '@/lib/watchlist';
import { getPersonalNotesMap, getRemindersMap, PersonalNote, deletePersonalNote } from '@/lib/userPreferences';
import { WatchlistItem } from '@/types/anime';

export default function PersonalStatsPage() {
  const [mounted, setMounted] = useState(false);
  const [progressItems, setProgressItems] = useState<WatchProgressItem[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [personalNotesMap, setPersonalNotesMap] = useState<Record<number, PersonalNote>>({});
  const [remindersCount, setRemindersCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    setProgressItems(getContinueWatchingList());
    setWatchlistItems(getWatchlist());
    setPersonalNotesMap(getPersonalNotesMap());
    setRemindersCount(Object.keys(getRemindersMap()).length);
  }, []);

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your entire watch progress history?')) {
      clearWatchHistory();
      setProgressItems([]);
    }
  };

  const handleDeleteNote = (animeId: number) => {
    deletePersonalNote(animeId);
    setPersonalNotesMap(getPersonalNotesMap());
  };

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-brand-muted">
        <p className="text-sm">Calculating your anime statistics...</p>
      </div>
    );
  }

  // Calculate stats
  const totalEpisodesWatched = progressItems.reduce((acc, item) => {
    return acc + (item.watchedEpisodes ? item.watchedEpisodes.length : 1);
  }, 0);

  const completedAnimeCount = watchlistItems.filter((i) => i.category === 'Completed').length;
  const watchingAnimeCount = watchlistItems.filter((i) => i.category === 'Watching').length;
  const planToWatchCount = watchlistItems.filter((i) => i.category === 'Plan to Watch').length;

  const notesList = Object.values(personalNotesMap);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 border-b border-brand-border/60 pb-6">
        <div className="flex items-center gap-2.5 text-brand-accent">
          <BarChart2 className="h-7 w-7" />
          <h1 className="text-2xl font-black text-white sm:text-3xl">Personal Statistics</h1>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-brand-muted">
          Your personal anime watching stats, saved notes, ratings, and viewing history.
        </p>
      </div>

      {/* Stats Cards Overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-brand-border/60 bg-brand-surface p-5 text-center">
          <Tv className="mx-auto h-7 w-7 text-brand-accent mb-2" />
          <div className="text-2xl font-black text-white">{totalEpisodesWatched}</div>
          <p className="text-xs text-brand-muted font-medium mt-1">Episodes Watched</p>
        </div>

        <div className="rounded-2xl border border-brand-border/60 bg-brand-surface p-5 text-center">
          <CheckCircle className="mx-auto h-7 w-7 text-emerald-400 mb-2" />
          <div className="text-2xl font-black text-white">{completedAnimeCount}</div>
          <p className="text-xs text-brand-muted font-medium mt-1">Completed Anime</p>
        </div>

        <div className="rounded-2xl border border-brand-border/60 bg-brand-surface p-5 text-center">
          <Bookmark className="mx-auto h-7 w-7 text-blue-400 mb-2" />
          <div className="text-2xl font-black text-white">{watchlistItems.length}</div>
          <p className="text-xs text-brand-muted font-medium mt-1">Watchlist Titles</p>
        </div>

        <div className="rounded-2xl border border-brand-border/60 bg-brand-surface p-5 text-center">
          <FileText className="mx-auto h-7 w-7 text-amber-400 mb-2" />
          <div className="text-2xl font-black text-white">{notesList.length}</div>
          <p className="text-xs text-brand-muted font-medium mt-1">Private Notes</p>
        </div>
      </div>

      {/* Watchlist Category Breakdown */}
      <div className="mb-8 rounded-2xl border border-brand-border bg-brand-surface p-6">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span className="h-4 w-1.5 rounded-full bg-brand-accent inline-block" />
          Watchlist Category Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
          <div className="rounded-xl border border-brand-border/40 bg-brand-dark p-3">
            <span className="block text-lg font-black text-amber-400">{watchingAnimeCount}</span>
            <span className="text-[11px] text-brand-muted">Watching</span>
          </div>
          <div className="rounded-xl border border-brand-border/40 bg-brand-dark p-3">
            <span className="block text-lg font-black text-blue-400">{planToWatchCount}</span>
            <span className="text-[11px] text-brand-muted">Plan to Watch</span>
          </div>
          <div className="rounded-xl border border-brand-border/40 bg-brand-dark p-3">
            <span className="block text-lg font-black text-emerald-400">{completedAnimeCount}</span>
            <span className="text-[11px] text-brand-muted">Completed</span>
          </div>
          <div className="rounded-xl border border-brand-border/40 bg-brand-dark p-3">
            <span className="block text-lg font-black text-orange-400">
              {watchlistItems.filter((i) => i.category === 'On Hold').length}
            </span>
            <span className="text-[11px] text-brand-muted">On Hold</span>
          </div>
          <div className="rounded-xl border border-brand-border/40 bg-brand-dark p-3">
            <span className="block text-lg font-black text-red-400">
              {watchlistItems.filter((i) => i.category === 'Dropped').length}
            </span>
            <span className="text-[11px] text-brand-muted">Dropped</span>
          </div>
          <div className="rounded-xl border border-brand-border/40 bg-brand-dark p-3">
            <span className="block text-lg font-black text-pink-400">
              {watchlistItems.filter((i) => i.category === 'Favourites').length}
            </span>
            <span className="text-[11px] text-brand-muted">Favourites</span>
          </div>
        </div>
      </div>

      {/* Private Notes & Ratings Section */}
      <div className="mb-8 rounded-2xl border border-brand-border bg-brand-surface p-6">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span className="h-4 w-1.5 rounded-full bg-brand-accent inline-block" />
          Saved Private Notes & Personal Ratings
        </h2>

        {notesList.length === 0 ? (
          <p className="text-xs text-brand-muted">
            You haven't added any private notes yet. Visit any anime details page to save your thoughts and personal ratings.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notesList.map((n) => (
              <div
                key={n.animeId}
                className="flex flex-col justify-between rounded-xl border border-brand-border/60 bg-brand-dark p-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link href={`/anime/${n.animeId}`}>
                      <h3 className="text-xs font-bold text-white hover:text-brand-accent line-clamp-1">
                        {n.animeTitle}
                      </h3>
                    </Link>
                    <button
                      onClick={() => handleDeleteNote(n.animeId)}
                      className="text-brand-muted hover:text-red-400"
                      title="Delete Note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {n.rating && (
                    <div className="mb-2 flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span>{n.rating} / 10 Personal Rating</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">
                    {n.note}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-brand-border/30 text-[10px] text-brand-muted">
                  Updated {new Date(n.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Viewing Progress History */}
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
        <div className="mb-4 flex items-center justify-between border-b border-brand-border/40 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="h-4 w-1.5 rounded-full bg-brand-accent inline-block" />
            Watch History
          </h2>
          {progressItems.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs font-bold text-red-400 hover:underline"
            >
              Clear Watch History
            </button>
          )}
        </div>

        {progressItems.length === 0 ? (
          <p className="text-xs text-brand-muted">No viewing history recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {progressItems.map((p) => (
              <div
                key={p.animeId}
                className="flex items-center gap-3 rounded-xl border border-brand-border/60 bg-brand-dark p-3"
              >
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-900">
                  <Image src={p.coverImage} alt={p.animeTitle} fill className="object-cover" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <Link href={`/watch/${p.animeId}?ep=${p.episodeNumber}`}>
                    <h3 className="text-xs font-bold text-white hover:text-brand-accent line-clamp-1">
                      {p.animeTitle}
                    </h3>
                  </Link>
                  <p className="text-[11px] text-brand-muted mt-0.5">
                    Last Watched: EP {p.episodeNumber}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
