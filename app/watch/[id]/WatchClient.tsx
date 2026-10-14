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
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import { AnimeMedia, AniweebEpisodesResponse } from '@/types/anime';
import { getAnimeById, getAnimeTitle } from '@/lib/anilist';
import { getEpisodes, getEmbedUrl } from '@/lib/aniweeb';
import { updateWatchProgress, getAnimeWatchProgress } from '@/lib/watchProgress';

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
  const [activeServer, setActiveServer] = useState<'consumet' | 'aniweeb'>('consumet');

  // Episodes state
  const [consumetEpisodes, setConsumetEpisodes] = useState<any[]>([]);
  const [aniweebEpisodes, setAniweebEpisodes] = useState<AniweebEpisodesResponse | null>(null);

  // Consumet sources state
  const [consumetData, setConsumetData] = useState<ConsumetSourcesData | null>(null);
  const [selectedQualityUrl, setSelectedQualityUrl] = useState<string>('');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('');

  // Player controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSettings, setShowSettings] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [embedError, setEmbedError] = useState(false);

  // Load Anime metadata and episode list
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
      } catch (e) {
        console.error('Error fetching initial anime watch data:', e);
      } finally {
        setLoading(false);
      }

      // Try fetching Consumet episodes list in background
      try {
        const res = await fetch(`/api/consumet/episodes/${animeId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.episodes) && json.episodes.length > 0) {
            setConsumetEpisodes(json.episodes);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch Consumet episode list:', e);
      }
    }

    loadWatchData();
  }, [animeId]);

  // Attach HLS stream to video element when selectedQualityUrl changes
  useEffect(() => {
    if (!selectedQualityUrl || !videoRef.current) return;

    const video = videoRef.current;

    if (selectedQualityUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(selectedQualityUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });

        return () => {
          hls.destroy();
        };
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
  }, [selectedQualityUrl]);

  // Fetch Consumet sources when episode or audio track changes
  useEffect(() => {
    if (isNaN(animeId)) return;

    async function fetchSources() {
      setSourcesLoading(true);
      setConsumetData(null);
      setSelectedQualityUrl('');

      let matchedEpId = '';
      if (consumetEpisodes.length > 0) {
        const found = consumetEpisodes.find((e) => e.number === episodeNumber);
        if (found) matchedEpId = found.id;
      }

      if (!matchedEpId) {
        matchedEpId = `${animeId}-ep-${episodeNumber}`;
      }

      try {
        const res = await fetch(`/api/consumet/sources?episodeId=${encodeURIComponent(matchedEpId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && (json.sources?.length > 0 || json.download || json.embedUrl)) {
            setConsumetData(json);
            if (json.sources?.length > 0) {
              setSelectedQualityUrl(json.sources[0].url);
            }
            if (json.subtitles?.length > 0) {
              const eng = json.subtitles.find((s: any) => s.lang?.toLowerCase().includes('english'));
              setSelectedSubtitle(eng ? eng.url : json.subtitles[0].url);
            }
            setActiveServer('consumet');
            setSourcesLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Consumet sources error:', e);
      }

      // If Consumet returns no direct sources, fallback to Aniweeb embed
      setActiveServer('aniweeb');
      setSourcesLoading(false);
    }

    fetchSources();
  }, [animeId, episodeNumber, track, consumetEpisodes]);

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

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (playerContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerContainerRef.current.requestFullscreen();
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSettings(false);
    }
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

  // Determine available direct download URL
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
                onClick={() => setActiveServer('consumet')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold text-xs transition-all ${
                  activeServer === 'consumet'
                    ? 'bg-brand-accent text-white shadow-glow-sm'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                <Server className="h-3 w-3" />
                <span>Consumet Direct</span>
              </button>
              <button
                onClick={() => setActiveServer('aniweeb')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold text-xs transition-all ${
                  activeServer === 'aniweeb'
                    ? 'bg-brand-accent text-white shadow-glow-sm'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                <Tv className="h-3 w-3" />
                <span>Aniweeb Embed</span>
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
        {sourcesLoading ? (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-brand-muted">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-accent border-t-transparent mb-3" />
            <p className="text-xs font-semibold">Connecting to high-speed stream...</p>
          </div>
        ) : activeServer === 'consumet' && selectedQualityUrl ? (
          /* Custom Video Player with Direct Source */
          <div className="relative h-full w-full bg-black">
            <video
              ref={videoRef}
              src={selectedQualityUrl}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
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

            {/* Custom Settings Menu */}
            {showSettings && (
              <div className="absolute right-4 bottom-14 z-30 w-48 rounded-xl border border-brand-border/80 bg-brand-dark/95 p-3 text-xs shadow-2xl backdrop-blur-md">
                <p className="mb-2 font-bold text-brand-muted uppercase tracking-wider text-[10px]">
                  Playback Speed
                </p>
                <div className="flex flex-col gap-1">
                  {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
                        playbackSpeed === speed
                          ? 'bg-brand-accent/20 text-brand-accent'
                          : 'text-white hover:bg-brand-surface'
                      }`}
                    >
                      <span>{speed}x</span>
                      {playbackSpeed === speed && <CheckCircle2 className="h-3.5 w-3.5 text-brand-accent" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeServer === 'consumet' && consumetData?.embedUrl ? (
          /* Consumet Provider Embed */
          <iframe
            src={consumetData.embedUrl}
            title={`${title} - Episode ${episodeNumber}`}
            className="h-full w-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        ) : (
          /* Fallback Aniweeb Embed */
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
                The external embed provider encountered an issue loading this episode. Try switching servers or audio tracks.
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
            Playing via {activeServer === 'consumet' ? 'Consumet Engine' : 'Aniweeb Embed'} ({track.toUpperCase()})
          </p>
        </div>

        {/* Action Controls: Download, Prev, Next */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Download Button */}
          {downloadUrl && (
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
