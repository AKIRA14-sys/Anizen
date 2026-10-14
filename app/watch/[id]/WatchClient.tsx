'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Info,
  Tv,
} from 'lucide-react';
import { AnimeMedia, AniweebEpisodesResponse } from '@/types/anime';
import { getAnimeById, getAnimeTitle } from '@/lib/anilist';
import { getEpisodes, getEmbedUrl } from '@/lib/aniweeb';

interface WatchClientProps {
  id: string;
}

function WatchClientContent({ id }: WatchClientProps) {
  const searchParams = useSearchParams();
  const animeId = parseInt(id, 10);
  const episodeNumber = parseInt(searchParams.get('ep') || '1', 10);

  const [anime, setAnime] = useState<AnimeMedia | null>(null);
  const [episodesData, setEpisodesData] = useState<AniweebEpisodesResponse | null>(null);
  const [track, setTrack] = useState<'sub' | 'dub'>('sub');

  const [loading, setLoading] = useState(true);
  const [embedError, setEmbedError] = useState(false);

  useEffect(() => {
    if (isNaN(animeId)) return;

    async function loadWatchData() {
      setLoading(true);
      setEmbedError(false);

      const [media, epRes] = await Promise.all([
        getAnimeById(animeId),
        getEpisodes(animeId),
      ]);

      setAnime(media);
      setEpisodesData(epRes);
      setLoading(false);
    }

    loadWatchData();
  }, [animeId]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-brand-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-accent border-t-transparent mb-3" />
        <p className="text-sm font-medium">Loading video player and episode list...</p>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-brand-accent mb-3" />
        <h1 className="text-2xl font-bold text-white">Anime Not Found</h1>
        <p className="mt-2 text-sm text-brand-muted">The requested video stream could not be loaded.</p>
        <Link
          href="/explore"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-xs font-bold text-white shadow-glow"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </Link>
      </div>
    );
  }

  const title = getAnimeTitle(anime);
  const totalEps = episodesData?.episodes.length || 0;
  const currentEpObj = episodesData?.episodes.find((ep) => ep.number === episodeNumber);
  const embedUrl = getEmbedUrl(animeId, episodeNumber, track);

  const hasPrev = episodeNumber > 1;
  const hasNext = episodeNumber < totalEps;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Navigation Back */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/anime/${anime.id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-brand-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {title}</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-brand-muted">
          <span>Track Audio:</span>
          <div className="flex items-center rounded-lg border border-brand-border bg-brand-surface p-0.5">
            <button
              onClick={() => setTrack('sub')}
              className={`rounded-md px-3 py-1 font-bold transition-all ${
                track === 'sub' ? 'bg-brand-accent text-white shadow-glow-sm' : 'text-brand-muted hover:text-white'
              }`}
            >
              SUB
            </button>
            <button
              onClick={() => setTrack('dub')}
              className={`rounded-md px-3 py-1 font-bold transition-all ${
                track === 'dub' ? 'bg-brand-accent text-white shadow-glow-sm' : 'text-brand-muted hover:text-white'
              }`}
            >
              DUB
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Player Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-brand-border bg-black shadow-2xl">
        {!embedError ? (
          <iframe
            src={embedUrl}
            title={`${title} - Episode ${episodeNumber}`}
            className="h-full w-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            onError={() => setEmbedError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-brand-muted">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Playback Frame Error</h3>
            <p className="text-xs text-brand-muted max-w-md mb-4">
              The external embed provider was unable to load this episode directly. You can retry or switch audio track.
            </p>
            <button
              onClick={() => setEmbedError(false)}
              className="flex items-center gap-2 rounded-xl bg-brand-accent px-4 py-2 text-xs font-bold text-white shadow-glow"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Stream
            </button>
          </div>
        )}
      </div>

      {/* Episode Header Controls */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>{title}</span>
            <span className="text-brand-accent font-extrabold">• Episode {episodeNumber}</span>
          </h1>
          {currentEpObj?.title && (
            <p className="text-xs text-brand-muted mt-0.5">{currentEpObj.title}</p>
          )}
        </div>

        {/* Prev / Next Episode Buttons */}
        <div className="flex items-center gap-2">
          {hasPrev ? (
            <Link
              href={`/watch/${anime.id}?ep=${episodeNumber - 1}`}
              className="flex items-center gap-1 rounded-xl border border-brand-border bg-brand-dark px-3.5 py-2 text-xs font-semibold text-white hover:border-brand-accent hover:text-brand-accent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev EP</span>
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center gap-1 rounded-xl border border-brand-border/40 bg-brand-dark/40 px-3.5 py-2 text-xs font-semibold text-gray-600 cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev EP</span>
            </button>
          )}

          {hasNext ? (
            <Link
              href={`/watch/${anime.id}?ep=${episodeNumber + 1}`}
              className="flex items-center gap-1 rounded-xl bg-brand-accent px-4 py-2 text-xs font-bold text-white shadow-glow hover:bg-brand-accent-hover transition-colors"
            >
              <span>Next EP</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center gap-1 rounded-xl border border-brand-border/40 bg-brand-dark/40 px-3.5 py-2 text-xs font-semibold text-gray-600 cursor-not-allowed"
            >
              <span>Next EP</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Episode Selector Grid */}
      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-5">
        <div className="mb-4 flex items-center justify-between border-b border-brand-border/60 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Tv className="h-4 w-4 text-brand-accent" />
            <span>Select Episode</span>
          </h2>
          <span className="text-xs text-brand-muted font-medium">
            Total Episodes: {totalEps}
          </span>
        </div>

        {episodesData && episodesData.episodes.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 max-h-64 overflow-y-auto pr-1">
            {episodesData.episodes.map((ep) => {
              const isActive = ep.number === episodeNumber;
              return (
                <Link
                  key={ep.number}
                  href={`/watch/${anime.id}?ep=${ep.number}`}
                  className={`flex items-center justify-center rounded-xl py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-accent text-white shadow-glow-sm scale-105'
                      : 'border border-brand-border/80 bg-brand-dark text-brand-muted hover:border-brand-accent hover:text-white'
                  }`}
                >
                  EP {ep.number}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-brand-muted flex items-center justify-center gap-2">
            <Info className="h-4 w-4 text-brand-accent" />
            <span>Episode index is temporarily unavailable from provider.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WatchClient({ id }: WatchClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-brand-muted">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-accent border-t-transparent mb-2" />
          <p className="text-xs">Loading Watch Player...</p>
        </div>
      }
    >
      <WatchClientContent id={id} />
    </Suspense>
  );
}
