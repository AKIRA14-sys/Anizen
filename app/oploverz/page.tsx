'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, X } from 'lucide-react';
import {
  searchOploverz,
  getOploverzAnime,
  slugFromHref,
  OploverzSearchCard,
  OploverzAnimeDetails,
} from '@/lib/oploverz';

export default function OploverzPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OploverzSearchCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [details, setDetails] = useState<OploverzAnimeDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const runSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) {
      setSearchError('Type a title first.');
      return;
    }

    setSearching(true);
    setSearchError(null);
    setSearchMessage(null);
    setDetails(null);
    setDetailsError(null);

    try {
      const list = await searchOploverz(q);
      setResults(list);
      setSearchMessage(list.length ? `Found ${list.length} result(s).` : `No results for "${q}".`);
    } catch (err: any) {
      setResults([]);
      if (err?.notFound) {
        setSearchMessage(`No results for "${q}".`);
      } else {
        setSearchError(err?.message || 'Search failed. Please try again.');
      }
    } finally {
      setSearching(false);
    }
  };

  const openDetails = async (slug: string) => {
    if (!slug) return;
    setDetailsLoading(true);
    setDetailsError(null);
    setDetails(null);
    try {
      setDetails(await getOploverzAnime(slug));
    } catch (err: any) {
      setDetailsError(err?.message || 'Could not load details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white">Oploverz</h1>
        <p className="mt-1 text-xs sm:text-sm text-brand-muted">Search titles, browse episodes, and watch.</p>
      </div>

      <form
        onSubmit={runSearch}
        className="mb-4 flex items-center gap-2 rounded-2xl border border-brand-border bg-brand-surface p-4"
      >
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime title..."
            aria-label="Search anime title"
            className="w-full rounded-xl border border-brand-border/80 bg-brand-dark py-3 pl-11 pr-10 text-sm text-white placeholder-brand-muted focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-muted" />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3.5 text-brand-muted hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={searching}
          className="rounded-xl bg-brand-accent px-5 py-3 text-xs font-bold text-white disabled:opacity-60"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searchError && <p className="mb-4 text-sm text-red-400">{searchError}</p>}
      {searchMessage && !searchError && <p className="mb-4 text-sm text-brand-muted">{searchMessage}</p>}

      {searching && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {results.map((item) => {
            const slug = item.slug || slugFromHref(item.href);
            return (
              <button
                key={slug || item.title}
                type="button"
                onClick={() => openDetails(slug)}
                className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface text-left transition-all hover:border-brand-accent"
              >
                <div className="aspect-[3/4] w-full bg-brand-dark">
                  {item.poster ? (
                    // Plain img: the poster host is not in next/image's allowlist, and images are unoptimized here.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.poster} alt={item.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-center text-xs text-brand-muted">No poster</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="line-clamp-2 text-xs font-bold text-white">{item.title || '(no title)'}</p>
                  <p className="mt-1 text-[11px] text-brand-muted">{[item.type, item.status].filter(Boolean).join(' · ')}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {detailsLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      )}

      {detailsError && <p className="mt-6 text-sm text-red-400">{detailsError}</p>}

      {details && (
        <section className="mt-8 rounded-2xl border border-brand-border bg-brand-surface p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            {details.poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={details.poster} alt={details.title} referrerPolicy="no-referrer" className="w-32 shrink-0 self-start rounded-xl" />
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-black text-white">{details.title}</h2>
              <p className="mt-2 text-xs leading-6 text-brand-muted">
                {[
                  details.type && `Type: ${details.type}`,
                  details.status && `Status: ${details.status}`,
                  details.studio && `Studio: ${details.studio}`,
                  details.season && `Season: ${details.season}`,
                  details.rating && `Rating: ${details.rating}`,
                  details.genres.length > 0 && `Genres: ${details.genres.join(', ')}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {details.synopsis.paragraphList.length > 0 && (
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/90">
                  {details.synopsis.paragraphList.join('\n\n')}
                </p>
              )}
            </div>
          </div>

          <h3 className="mt-6 text-sm font-bold text-white">
            Episodes <span className="font-normal text-brand-muted">({details.episodeList.length})</span>
          </h3>
          <ul className="mt-3 max-h-96 divide-y divide-brand-border/60 overflow-y-auto">
            {details.episodeList.map((ep) => {
              const epSlug = slugFromHref(ep.href);
              return (
                <li key={ep.href || ep.episode} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">
                      {ep.episode ? `Ep ${ep.episode}` : 'Episode'}
                      {ep.title ? ` · ${ep.title}` : ''}
                    </p>
                    {ep.date && <p className="text-[11px] text-brand-muted">{ep.date}</p>}
                  </div>
                  {epSlug && (
                    <Link
                      href={`/oploverz/watch?ep=${encodeURIComponent(epSlug)}`}
                      className="shrink-0 rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Watch
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}