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
  Tv,
  Download,
  Server,
  CheckCircle2,
} from 'lucide-react';
import { AnimeMedia, AniweebEpisodesResponse } from '@/types/anime';
import { getAnimeById, getAnimeTitle } from '@/lib/anilist';
import { getEpisodes, getEmbedUrl } from '@/lib/aniweeb';
import {
  updateWatchProgress,
} from '@/lib/watchProgress';

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
  provider?: string;
}

interface ConsumetEpisodeItem {
  id: string;
  number: number;
  title?: string;
  image?: string;
  provider: string;
}

interface WatchClientProps {
  id: string;
}

const ALLOWED_CONSUMET_PROVIDERS = new Set([
  'hianime',
  'animepahe',
  'animekai',
  'kickassanime',
]);

function WatchClientContent({ id }: WatchClientProps) {
  const searchParams = useSearchParams();

  const animeId = Number.parseInt(id, 10);
  const requestedEpisode = Number.parseInt(
    searchParams.get('ep') || '1',
    10
  );

  const episodeNumber =
    Number.isFinite(requestedEpisode) && requestedEpisode > 0
      ? requestedEpisode
      : 1;

  const [anime, setAnime] = useState<AnimeMedia | null>(null);

  const [track, setTrack] = useState<'sub' | 'dub'>('sub');

  const [activeServer, setActiveServer] = useState<
    'consumet' | 'aniweeb'
  >('aniweeb');

  // Episode lists
  const [consumetEpisodes, setConsumetEpisodes] = useState<
    ConsumetEpisodeItem[]
  >([]);

  const [aniweebEpisodes, setAniweebEpisodes] =
    useState<AniweebEpisodesResponse | null>(null);

  // Streaming source state
  const [consumetData, setConsumetData] =
    useState<ConsumetSourcesData | null>(null);

  const [selectedQualityUrl, setSelectedQualityUrl] =
    useState('');

  const [selectedSubtitle, setSelectedSubtitle] =
    useState('');

  // Video player references
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  // Player controls
  const [isPlaying, setIsPlaying] = useState(false);

  const [isMuted, setIsMuted] = useState(false);

  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const [showSettings, setShowSettings] = useState(false);

  // Loading and error state
  const [loading, setLoading] = useState(true);

  const [sourcesLoading, setSourcesLoading] = useState(false);

  const [embedError, setEmbedError] = useState(false);

  // ============================================================
  // LOAD ANIME DETAILS AND EPISODE LISTS
  // ============================================================

  useEffect(() => {
    if (!Number.isFinite(animeId) || animeId <= 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadWatchData() {
      setLoading(true);
      setEmbedError(false);

      try {
        const [mediaResult, aniweebResult] = await Promise.allSettled([
          getAnimeById(animeId),
          getEpisodes(animeId),
        ]);

        if (cancelled) {
          return;
        }

        if (mediaResult.status === 'fulfilled') {
          setAnime(mediaResult.value);
        } else {
          console.error(
            'Failed to load AniList anime metadata:',
            mediaResult.reason
          );
        }

        if (aniweebResult.status === 'fulfilled') {
          setAniweebEpisodes(aniweebResult.value);
        } else {
          console.warn(
            'Failed to load AniWeeb episodes:',
            aniweebResult.reason
          );

          setAniweebEpisodes(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Error loading anime watch data:',
            error
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }

      // Load Consumet episodes independently.
      // AniList metadata and AniWeeb must remain usable if
      // a Consumet provider is unavailable.
      try {
        const response = await fetch(
          `/api/consumet/episodes/${animeId}`,
          {
            headers: {
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(20000),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Consumet episodes request failed: ${response.status}`
          );
        }

        const json = await response.json();

        if (
          cancelled ||
          !json.success ||
          !Array.isArray(json.episodes)
        ) {
          return;
        }

        const validEpisodes: ConsumetEpisodeItem[] =
          json.episodes.filter(
            (episode: unknown): episode is ConsumetEpisodeItem => {
              if (
                !episode ||
                typeof episode !== 'object'
              ) {
                return false;
              }

              const item = episode as Partial<ConsumetEpisodeItem>;

              return (
                typeof item.id === 'string' &&
                item.id.length > 0 &&
                typeof item.number === 'number' &&
                Number.isFinite(item.number) &&
                item.number > 0 &&
                typeof item.provider === 'string' &&
                ALLOWED_CONSUMET_PROVIDERS.has(item.provider)
              );
            }
          );

        setConsumetEpisodes(validEpisodes);
      } catch (error) {
        if (!cancelled) {
          console.warn(
            'Could not load Consumet episode list. AniWeeb remains available:',
            error
          );
        }
      }
    }

    loadWatchData();

    return () => {
      cancelled = true;
    };
  }, [animeId]);

  // ============================================================
  // ATTACH HLS OR DIRECT VIDEO SOURCES
  // ============================================================

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !selectedQualityUrl) {
      return;
    }

    let hls: Hls | null = null;
    let cancelled = false;

    const handleLoadedMetadata = () => {
      if (cancelled) {
        return;
      }

      video.play().catch(() => {
        // Some browsers require the user to press Play.
      });
    };

    const isHlsSource =
      /\.m3u8(?:$|[?#])/i.test(selectedQualityUrl);

    if (isHlsSource) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });

        hls.loadSource(selectedQualityUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!cancelled) {
            video.play().catch(() => {});
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.warn(
              'Fatal HLS playback error:',
              data.type,
              data.details
            );
          }
        });
      } else if (
        video.canPlayType('application/vnd.apple.mpegurl')
      ) {
        video.src = selectedQualityUrl;

        video.addEventListener(
          'loadedmetadata',
          handleLoadedMetadata
        );
      } else {
        console.warn(
          'This browser does not support HLS playback.'
        );
      }
    } else {
      video.src = selectedQualityUrl;

      video.addEventListener(
        'loadedmetadata',
        handleLoadedMetadata
      );

      video.play().catch(() => {});
    }

    return () => {
      cancelled = true;

      if (hls) {
        hls.destroy();
      }

      video.removeEventListener(
        'loadedmetadata',
        handleLoadedMetadata
      );
    };
  }, [selectedQualityUrl]);

  // ============================================================
  // FETCH CONSUMET SOURCES
  //
  // FIXES:
  // 1. Uses the actual episode ID returned by Consumet.
  // 2. Sends the correct provider name.
  // 3. Never fabricates an episode ID.
  // 4. Falls back to the existing AniWeeb embed.
  // 5. Cancels outdated requests when the episode changes.
  // ============================================================

  useEffect(() => {
    if (!Number.isFinite(animeId) || animeId <= 0) {
      return;
    }

    let cancelled = false;

    const controller = new AbortController();

    async function fetchSources() {
      setSourcesLoading(true);
      setConsumetData(null);
      setSelectedQualityUrl('');
      setSelectedSubtitle('');
      setEmbedError(false);

      try {
        // Find the exact episode from the provider's episode list.
        const matchedEpisode = consumetEpisodes.find(
          (episode) => episode.number === episodeNumber
        );

        // Do not fabricate an ID. Consumet IDs belong to
        // individual providers and must be used as returned.
        if (
          !matchedEpisode ||
          !matchedEpisode.id ||
          !matchedEpisode.provider ||
          !ALLOWED_CONSUMET_PROVIDERS.has(
            matchedEpisode.provider
          )
        ) {
          if (!cancelled) {
            setActiveServer('aniweeb');
          }

          return;
        }

        const query = new URLSearchParams({
          episodeId: matchedEpisode.id,
          provider: matchedEpisode.provider,
        });

        const response = await fetch(
          `/api/consumet/sources?${query.toString()}`,
          {
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Consumet sources request failed: ${response.status}`
          );
        }

        const json: ConsumetSourcesData & {
          success?: boolean;
          message?: string;
        } = await response.json();

        if (cancelled) {
          return;
        }

        const hasSources =
          Array.isArray(json.sources) &&
          json.sources.some(
            (source) =>
              typeof source?.url === 'string' &&
              source.url.length > 0
          );

        const hasEmbed =
          typeof json.embedUrl === 'string' &&
          json.embedUrl.length > 0;

        const hasDownload =
          typeof json.download === 'string' &&
          json.download.length > 0;

        if (
          json.success !== false &&
          (hasSources || hasEmbed || hasDownload)
        ) {
          setConsumetData({
            headers: json.headers,
            sources: Array.isArray(json.sources)
              ? json.sources
              : [],
            subtitles: Array.isArray(json.subtitles)
              ? json.subtitles
              : [],
            download: json.download,
            embedUrl: json.embedUrl,
            provider: matchedEpisode.provider,
          });

          if (hasSources) {
            const sources = json.sources.filter(
              (source) =>
                typeof source?.url === 'string' &&
                source.url.length > 0
            );

            // Prefer HLS when available; otherwise use
            // the first valid direct source.
            const preferredSource =
              sources.find(
                (source) =>
                  source.isM3U8 ||
                  /\.m3u8(?:$|[?#])/i.test(source.url)
              ) || sources[0];

            if (preferredSource) {
              setSelectedQualityUrl(preferredSource.url);
            }
          }

          if (
            Array.isArray(json.subtitles) &&
            json.subtitles.length > 0
          ) {
            const englishSubtitle = json.subtitles.find(
              (subtitle) =>
                subtitle.lang
                  ?.toLowerCase()
                  .includes('english')
            );

            const chosenSubtitle =
              englishSubtitle || json.subtitles[0];

            if (chosenSubtitle?.url) {
              setSelectedSubtitle(chosenSubtitle.url);
            }
          }

          setActiveServer('consumet');
          return;
        }

        // No usable sources: keep AniWeeb available.
        setActiveServer('aniweeb');
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === 'AbortError'
        ) {
          return;
        }

        if (!cancelled) {
          console.warn(
            'Consumet streaming sources unavailable:',
            error
          );

          setActiveServer('aniweeb');
        }
      } finally {
        if (!cancelled) {
          setSourcesLoading(false);
        }
      }
    }

    fetchSources();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    animeId,
    episodeNumber,
    track,
    consumetEpisodes,
  ]);

  // ============================================================
  // WATCH PROGRESS
  // ============================================================

  const handleTimeUpdate = () => {
    if (!videoRef.current || !anime) {
      return;
    }

    const title = getAnimeTitle(anime);

    const coverImage =
      anime.coverImage.large ||
      anime.coverImage.medium ||
      '';

    updateWatchProgress({
      animeId,
      animeTitle: title,
      coverImage,
      bannerImage: anime.bannerImage || undefined,
      lastWatchedEpisode: episodeNumber,
      totalEpisodes: anime.episodes || undefined,
    });
  };

  // ============================================================
  // PLAYER CONTROLS
  // ============================================================

  const togglePlay = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleFullscreen = () => {
    const container = playerContainerRef.current;

    if (!container) {
      return;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      container.requestFullscreen().catch(() => {});
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }

    setPlaybackSpeed(speed);
    setShowSettings(false);
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-brand-muted">
        <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />

        <p className="text-sm font-medium">
          Loading player and streaming servers...
        </p>
      </div>
    );
  }

  // ============================================================
  // ANIME NOT FOUND
  // ============================================================

  if (!anime) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-brand-accent" />

        <h1 className="text-2xl font-bold text-white">
          Anime Not Found
        </h1>

        <p className="mt-2 text-sm text-brand-muted">
          The requested anime information could not be loaded.
        </p>

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

  // ============================================================
  // DERIVED PLAYER DATA
  // ============================================================

  const title = getAnimeTitle(anime);

  const totalEps = Math.max(
    consumetEpisodes.length > 0
      ? Math.max(
          ...consumetEpisodes.map((episode) => episode.number)
        )
      : 0,
    aniweebEpisodes?.episodes.length || 0,
    anime.episodes || 0
  );

  const aniweebEmbedUrl = getEmbedUrl(
    animeId,
    episodeNumber,
    track
  );

  const hasPrev = episodeNumber > 1;

  const hasNext =
    totalEps > 0 && episodeNumber < totalEps;

  const downloadUrl =
    consumetData?.download ||
    selectedQualityUrl ||
    consumetData?.sources?.[0]?.url;

  // ============================================================
  // MAIN WATCH PAGE
  // ============================================================

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

      {/* Header Navigation */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/anime/${anime.id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-brand-muted transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />

          <span>Back to {title}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">

          {/* Streaming Server Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="hidden text-brand-muted sm:inline">
              Server:
            </span>

            <div className="flex items-center rounded-lg border border-brand-border bg-brand-surface p-0.5">
              <button
                type="button"
                onClick={() => {
                  setActiveServer('consumet');
                  setEmbedError(false);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all ${
                  activeServer === 'consumet'
                    ? 'bg-brand-accent text-white shadow-glow-sm'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                <Server className="h-3 w-3" />

                <span>Consumet Direct</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveServer('aniweeb');
                  setEmbedError(false);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all ${
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

          {/* Audio Track Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center rounded-lg border border-brand-border bg-brand-surface p-0.5">
              <button
                type="button"
                onClick={() => setTrack('sub')}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                  track === 'sub'
                    ? 'bg-brand-accent text-white shadow-glow-sm'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                SUB
              </button>

              <button
                type="button"
                onClick={() => setTrack('dub')}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                  track === 'dub'
                    ? 'bg-brand-accent text-white shadow-glow-sm'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                DUB
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Video Player */}
      <div
        ref={playerContainerRef}
        className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-brand-border bg-black shadow-2xl"
      >
        {sourcesLoading ? (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-brand-muted">
            <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />

            <p className="text-xs font-semibold">
              Connecting to streaming servers...
            </p>
          </div>
        ) : activeServer === 'consumet' &&
          selectedQualityUrl ? (
          <div className="relative h-full w-full bg-black">
            <video
              key={selectedQualityUrl}
              ref={videoRef}
              src={selectedQualityUrl}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onVolumeChange={() => {
                if (videoRef.current) {
                  setIsMuted(videoRef.current.muted);
                }
              }}
              controls
              autoPlay
              playsInline
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

            {/* Playback Speed Menu */}
            {showSettings && (
              <div className="absolute bottom-14 right-4 z-30 w-48 rounded-xl border border-brand-border/80 bg-brand-dark/95 p-3 text-xs shadow-2xl backdrop-blur-md">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                  Playback Speed
                </p>

                <div className="flex flex-col gap-1">
                  {[0.5, 1, 1.25, 1.5, 2].map(
                    (speed) => (
                      <button
                        type="button"
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
                          playbackSpeed === speed
                            ? 'bg-brand-accent/20 text-brand-accent'
                            : 'text-white hover:bg-brand-surface'
                        }`}
                      >
                        <span>{speed}x</span>

                        {playbackSpeed === speed && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-accent" />
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ) : activeServer === 'consumet' &&
          consumetData?.embedUrl ? (
          <iframe
            src={consumetData.embedUrl}
            title={`${title} - Episode ${episodeNumber}`}
            className="h-full w-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        ) : (
          /* Existing AniWeeb fallback */
          !embedError ? (
            <iframe
              key={`${animeId}-${episodeNumber}-${track}`}
              src={aniweebEmbedUrl}
              title={`${title} - Episode ${episodeNumber}`}
              className="h-full w-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              onError={() => setEmbedError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-brand-muted">
              <AlertTriangle className="mb-3 h-10 w-10 text-amber-500" />

              <h3 className="mb-1 text-lg font-bold text-white">
                Playback Stream Error
              </h3>

              <p className="mb-4 max-w-md text-xs text-brand-muted">
                The streaming provider could not load this episode.
                Try switching servers or audio tracks.
              </p>

              <button
                type="button"
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

      {/* Anime and Episode Information */}
      <div className="mt-4 flex flex-col justify-between gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
            <span>{title}</span>

            <span className="font-extrabold text-brand-accent">
              • Episode {episodeNumber}
            </span>
          </h1>

          <p className="mt-0.5 text-xs text-brand-muted">
            Playing via{' '}
            {activeServer === 'consumet'
              ? 'Consumet Engine'
              : 'Aniweeb Embed'}{' '}
            ({track.toUpperCase()})
          </p>
        </div>

        {/* Download and Episode Navigation */}
        <div className="flex flex-wrap items-center gap-2">

          {activeServer === 'consumet' && downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-2 text-xs font-bold text-emerald-400 shadow-sm transition-colors hover:bg-emerald-900/40"
              title="Open the available video download"
            >
              <Download className="h-4 w-4" />

              <span>Download</span>
            </a>
          )}

          {/* Previous Episode */}
          {hasPrev ? (
            <Link
              href={`/watch/${anime.id}?ep=${episodeNumber - 1}`}
              className="flex items-center gap-1 rounded-xl border border-brand-border bg-brand-dark px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:border-brand-accent hover:text-brand-accent"
            >
              <ChevronLeft className="h-4 w-4" />

              <span>Prev EP</span>
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="flex cursor-not-allowed items-center gap-1 rounded-xl border border-brand-border/40 bg-brand-dark/40 px-3.5 py-2 text-xs font-semibold text-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />

              <span>Prev EP</span>
            </button>
          )}

          {/* Next Episode */}
          {hasNext ? (
            <Link
              href={`/watch/${anime.id}?ep=${episodeNumber + 1}`}
              className="flex items-center gap-1 rounded-xl bg-brand-accent px-4 py-2 text-xs font-bold text-white shadow-glow transition-colors hover:bg-brand-accent-hover"
            >
              <span>Next EP</span>

              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="flex cursor-not-allowed items-center gap-1 rounded-xl border border-brand-border/40 bg-brand-dark/40 px-3.5 py-2 text-xs font-semibold text-gray-600"
            >
              <span>Next EP</span>

              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Episode Selector */}
      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-5">
        <div className="mb-4 flex items-center justify-between border-b border-brand-border/60 pb-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <Tv className="h-4 w-4 text-brand-accent" />

            <span>Select Episode</span>
          </h2>

          <span className="text-xs font-medium text-brand-muted">
            Available Episodes: {totalEps || 12}
          </span>
        </div>

        <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12">
          {Array.from(
            { length: totalEps || 12 },
            (_, index) => index + 1
          ).map((epNum) => {
            const isActive = epNum === episodeNumber;

            return (
              <Link
                key={epNum}
                href={`/watch/${anime.id}?ep=${epNum}`}
                className={`flex items-center justify-center rounded-xl py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'scale-105 bg-brand-accent text-white shadow-glow-sm'
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

// ============================================================
// WATCH PAGE WRAPPER
// ============================================================

export default function WatchClient({
  id,
}: WatchClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-brand-muted">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />

          <p className="text-xs">
            Loading Watch Player...
          </p>
        </div>
      }
    >
      <WatchClientContent id={id} />
    </Suspense>
  );
}