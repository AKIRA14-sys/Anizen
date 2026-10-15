'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, Loader2, BookOpen, X, RefreshCw } from 'lucide-react';
import { MangaMedia } from '@/types/manga';
import { searchManga } from '@/lib/manga';
import MangaCard from '@/components/MangaCard';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';

const MANGA_GENRES = [
  'All',
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

const MANGA_SORT_OPTIONS = [
  { label: 'Most Popular', value: 'POPULARITY_DESC' },
  { label: 'Trending', value: 'TRENDING_DESC' },
  { label: 'Highest Rated', value: 'SCORE_DESC' },
  { label: 'Newest', value: 'START_DATE_DESC' },
];

function MangaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('q') || '';
  const initialGenre = searchParams.get('genre') || 'All';
  const initialSort = searchParams.get('sort') || 'POPULARITY_DESC';

  const [query, setQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedSort, setSelectedSort] = useState(initialSort);

  const [results, setResults] = useState<MangaMedia[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const activeReqId = useRef(0);

  const performInitialSearch = useCallback(async (q: string, g: string, s: string) => {
    const reqId = ++activeReqId.current;
    setLoading(true);
    setError(null);
    setPage(1);

    try {
      const data = await searchManga(q, g, s, 1, 24);
      if (reqId === activeReqId.current) {
        setResults(data.media);
        setHasNextPage(data.hasNextPage);
      }
    } catch (err) {
      if (reqId === activeReqId.current) {
        console.error(err);
        setError('Failed to fetch manga catalog. Please try again.');
      }
    } finally {
      if (reqId === activeReqId.current) {
        setLoading(false);
      }
    }
  }, []);

  const loadNextPage = useCallback(async () => {
    if (isFetchingRef.current || loading || loadingMore || !hasNextPage) return;

    isFetchingRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;
    const reqId = activeReqId.current;

    try {
      const data = await searchManga(query, selectedGenre, selectedSort, nextPage, 24);
      if (reqId === activeReqId.current) {
        setResults((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const filteredNew = data.media.filter((item) => !existingIds.has(item.id));
          return [...prev, ...filteredNew];
        });
        setPage(nextPage);
        setHasNextPage(data.hasNextPage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      isFetchingRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasNextPage, page, query, selectedGenre, selectedSort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performInitialSearch(query, selectedGenre, selectedSort);

      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (selectedGenre !== 'All') params.set('genre', selectedGenre);
      if (selectedSort !== 'POPULARITY_DESC') params.set('sort', selectedSort);

      const newUrl = params.toString() ? `/manga?${params.toString()}` : '/manga';
      router.replace(newUrl, { scroll: false });
    }, 350);

    return () => clearTimeout(timer);
  }, [performInitialSearch, query, selectedGenre, selectedSort, router]);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadNextPage,
    hasMore: hasNextPage,
    isLoading: loading || loadingMore,
  });

  const clearFilters = () => {
    setQuery('');
    setSelectedGenre('All');
    setSelectedSort('POPULARITY_DESC');
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Search Header Banner */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white sm:text-4xl flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-brand-accent" />
          Manga Catalog & In-App Reader
        </h1>
        <p className="mt-2 text-sm text-brand-muted max-w-xl">
          Browse popular manga, read chapters inside ANIZEN, and track your reading progress.
        </p>
      </div>

      {/* Controls Container */}
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4 sm:p-6 shadow-xl">
        {/* Search Bar Input */}
        <div className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manga title..."
            className="w-full rounded-xl border border-brand-border/80 bg-brand-dark py-3.5 pl-11 pr-10 text-white placeholder-brand-muted transition-all focus:border-brand-accent focus:outline-none text-sm sm:text-base"
          />
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-brand-muted" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3.5 text-brand-muted hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          {/* Genre Chips */}
          <div className="flex-1 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max">
              {MANGA_GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedGenre === genre
                      ? 'bg-brand-accent text-white shadow-glow-sm'
                      : 'bg-brand-dark text-brand-muted hover:bg-brand-border hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Filter className="h-4 w-4 text-brand-muted hidden sm:inline-block" />
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="rounded-lg border border-brand-border bg-brand-dark py-1.5 px-3 text-xs font-semibold text-white focus:border-brand-accent focus:outline-none"
            >
              {MANGA_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-muted">
          <Loader2 className="h-10 w-10 animate-spin text-brand-accent mb-3" />
          <p className="text-sm font-medium">Fetching manga catalog...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
          <p>{error}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-12 text-center text-brand-muted">
          <BookOpen className="mx-auto h-12 w-12 text-brand-border mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No manga matches found</h3>
          <p className="text-sm mb-4">Try searching with a different title or genre filter.</p>
          <button
            onClick={clearFilters}
            className="rounded-xl bg-brand-accent px-5 py-2.5 text-xs font-bold text-white shadow-glow"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {results.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>

          <div ref={sentinelRef} className="py-8 text-center">
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 text-sm text-brand-muted">
                <Loader2 className="h-5 w-5 animate-spin text-brand-accent" />
                <span>Loading more manga...</span>
              </div>
            )}
            {!hasNextPage && results.length > 0 && (
              <p className="text-xs font-semibold text-brand-muted">
                You have reached the end of the manga catalog.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function MangaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-20 text-brand-muted">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      }
    >
      <MangaContent />
    </Suspense>
  );
}
