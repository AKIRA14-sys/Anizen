'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, Loader2, Sparkles, X, RefreshCw } from 'lucide-react';
import { AnimeMedia } from '@/types/anime';
import { searchAnime } from '@/lib/anilist';
import AnimeCard from '@/components/AnimeCard';

const GENRES = [
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

const SORT_OPTIONS = [
  { label: 'Most Popular', value: 'POPULARITY_DESC' },
  { label: 'Trending', value: 'TRENDING_DESC' },
  { label: 'Highest Rated', value: 'SCORE_DESC' },
  { label: 'Newest', value: 'START_DATE_DESC' },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('q') || '';
  const initialGenre = searchParams.get('genre') || 'All';
  const initialSort = searchParams.get('sort') || 'POPULARITY_DESC';

  const [query, setQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedSort, setSelectedSort] = useState(initialSort);

  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Sentinel element for IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Active request and loading refs to prevent race conditions & duplicate fetches
  const isFetchingRef = useRef(false);
  const currentReqIdRef = useRef(0);

  // Fetch initial page (Page 1) when query or filters change
  const performInitialSearch = useCallback(async (q: string, g: string, s: string) => {
    const reqId = ++currentReqIdRef.current;
    setLoading(true);
    setError(null);
    setPageError(null);
    setPage(1);

    try {
      const genreParam = g === 'All' ? undefined : g;
      const data = await searchAnime(q, genreParam, s, 1, 24);

      if (reqId === currentReqIdRef.current) {
        setResults(data.media);
        setHasNextPage(data.hasNextPage);
      }
    } catch (err) {
      if (reqId === currentReqIdRef.current) {
        console.error('Failed to fetch initial catalog page:', err);
        setError('Failed to fetch anime catalog. Please check your connection and try again.');
      }
    } finally {
      if (reqId === currentReqIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch subsequent pages for infinite scrolling
  const fetchNextPage = useCallback(async () => {
    if (isFetchingRef.current || loading || loadingMore || !hasNextPage) return;

    isFetchingRef.current = true;
    setLoadingMore(true);
    setPageError(null);
    const nextPage = page + 1;
    const reqId = currentReqIdRef.current;

    try {
      const genreParam = selectedGenre === 'All' ? undefined : selectedGenre;
      const data = await searchAnime(query, genreParam, selectedSort, nextPage, 24);

      if (reqId === currentReqIdRef.current) {
        setResults((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const filteredNew = data.media.filter((item) => !existingIds.has(item.id));
          return [...prev, ...filteredNew];
        });
        setPage(nextPage);
        setHasNextPage(data.hasNextPage);
      }
    } catch (err) {
      if (reqId === currentReqIdRef.current) {
        console.error('Failed to load next page:', err);
        setPageError('Failed to load additional anime. Click to retry.');
      }
    } finally {
      isFetchingRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasNextPage, page, selectedGenre, query, selectedSort]);

  // Debounce search query and filter adjustments
  useEffect(() => {
    const timer = setTimeout(() => {
      performInitialSearch(query, selectedGenre, selectedSort);

      // Sync URL parameters
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (selectedGenre !== 'All') params.set('genre', selectedGenre);
      if (selectedSort !== 'POPULARITY_DESC') params.set('sort', selectedSort);

      const newUrl = params.toString() ? `/explore?${params.toString()}` : '/explore';
      router.replace(newUrl, { scroll: false });
    }, 350);

    return () => clearTimeout(timer);
  }, [query, selectedGenre, selectedSort, performInitialSearch, router]);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loading && !loadingMore && !isFetchingRef.current) {
          fetchNextPage();
        }
      },
      { rootMargin: '350px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, loading, loadingMore, fetchNextPage]);

  const clearFilters = () => {
    setQuery('');
    setSelectedGenre('All');
    setSelectedSort('POPULARITY_DESC');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search Header Banner */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl font-black text-white sm:text-4xl flex items-center justify-center sm:justify-start gap-2">
          <Sparkles className="h-7 w-7 text-brand-accent" />
          Explore Anime Catalog
        </h1>
        <p className="mt-2 text-sm text-brand-muted max-w-xl">
          Search thousands of anime titles, filter by genres, or sort by rating and popularity.
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
            placeholder="Search anime title..."
            className="w-full rounded-xl border border-brand-border/80 bg-brand-dark py-3.5 pl-11 pr-10 text-white placeholder-brand-muted transition-all focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent text-sm sm:text-base"
          />
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-brand-muted" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3.5 text-brand-muted hover:text-white"
              aria-label="Clear Search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          {/* Genre Chips Horizontal List */}
          <div className="flex-1 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max">
              {GENRES.map((genre) => (
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
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(query || selectedGenre !== 'All' || selectedSort !== 'POPULARITY_DESC') && (
          <div className="flex items-center justify-between border-t border-brand-border/40 pt-3 text-xs text-brand-muted">
            <span>
              Showing results for:{' '}
              {query && <strong className="text-white">"{query}" </strong>}
              {selectedGenre !== 'All' && <strong className="text-brand-accent">[{selectedGenre}] </strong>}
            </span>
            <button
              onClick={clearFilters}
              className="text-brand-accent hover:underline font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Grid State Handling */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-muted">
          <Loader2 className="h-10 w-10 animate-spin text-brand-accent mb-3" />
          <p className="text-sm">Fetching catalog...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
          <p>{error}</p>
          <button
            onClick={() => performInitialSearch(query, selectedGenre, selectedSort)}
            className="mt-4 rounded-xl bg-red-500/20 px-4 py-2 text-xs font-bold text-white hover:bg-red-500/40"
          >
            Retry Request
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-12 text-center text-brand-muted">
          <Search className="mx-auto h-12 w-12 text-brand-border mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No anime matches found</h3>
          <p className="text-sm mb-4">Try searching with a different keyword or removing genre filters.</p>
          <button
            onClick={clearFilters}
            className="rounded-xl bg-brand-accent px-5 py-2.5 text-xs font-bold text-white shadow-glow"
          >
            Clear All Search Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {results.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>

          {/* INFINITE SCROLL SENTINEL & PAGINATION STATES */}
          <div ref={sentinelRef} className="mt-8 py-6 text-center">
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 text-sm text-brand-muted">
                <Loader2 className="h-5 w-5 animate-spin text-brand-accent" />
                <span>Loading more anime...</span>
              </div>
            )}

            {pageError && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-red-400">{pageError}</p>
                <button
                  onClick={fetchNextPage}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-accent bg-brand-accent/20 px-3 py-1.5 text-xs font-bold text-brand-accent hover:bg-brand-accent hover:text-white transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry Page {page + 1}</span>
                </button>
              </div>
            )}

            {!hasNextPage && results.length > 0 && (
              <p className="text-xs font-semibold text-brand-muted">
                You have reached the end of the catalog.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-20 text-brand-muted">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
