'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  Bookmark,
  Check,
  Play,
  Calendar,
  Tv,
  Radio,
  ArrowLeft,
  AlertCircle,
  ChevronRight,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { AnimeMedia, AniweebEpisodesResponse } from '@/types/anime';
import { getAnimeById, getAnimeTitle, cleanDescription } from '@/lib/anilist';
import { getEpisodes } from '@/lib/aniweeb';
import { isInWatchlist, toggleWatchlist } from '@/lib/watchlist';

interface AnimeDetailClientProps {
  id: string;
}

export default function AnimeDetailClient({ id }: AnimeDetailClientProps) {
  const animeId = parseInt(id, 10);
  const [anime, setAnime] = useState<AnimeMedia | null>(null);
  const [episodesData, setEpisodesData] = useState<AniweebEpisodesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isNaN(animeId)) return;

    setIsSaved(isInWatchlist(animeId));

    async function loadData() {
      setLoading(true);
      const media = await getAnimeById(animeId);
      setAnime(media);
      setLoading(false);

      if (media) {
        setLoadingEpisodes(true);
        const epRes = await getEpisodes(media.id);
        setEpisodesData(epRes);
        setLoadingEpisodes(false);
      }
    }

    loadData();
  }, [animeId]);

  const handleToggleWatchlist = () => {
    if (!anime) return;
    const { isSaved: newSaved } = toggleWatchlist(anime);
    setIsSaved(newSaved);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-brand-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />
        <p className="mt-4 text-sm font-medium">Loading anime details...</p>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-brand-accent mb-3" />
        <h1 className="text-2xl font-bold text-white">Anime Not Found</h1>
        <p className="mt-2 text-sm text-brand-muted">The requested anime details could not be retrieved.</p>
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
  const synopsis = cleanDescription(anime.description);
  const coverUrl = anime.coverImage.extraLarge || anime.coverImage.large;
  const bannerUrl = anime.bannerImage || coverUrl;
  const score = anime.meanScore || anime.averageScore;

  // Extract Relations (Prequels, Sequels, Side Stories, Movies, etc.)
  const relationEdges = anime.relations?.edges || [];
  const sequelEdge = relationEdges.find((e) => e.relationType === 'SEQUEL');
  const prequelEdge = relationEdges.find((e) => e.relationType === 'PREQUEL');
  const otherRelationEdges = relationEdges.filter(
    (e) => e.relationType !== 'SEQUEL' && e.relationType !== 'PREQUEL'
  );

  return (
    <div className="min-h-screen pb-16">
      {/* Banner Header Background */}
      <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-brand-dark">
        {bannerUrl && (
          <Image
            src={bannerUrl}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-40 blur-xs"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/70 to-transparent" />
      </div>

      {/* Main Details Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-32 sm:-mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Poster Column */}
          <div className="flex flex-col items-center md:items-start shrink-0">
            <div className="relative aspect-[3/4] w-48 sm:w-60 md:w-64 overflow-hidden rounded-2xl border-2 border-brand-border bg-brand-surface shadow-2xl">
              {coverUrl ? (
                <Image src={coverUrl} alt={title} fill priority sizes="256px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-brand-muted">No Poster</div>
              )}
            </div>

            {/* Actions for Poster */}
            <div className="mt-4 flex w-full flex-col gap-2.5 max-w-[256px]">
              {episodesData && episodesData.episodes.length > 0 ? (
                <Link
                  href={`/watch/${anime.id}?ep=1`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-accent py-3 font-bold text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="h-5 w-5 fill-white" />
                  <span>WATCH EPISODE 1</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 rounded-xl bg-gray-800 py-3 font-bold text-gray-500 cursor-not-allowed"
                >
                  <Play className="h-5 w-5" />
                  <span>UNAVAILABLE</span>
                </button>
              )}

              <button
                onClick={handleToggleWatchlist}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 font-semibold transition-all ${
                  isSaved
                    ? 'border-brand-accent bg-brand-accent/20 text-brand-accent'
                    : 'border-brand-border bg-brand-surface text-white hover:bg-brand-border/60'
                }`}
              >
                {isSaved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                <span className="text-sm">{isSaved ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>
            </div>
          </div>

          {/* Right Info Column */}
          <div className="flex-1 text-white">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-accent mb-3 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Catalog
            </Link>

            <h1 className="text-2xl font-black sm:text-4xl lg:text-5xl tracking-tight leading-tight mb-3">
              {title}
            </h1>

            {/* Badges / Stats */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-brand-muted mb-6">
              {score && (
                <span className="flex items-center gap-1 font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                  <Star className="h-4 w-4 fill-amber-400" />
                  {(score / 10).toFixed(1)} Rating
                </span>
              )}
              {anime.seasonYear && (
                <span className="flex items-center gap-1 bg-brand-surface px-2.5 py-1 rounded-lg border border-brand-border">
                  <Calendar className="h-4 w-4 text-brand-accent" />
                  {anime.season ? `${anime.season} ` : ''}{anime.seasonYear}
                </span>
              )}
              {anime.status && (
                <span className="flex items-center gap-1 bg-brand-surface px-2.5 py-1 rounded-lg border border-brand-border">
                  <Radio className="h-4 w-4 text-emerald-400" />
                  {anime.status}
                </span>
              )}
              {anime.episodes && (
                <span className="flex items-center gap-1 bg-brand-surface px-2.5 py-1 rounded-lg border border-brand-border">
                  <Tv className="h-4 w-4 text-blue-400" />
                  {anime.episodes} Episodes
                </span>
              )}
            </div>

            {/* Genre Tags */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {anime.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/explore?genre=${encodeURIComponent(g)}`}
                    className="rounded-lg bg-brand-surface border border-brand-border px-3 py-1 text-xs font-semibold text-brand-text hover:border-brand-accent hover:text-brand-accent transition-colors"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}

            {/* Synopsis */}
            <div className="mb-8 rounded-2xl border border-brand-border bg-brand-surface p-5 sm:p-6">
              <h2 className="text-base font-bold text-white mb-2">Synopsis</h2>
              <p className="text-sm text-brand-muted leading-relaxed whitespace-pre-line">{synopsis}</p>
            </div>

            {/* SEASON / PREQUEL / SEQUEL NAVIGATION CARDS */}
            {(prequelEdge || sequelEdge) && (
              <div className="mb-8 rounded-2xl border border-brand-border bg-brand-surface p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between border-b border-brand-border/60 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="h-5 w-5 text-brand-accent" />
                    <span>Season Continuations</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Previous Season / Prequel */}
                  {prequelEdge && (
                    <Link
                      href={`/anime/${prequelEdge.node.id}`}
                      className="group flex items-center gap-3.5 rounded-xl border border-brand-border bg-brand-dark p-3 transition-all hover:border-brand-accent hover:bg-brand-accent/10"
                    >
                      <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-900">
                        {prequelEdge.node.coverImage?.large && (
                          <Image
                            src={prequelEdge.node.coverImage.large}
                            alt={getAnimeTitle(prequelEdge.node)}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <span className="inline-block rounded bg-brand-border/80 px-2 py-0.5 text-[10px] font-extrabold text-brand-muted uppercase mb-1">
                          PREVIOUS SEASON (PREQUEL)
                        </span>
                        <h3 className="text-xs font-extrabold text-white group-hover:text-brand-accent line-clamp-1">
                          {getAnimeTitle(prequelEdge.node)}
                        </h3>
                        <p className="text-[11px] text-brand-muted mt-0.5 flex items-center gap-1">
                          <span>{prequelEdge.node.seasonYear || prequelEdge.node.format}</span>
                          <ArrowLeft className="h-3 w-3 text-brand-accent ml-auto" />
                        </p>
                      </div>
                    </Link>
                  )}

                  {/* Next Season / Sequel */}
                  {sequelEdge && (
                    <Link
                      href={`/anime/${sequelEdge.node.id}`}
                      className="group flex items-center gap-3.5 rounded-xl border border-brand-accent/40 bg-brand-accent/10 p-3 transition-all hover:border-brand-accent hover:bg-brand-accent/20"
                    >
                      <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-900 shadow-glow-sm">
                        {sequelEdge.node.coverImage?.large && (
                          <Image
                            src={sequelEdge.node.coverImage.large}
                            alt={getAnimeTitle(sequelEdge.node)}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <span className="inline-block rounded bg-brand-accent px-2 py-0.5 text-[10px] font-extrabold text-white uppercase mb-1">
                          NEXT SEASON (SEQUEL)
                        </span>
                        <h3 className="text-xs font-extrabold text-white group-hover:text-brand-accent line-clamp-1">
                          {getAnimeTitle(sequelEdge.node)}
                        </h3>
                        <p className="text-[11px] text-brand-accent font-bold mt-0.5 flex items-center gap-1">
                          <span>Watch Next Season</span>
                          <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* OTHER RELATED ANIME (Movies, Side Stories, Spin-offs) */}
            {otherRelationEdges.length > 0 && (
              <div className="mb-8 rounded-2xl border border-brand-border bg-brand-surface p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between border-b border-brand-border/60 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="h-4 w-1.5 rounded-full bg-brand-accent inline-block" />
                    <span>Related Anime & Spin-offs</span>
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {otherRelationEdges.map((edge) => (
                    <Link
                      key={edge.node.id}
                      href={`/anime/${edge.node.id}`}
                      className="group flex flex-col overflow-hidden rounded-xl border border-brand-border/80 bg-brand-dark p-2.5 transition-all hover:border-brand-accent hover:bg-brand-accent/10"
                    >
                      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-gray-900 mb-2">
                        {edge.node.coverImage?.large && (
                          <Image
                            src={edge.node.coverImage.large}
                            alt={getAnimeTitle(edge.node)}
                            fill
                            sizes="(max-width: 640px) 50vw, 20vw"
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        )}
                        <span className="absolute top-1 left-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-400">
                          {edge.relationType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white group-hover:text-brand-accent line-clamp-1">
                        {getAnimeTitle(edge.node)}
                      </h3>
                      <p className="text-[10px] text-brand-muted mt-0.5 flex items-center justify-between">
                        <span>{edge.node.format || 'Anime'}</span>
                        <ArrowUpRight className="h-3 w-3 text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Episode Listing Section */}
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-brand-border/60 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="h-4 w-1.5 rounded-full bg-brand-accent inline-block" />
                  Episodes
                </h2>
                {episodesData && (
                  <span className="text-xs text-brand-muted font-medium">
                    {episodesData.episodes.length} Available
                  </span>
                )}
              </div>

              {loadingEpisodes ? (
                <div className="py-8 text-center text-sm text-brand-muted flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-accent border-t-transparent" />
                  <span>Checking episode sources...</span>
                </div>
              ) : episodesData && episodesData.episodes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {episodesData.episodes.map((ep) => (
                    <Link
                      key={ep.number}
                      href={`/watch/${anime.id}?ep=${ep.number}`}
                      className="group flex flex-col justify-between rounded-xl border border-brand-border/80 bg-brand-dark p-3 transition-all hover:border-brand-accent hover:bg-brand-accent/10"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-brand-accent">
                          EP {ep.number}
                        </span>
                        <Play className="h-3.5 w-3.5 fill-brand-accent text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-[11px] text-brand-muted line-clamp-1">
                        {ep.title || `Episode ${ep.number}`}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-brand-muted">
                  <AlertCircle className="mx-auto h-8 w-8 text-brand-border mb-2" />
                  <p className="text-sm font-medium text-white mb-1">No streamable episodes currently indexed</p>
                  <p className="text-xs text-brand-muted max-w-sm mx-auto">
                    Episode streams for this title are unavailable at the moment. You can add it to your watchlist to track update availability.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
