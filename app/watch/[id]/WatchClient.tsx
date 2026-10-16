'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Hls from 'hls.js';
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
  Download,
  Server,
  Loader2,
} from 'lucide-react';
import { AnimeMedia, AniweebEpisodesResponse } from '@/types/anime';
import { getAnimeById, getAnimeTitle } from '@/lib/anilist';
import { getEpisodes, getEmbedUrl } from '@/lib/aniweeb';
import { updateWatchProgress } from '@/lib/watchProgress';

interface ConsumetSourceItem {
  url: string;
  isM3U8?: boolean;
  quality?: string;
  isDASH?: boolean;
}

interface ConsumetSubtitleItem {
  url: string;
  lang: string;
}

interface ConsumetSourcesData {
  provider: string;
  headers?: Record<string, string>;
  sources: ConsumetSourceItem[];
  subtitles?: ConsumetSubtitleItem[];
  download?: string;
  embedUrl?: string;
}

interface WatchClientProps {
  id: string;
}

function WatchClientContent({ id }: WatchClientProps) {
  const searchParams = useSearchParams();
  const animeId = parseInt(id, 10);
  const episodeNumber = parseInt(searchParams.get('ep') || '1', 10);

  const [anime, setAnime] = useState<AnimeMedia | null>(null);
  const [track, setTrack] = useState<'sub' | 'dub'>('sub');

  // 1. Aniweeb is the DEFAULT reliable playback server
  const [activeServer, setActiveServer] = useState<'aniweeb' | 'consumet'>('aniweeb');

  // Episodes state
  const [consumetEpisodes, setConsumetEpisodes] = useState<any[]>([]);
  const [consumetLoading, setConsumetLoading] = useState<boolean>(true);
  const [aniweebEpisodes, setAniweebEpisodes] = useState<AniweebEpisodesResponse | null>(null);

  // Consumet sources state
  const [consumetData, setConsumetData] = useState<ConsumetSourcesData | null>(null);
  const [selectedQualityUrl, setSelectedQualityUrl] = useState<string>('');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('');

  // Player controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [consumetErrorMsg, setConsumetErrorMsg] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState(false);
  const [autoFallbackTimer, setAutoFallbackTimer] = useState<number | null>(null);

  // Request counter guard to prevent stale async responses
  const activeReqIdRef = useRef(0);

  // Helper to destroy HLS instance and reset HTML5 video
  const cleanupVideoPlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  };

  // Helper function to load background Consumet episode list
  const loadConsumetEpisodeList = async () => {
    setConsumetLoading(true);
    try {
      const res = await fetch(`/api/consumet/episodes/${animeId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.episodes)) {
        setConsumetEpisodes(json.episodes);
      } else {
        setConsumetEpisodes([]);
      }
    } catch {
      setConsumetEpisodes([]);
    } finally {
      setConsumetLoading(false);
    }
  };

  // Initial load for Anime metadata, Aniweeb episodes, and background Consumet episodes
  useEffect(() => {
    if (isNaN(animeId)) return;

    async function loadWatchData() {
      setLoading(true);
      setEmbedError(false);

      try {
        const [media, aniweebRes] = await Promise.all([
          getAnimeById(animeId),
          getEpisodes(animeId),
        ]);

        setAnime(media);
        setAniweebEpisodes(aniweebRes);

        // Fetch Consumet episodes in background
        loadConsumetEpisodeList();
      } catch (e) {
        console.error('Error fetching initial anime watch data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadWatchData();
  }, [animeId]);

  // Clear auto fallback timer when switching servers
  const handleServerSelect = (server: 'aniweeb' | 'consumet') => {
    if (autoFallbackTimer) {
      clearTimeout(autoFallbackTimer);
      setAutoFallbackTimer(null);
    }
    setActiveServer(server);
    if (server === 'aniweeb') {
      cleanupVideoPlayer();
      setConsumetErrorMsg(null);
      setConsumetData(null);
      setSelectedQualityUrl('');
    }
  };

  // Trigger auto-fallback to Aniweeb when Consumet fails
  const triggerAutoFallback = (msg: string) => {
    setConsumetErrorMsg(msg);
    if (autoFallbackTimer) clearTimeout(autoFallbackTimer);

    const timer = window.setTimeout(() => {
      handleServerSelect('aniweeb');
    }, 3000);

    setAutoFallbackTimer(timer);
  };

  // Fetch Consumet sources ONLY when activeServer is 'consumet' and real episode ID exists
  useEffect(() => {
    if (isNaN(animeId) || activeServer !== 'consumet') return;

    if (consumetLoading) return; // Wait until background Consumet fetch finishes

    const currentReqId = ++activeReqIdRef.current;

    async function fetchSources() {
      setSourcesLoading(true);
      setConsumetErrorMsg(null);
      setConsumetData(null);
      setSelectedQualityUrl('');
      cleanupVideoPlayer();

      // Find REAL episode from Consumet episode list
      const matchedEp = consumetEpisodes.find((e) => e.number === episodeNumber);

      if (!matchedEp || !matchedEp.id) {
        if (currentReqId === activeReqIdRef.current) {
          triggerAutoFallback(`Consumet has no indexed stream for Episode ${episodeNumber}. Switching to Aniweeb Embed...`);
          setSourcesLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(
          `/api/consumet/sources?episodeId=${encodeURIComponent(matchedEp.id)}&provider=${encodeURIComponent(matchedEp.provider || 'anilist')}&track=${track}`
        );
        const json = await res.json();

        // Stale guard
        if (currentReqId !== activeReqIdRef.current) return;

        if (res.ok && json.success && (json.sources?.length > 0 || json.download || json.embedUrl)) {
          setConsumetData(json);
          if (json.sources?.length > 0) {
            setSelectedQualityUrl(json.sources[0].url);
          }
          if (json.subtitles?.length > 0) {
            const eng = json.subtitles.find((s: any) => s.lang?.toLowerCase().includes('english'));
            setSelectedSubtitle(eng ? eng.url : json.subtitles[0].url);
          }
          setSourcesLoading(false);
          return;
        } else {
          triggerAutoFallback(json.message || `No video stream returned for Episode ${episodeNumber}. Switching to Aniweeb Embed...`);
        }
      } catch (e: any) {
        if (currentReqId !== activeReqIdRef.current) return;
        triggerAutoFallback('Error connecting to Consumet stream. Switching to Aniweeb Embed...');
      }

      setSourcesLoading(false);
    }

    fetchSources();
  }, [animeId, episodeNumber, track, activeServer, consumetEpisodes, consumetLoading]);

  // Attach HLS stream or video source when selectedQualityUrl changes
  useEffect(() => {
    if (activeServer !== 'consumet' || !selectedQualityUrl || !videoRef.current) return;

    const video = videoRef.current;
    cleanupVideoPlayer();

    if (selectedQualityUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(selectedQualityUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.error('Fatal HLS error:', data.type);
            triggerAutoFallback('Playback stream encountered an error. Switching to Aniweeb Embed...');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = selectedQualityUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(() => {});
        });
      }
    } else {
      video.src = selectedQualityUrl;
      video.play().catch(() => {});
    }

    return () => {
      cleanupVideoPlayer();
    };
  }, [selectedQualityUrl, activeServer]);

  // Save progress on video time update
  const handleTimeUpdate = () => {
    if (videoRef.current && anime) {
      const title = getAnimeTitle(anime);
      const coverImage = anime.coverImage.large || anime.coverImage.medium || '';
      updateWatchProgress({
        animeId,
        animeTitle: title,
        coverImage,
        bannerImage: anime.bannerImage || undefined,
        lastWatchedEpisode: episodeNumber,
        totalEpisodes: anime.episodes || undefined,
      });
    }
  };

  const handleRetryConsumet = () => {
    if (autoFallbackTimer) clearTimeout(autoFallbackTimer);
    setConsumetErrorMsg(null);
    loadConsumetEpisodeList();
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-brand-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-accent border-t-transparent mb-3" />
        <p className="text-sm font-medium">Loading player and streaming servers...</p>
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
  const totalEps = Math.max(consumetEpisodes.length, aniweebEpisodes?.episodes.length || 0, anime.episodes || 0);
  const aniweebEmbedUrl = getEmbedUrl(animeId, episodeNumber, track);

  const hasPrev = episodeNumber > 1;
  const hasNext = episodeNumber < totalEps;

  // Direct Download URL
  const downloadUrl = consumetData?.download || selectedQualityUrl || (consumetData?.sources?.[0]?.url);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Header Navigation */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/anime/${anime.id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-brand-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {title}</span>
        </Link>

        {/* Server Switcher & Audio Track */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Server selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-brand-muted hidden sm:inline">Server:</span>
            <div className="flex items-center rounded-lg border border-brand-border bg-brand-surface p-0.5">
              <button
                onClick={() => handleServerSelect('aniweeb')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold text-xs transition-all ${
                  activeServer === 'aniweeb'
                    ? 'bg-brand-accent text-white shadow-glow-sm'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                <Tv className="h-3 w-3" />
                <span>Aniweeb Embed (Default)</span>
              </button>
              <button
                onClick={() => handleServerSelect('consumet')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold text-xs transition-all ${
                  activeServer === 'consumet'
                    ? 'bg-brand-accent text-white shadow-glow-sm'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                <Server className="h-3 w-3" />
                <span>Consumet Direct (Experimental)</span>
              </button>
            </div>
          </div>

          {/* Track selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center rounded-lg border border-brand-border bg-brand-surface p-0.5">
              <button
                onClick={() => setTrack('sub')}
                className={`rounded-md px-2.5 py-1 font-bold text-xs transition-all ${
                  track === 'sub' ? 'bg-brand-accent text-white shadow-glow-sm' : 'text-brand-muted hover:text-white'
                }`}
              >
                SUB
              </button>
              <button
                onClick={() => setTrack('dub')}
                className={`rounded-md px-2.5 py-1 font-bold text-xs transition-all ${
                  track === 'dub' ? 'bg-brand-accent text-white shadow-glow-sm' : 'text-brand-muted hover:text-white'
                }`}
              >
                DUB
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Video Player Area */}
      <div
        ref={playerContainerRef}
        className="relative aspect-video w-full overflow-hidden rounded-2xl border border-brand-border bg-black shadow-2xl group"
      >
        {activeServer === 'consumet' ? (
          consumetLoading || sourcesLoading ? (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-brand-muted">
              <Loader2 className="h-10 w-10 animate-spin text-brand-accent mb-3" />
              <p className="text-xs font-semibold">
                {consumetLoading ? 'Checking Consumet servers...' : 'Connecting to Consumet stream...'}
              </p>
            </div>
          ) : consumetErrorMsg ? (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-brand-muted">
              <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Consumet Direct Unavailable</h3>
              <p className="text-xs text-brand-muted max-w-md mb-4">{consumetErrorMsg}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleServerSelect('aniweeb')}
                  className="flex items-center gap-2 rounded-xl bg-brand-accent px-4 py-2 text-xs font-bold text-white shadow-glow hover:bg-brand-accent-hover transition-all"
                >
                  <Tv className="h-4 w-4" />
                  Play on Aniweeb Embed
                </button>
                <button
                  onClick={handleRetryConsumet}
                  className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-surface px-4 py-2 text-xs font-bold text-white hover:border-brand-accent"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Consumet
                </button>
              </div>
            </div>
          ) : selectedQualityUrl ? (
            <div className="relative h-full w-full bg-black">
              <video
                ref={videoRef}
                onTimeUpdate={handleTimeUpdate}
                controls
                autoPlay
                className="h-full w-full object-contain"
              >
                {selectedSubtitle && (
                  <track
                    kind="subtitles"
                    src={selectedSubtitle}
                    srcLang="en"
                    label="English"
                    default
                  />
                )}
              </video>
            </div>
          ) : consumetData?.embedUrl ? (
            <iframe
              src={consumetData.embedUrl}
              title={`${title} - Episode ${episodeNumber}`}
              className="h-full w-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-brand-muted">
              <Info className="h-10 w-10 text-brand-accent mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No Consumet Direct Stream</h3>
              <p className="text-xs text-brand-muted max-w-md mb-4">
                No direct stream URL was returned for this episode. Switching to AniWeeb server.
              </p>
              <button
                onClick={() => handleServerSelect('aniweeb')}
                className="flex items-center gap-2 rounded-xl bg-brand-accent px-4 py-2 text-xs font-bold text-white shadow-glow"
              >
                <Tv className="h-4 w-4" />
                Play on Aniweeb Embed
              </button>
            </div>
          )
        ) : (
          /* Aniweeb Embed (DEFAULT RELIABLE SERVER) */
          !embedError ? (
            <iframe
              src={aniweebEmbedUrl}
              title={`${title} - Episode ${episodeNumber}`}
              className="h-full w-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              onError={() => setEmbedError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-brand-muted">
              <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Playback Stream Error</h3>
              <p className="text-xs text-brand-muted max-w-md mb-4">
                The embed provider encountered an issue loading this episode. Try refreshing or changing audio track (SUB/DUB).
              </p>
              <button
                onClick={() => setEmbedError(false)}
                className="flex items-center gap-2 rounded-xl bg-brand-accent px-4 py-2 text-xs font-bold text-white shadow-glow"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Stream
              </button>
            </div>
          )
        )}
      </div>

      {/* Episode Info & Action Buttons */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>{title}</span>
            <span className="text-brand-accent font-extrabold">• Episode {episodeNumber}</span>
          </h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Playing via {activeServer === 'consumet' ? 'Consumet Direct (Experimental)' : 'Aniweeb Embed (Default)'} ({track.toUpperCase()})
          </p>
        </div>

        {/* Action Controls: Download, Prev, Next */}
        <div className="flex flex-wrap items-center gap-2">
          {activeServer === 'consumet' && downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-900/40 transition-colors shadow-sm"
              title="Download direct video file"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </a>
          )}

          {/* Prev EP */}
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

          {/* Next EP */}
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

      {/* Episode Selector Drawer */}
      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-5">
        <div className="mb-4 flex items-center justify-between border-b border-brand-border/60 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Tv className="h-4 w-4 text-brand-accent" />
            <span>Select Episode</span>
          </h2>
          <span className="text-xs text-brand-muted font-medium">
            Available Episodes: {totalEps || 12}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 max-h-64 overflow-y-auto pr-1">
          {Array.from({ length: totalEps || 12 }, (_, i) => i + 1).map((epNum) => {
            const isActive = epNum === episodeNumber;
            return (
              <Link
                key={epNum}
                href={`/watch/${anime.id}?ep=${epNum}`}
                className={`flex items-center justify-center rounded-xl py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-accent text-white shadow-glow-sm scale-105'
                    : 'border border-brand-border/80 bg-brand-dark text-brand-muted hover:border-brand-accent hover:text-white'
                }`}
              >
                EP {epNum}
              </Link>
            );
          })}
        </div>
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
