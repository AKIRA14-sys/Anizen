'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Loader2,
  Sparkles,
  X,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Dices,
  RotateCcw,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { AnimeMedia } from '@/types/anime';
import { searchAnime, getRandomAnime } from '@/lib/anilist';
import AnimeCard from '@/components/AnimeCard';
import {
  LayoutDensity,
  ViewMode,
  getLayoutDensity,
  setLayoutDensity,
  getViewMode,
  setViewMode,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
} from '@/lib/userPreferences';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';

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

const FORMATS = ['All', 'TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC'];
const STATUSES = ['All', 'FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED'];
const SEASONS = ['All', 'WINTER', 'SPRING', 'SUMMER', 'FALL'];

const SORT_OPTIONS = [
  { label: 'Most Popular', value: 'POPULARITY_DESC' },
  { label: 'Trending', value: 'TRENDING_DESC' },
  { label: 'Highest Rated', value: 'SCORE_DESC' },
  { label: 'Newest Releases', value: 'START_DATE_DESC' },
  { label: 'Oldest Releases', value: 'START_DATE_ASC' },
  { label: 'Most Episodes', value: 'EPISODES_DESC' },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL State
  const initialQuery = searchParams.get('q') || '';
  const initialGenre = searchParams.get('genre') || 'All';
  const initialSort = searchParams.get('sort') || 'POPULARITY_DESC';
  const initialFormat = searchParams.get('format') || 'All';
  const initialStatus = searchParams.get('status') || 'All';
  const initialSeason = searchParams.get('season') || 'All';
  const initialYear = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
  const initialMinScore = searchParams.get('score') ? parseInt(searchParams.get('score')!, 10) : 0;

  // Filter States
  const [query, setQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [selectedFormat, setSelectedFormat] = useState(initialFormat);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(initialYear);
  const [selectedMinScore, setSelectedMinScore] = useState(initialMinScore);

  // Layout Preferences
  const [density, setDensityState] = useState<LayoutDensity>('compact');
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSurprising, setIsSurprising] = useState(false);

  // Pagination & Fetch States
  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const activeReqId = useRef(0);

  useEffect(() => {
    setDensityState(getLayoutDensity());
    setViewModeState(getViewMode());
    setRecentSearches(getRecentSearches());
  }, []);

  const handleDensityToggle = (newDensity: LayoutDensity) => {
    setDensityState(newDensity);
    setLayoutDensity(newDensity);
  };

  const handleViewModeToggle = (newMode: ViewMode) => {
    setViewModeState(newMode);
    setViewMode(newMode);
  };

  // Perform Initial / Reset Query Fetch
  const fetchFirstPage = useCallback(async () => {
    const reqId = ++activeReqId.current;
    setLoading(true);
    setError(null);
    setPageError(null);
    setPage(1);

    try {
      const data = await searchAnime({
        searchQuery: query,
        genre: selectedGenre,
        sort: selectedSort,
        format: selectedFormat,
        status: selectedStatus,
        season: selectedSeason,
        seasonYear: selectedYear,
        minScore: selectedMinScore,
        page: 1,
        perPage: 24,
      });

      if (reqId === activeReqId.current) {
        setResults(data.media);
        setHasNextPage(data.hasNextPage);
      }
    } catch (err) {
      if (reqId === activeReqId.current) {
        console.error('Fetch error:', err);
        setError('Failed to fetch anime catalog. Please check network connection.');
      }
    } finally {
      if (reqId === activeReqId.current) {
        setLoading(false);
      }
    }
  }, [
    query,
    selectedGenre,
    selectedSort,
    selectedFormat,
    selectedStatus,
    selectedSeason,
    selectedYear,
    selectedMinScore,
  ]);

  // Load Next Page for Infinite Scrolling
  const loadNextPage = useCallback(async () => {
    if (isFetchingRef.current || loading || loadingMore || !hasNextPage) return;

    isFetchingRef.current = true;
    const nextPage = page + 1;
    const reqId = activeReqId.current;
    setLoadingMore(true);
    setPageError(null);

    try {
      const data = await searchAnime({
        searchQuery: query,
        genre: selectedGenre,
        sort: selectedSort,
        format: selectedFormat,
        status: selectedStatus,
        season: selectedSeason,
        seasonYear: selectedYear,
        minScore: selectedMinScore,
        page: nextPage,
        perPage: 24,
      });

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
      if (reqId === activeReqId.current) {
        console.error('Error fetching next page:', err);
        setPageError('Failed to load more anime. Click to retry.');
      }
    } finally {
      isFetchingRef.current = false;
      setLoadingMore(false);
    }
  }, [
    loading,
    loadingMore,
    hasNextPage,
    page,
    query,
    selectedGenre,
    selectedSort,
    selectedFormat,
    selectedStatus,
    selectedSeason,
    selectedYear,
    selectedMinScore,
  ]);

  // Debounce & Trigger query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFirstPage();

      // Sync URL search params
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (selectedGenre !== 'All') params.set('genre', selectedGenre);
      if (selectedSort !== 'POPULARITY_DESC') params.set('sort', selectedSort);
      if (selectedFormat !== 'All') params.set('format', selectedFormat);
      if (selectedStatus !== 'All') params.set('status', selectedStatus);
      if (selectedSeason !== 'All') params.set('season', selectedSeason);
      if (selectedYear) params.set('year', selectedYear.toString());
      if (selectedMinScore > 0) params.set('score', selectedMinScore.toString());

      const newUrl = params.toString() ? `/explore?${params.toString()}` : '/explore';
      router.replace(newUrl, { scroll: false });
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchFirstPage, query, selectedGenre, selectedSort, selectedFormat, selectedStatus, selectedSeason, selectedYear, selectedMinScore, router]);

  // Hook for infinite scroll
  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadNextPage,
    hasMore: hasNextPage,
    isLoading: loading || loadingMore,
  });

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      const updated = addRecentSearch(query.trim());
      setRecentSearches(updated);
      setShowSearchDropdown(false);
    }
  };

  const handleSurpriseMe = async () => {
    setIsSurprising(true);
    try {
      const randomItem = await getRandomAnime();
      if (randomItem) {
        router.push(`/anime/${randomItem.id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSurprising(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedGenre('All');
    setSelectedSort('POPULARITY_DESC');
    setSelectedFormat('All');
    setSelectedStatus('All');
    setSelectedSeason('All');
    setSelectedYear(undefined);
    setSelectedMinScore(0);
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 45 }, (_, i) => currentYear - i);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header & Controls Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-accent" />
            Explore Anime Catalog
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-brand-muted">
            Discover thousands of anime titles with custom layout views and filters.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Surprise Me Button */}
          <button
            onClick={handleSurpriseMe}
            disabled={isSurprising}
            className="flex items-center gap-1.5 rounded-xl border border-brand-accent/50 bg-brand-accent/15 px-3 py-2 text-xs font-bold text-brand-accent hover:bg-brand-accent hover:text-white transition-all shadow-glow-sm"
            title="Random Anime Discovery"
          >
            <Dices className={`h-4 w-4 ${isSurprising ? 'animate-spin' : ''}`} />
            <span>Surprise Me</span>
          </button>

          {/* Density Preference Switcher */}
          <div className="hidden sm:flex items-center rounded-xl border border-brand-border bg-brand-surface p-1">
            <button
              onClick={() => handleDensityToggle('compact')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                density === 'compact' ? 'bg-brand-accent text-white' : 'text-brand-muted hover:text-white'
              }`}
            >
              Compact
            </button>
            <button
              onClick={() => handleDensityToggle('comfortable')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                density === 'comfortable' ? 'bg-brand-accent text-white' : 'text-brand-muted hover:text-white'
              }`}
            >
              Comfortable
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-xl border border-brand-border bg-brand-surface p-1">
            <button
              onClick={() => handleViewModeToggle('grid')}
              className={`rounded-lg p-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-brand-accent text-white' : 'text-brand-muted hover:text-white'
              }`}
              aria-label="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleViewModeToggle('list')}
              className={`rounded-lg p-1.5 transition-all ${
                viewMode === 'list' ? 'bg-brand-accent text-white' : 'text-brand-muted hover:text-white'
              }`}
              aria-label="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Filter Panel Container */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4 sm:p-5 shadow-xl">
        {/* Search Bar Input & Recent Searches */}
        <div className="relative w-full">
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Search anime title..."
              className="w-full rounded-xl border border-brand-border/80 bg-brand-dark py-3 pl-11 pr-10 text-white placeholder-brand-muted transition-all focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent text-sm"
            />
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-muted" />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-3.5 text-brand-muted hover:text-white"
                aria-label="Clear Search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Recent Searches Dropdown */}
          {showSearchDropdown && recentSearches.length > 0 && !query && (
            <div className="absolute left-0 right-0 top-full z-40 mt-1 rounded-xl border border-brand-border bg-brand-dark p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-brand-muted">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-brand-accent" /> Recent Searches
                </span>
                <button
                  onClick={() => {
                    clearRecentSearches();
                    setRecentSearches([]);
                  }}
                  className="hover:text-red-400"
                >
                  Clear History
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setQuery(s);
                      setShowSearchDropdown(false);
                    }}
                    className="rounded-lg bg-brand-surface border border-brand-border/60 px-2.5 py-1 text-xs text-white hover:border-brand-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Primary Genre Chips Row & Toggle Advanced Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
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

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                showAdvancedFilters
                  ? 'border-brand-accent bg-brand-accent/20 text-brand-accent'
                  : 'border-brand-border bg-brand-dark text-brand-muted hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
            </button>

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

        {/* ADVANCED FILTER DRAWER */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-2 gap-3 border-t border-brand-border/40 pt-4 sm:grid-cols-5">
            {/* Format Filter */}
            <div>
              <label className="mb-1 block text-[11px] font-bold text-brand-muted">Format</label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-brand-dark p-2 text-xs font-medium text-white focus:border-brand-accent focus:outline-none"
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="mb-1 block text-[11px] font-bold text-brand-muted">Airing Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-brand-dark p-2 text-xs font-medium text-white focus:border-brand-accent focus:outline-none"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Season Filter */}
            <div>
              <label className="mb-1 block text-[11px] font-bold text-brand-muted">Season</label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-brand-dark p-2 text-xs font-medium text-white focus:border-brand-accent focus:outline-none"
              >
                {SEASONS.map((se) => (
                  <option key={se} value={se}>
                    {se}
                  </option>
                ))}
              </select>
            </div>

            {/* Release Year */}
            <div>
              <label className="mb-1 block text-[11px] font-bold text-brand-muted">Release Year</label>
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="w-full rounded-lg border border-brand-border bg-brand-dark p-2 text-xs font-medium text-white focus:border-brand-accent focus:outline-none"
              >
                <option value="">All Years</option>
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Rating */}
            <div>
              <label className="mb-1 block text-[11px] font-bold text-brand-muted">Min Rating ({selectedMinScore || 'Any'})</label>
              <select
                value={selectedMinScore}
                onChange={(e) => setSelectedMinScore(parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-brand-border bg-brand-dark p-2 text-xs font-medium text-white focus:border-brand-accent focus:outline-none"
              >
                <option value={0}>Any Rating</option>
                <option value={6}>6+ (Good)</option>
                <option value={7}>7+ (Very Good)</option>
                <option value={8}>8+ (Excellent)</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filters Row */}
        {(query || selectedGenre !== 'All' || selectedFormat !== 'All' || selectedStatus !== 'All' || selectedSeason !== 'All' || selectedYear || selectedMinScore > 0 || selectedSort !== 'POPULARITY_DESC') && (
          <div className="flex items-center justify-between border-t border-brand-border/40 pt-2 text-xs text-brand-muted">
            <span>
              Found <strong className="text-white">{results.length}</strong> matching titles
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 font-bold text-brand-accent hover:underline"
            >
              <RotateCcw className="h-3 w-3" /> Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* CATALOGUE GRID / LIST RESULTS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-muted">
          <Loader2 className="h-10 w-10 animate-spin text-brand-accent mb-3" />
          <p className="text-sm font-medium">Fetching anime catalog...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
          <p>{error}</p>
          <button
            onClick={() => fetchFirstPage()}
            className="mt-4 rounded-xl bg-red-500/20 px-4 py-2 text-xs font-bold text-white hover:bg-red-500/40"
          >
            Retry Request
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-12 text-center text-brand-muted">
          <Search className="mx-auto h-12 w-12 text-brand-border mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No anime matches found</h3>
          <p className="text-sm mb-4">Try relaxing your search terms or filter constraints.</p>
          <button
            onClick={clearFilters}
            className="rounded-xl bg-brand-accent px-5 py-2.5 text-xs font-bold text-white shadow-glow"
          >
            Clear All Search Filters
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <div className="flex flex-col gap-3">
              {results.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} density={density} viewMode="list" />
              ))}
            </div>
          ) : (
            <div
              className={`grid gap-3.5 sm:gap-4 ${
                density === 'compact'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
              }`}
            >
              {results.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} density={density} viewMode="grid" />
              ))}
            </div>
          )}

          {/* INFINITE SCROLL SENTINEL & LOADING STATE */}
          <div ref={sentinelRef} className="py-8 text-center">
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
                  onClick={loadNextPage}
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
