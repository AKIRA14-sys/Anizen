import { META, ANIME } from '@consumet/extensions';
import { getAnimeById, getAnimeTitle } from '@/lib/anilist';

export interface ConsumetEpisode {
  id: string;
  number: number;
  title?: string;
  image?: string;
  description?: string;
  url?: string;
  provider?: string;
}

export interface ConsumetSource {
  url: string;
  isM3U8?: boolean;
  quality?: string;
  isDASH?: boolean;
}

export interface ConsumetSubtitle {
  url: string;
  lang: string;
}

export interface ConsumetSourcesResult {
  provider: string;
  headers?: Record<string, string>;
  sources: ConsumetSource[];
  subtitles?: ConsumetSubtitle[];
  download?: string;
  embedUrl?: string;
}

export interface ProviderDiagnosticError {
  provider: string;
  message: string;
}

export interface ConsumetEpisodesResult {
  success: boolean;
  anilistId: string;
  episodes: ConsumetEpisode[];
  errors: ProviderDiagnosticError[];
  message?: string;
}

// Bounded timeout helper
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Robustly fetch episodes across Consumet providers with error aggregation
 */
export async function getConsumetEpisodesResult(anilistId: string): Promise<ConsumetEpisodesResult> {
  const errors: ProviderDiagnosticError[] = [];

  // 1. Try Consumet META.Anilist provider by AniList ID
  try {
    const anilistProvider = new META.Anilist();
    const info = await withTimeout(
      anilistProvider.fetchAnimeInfo(anilistId),
      6000,
      'META.Anilist request timed out (6s)'
    );

    if (info && Array.isArray(info.episodes) && info.episodes.length > 0) {
      const episodes: ConsumetEpisode[] = info.episodes.map((ep: any) => ({
        id: String(ep.id || ep.number),
        number: Number(ep.number || 1),
        title: ep.title || `Episode ${ep.number}`,
        image: ep.image,
        description: ep.description,
        url: ep.url,
        provider: 'anilist',
      }));

      return {
        success: true,
        anilistId,
        episodes,
        errors: [],
      };
    } else {
      errors.push({
        provider: 'META.Anilist',
        message: 'No episode listings returned for this AniList ID.',
      });
    }
  } catch (err: any) {
    errors.push({
      provider: 'META.Anilist',
      message: err?.message || 'Failed to fetch via META.Anilist provider.',
    });
  }

  // 2. Resolve title from AniList metadata to try direct anime providers
  let title = '';
  try {
    const parsedId = parseInt(anilistId, 10);
    if (!isNaN(parsedId)) {
      const animeMedia = await getAnimeById(parsedId);
      if (animeMedia) {
        title = getAnimeTitle(animeMedia);
      }
    }
  } catch (e: any) {
    errors.push({
      provider: 'AniList-Resolver',
      message: e?.message || 'Could not resolve anime title from AniList ID.',
    });
  }

  if (title) {
    // Try HiAnime by title search
    try {
      const hianime = new ANIME.Hianime();
      const searchRes = await withTimeout(
        hianime.search(title),
        6000,
        'HiAnime title search timed out (6s)'
      );

      if (searchRes.results && searchRes.results.length > 0) {
        const first = searchRes.results[0];
        const info = await withTimeout(
          hianime.fetchAnimeInfo(first.id),
          6000,
          'HiAnime fetchAnimeInfo timed out (6s)'
        );

        if (info && Array.isArray(info.episodes) && info.episodes.length > 0) {
          const episodes: ConsumetEpisode[] = info.episodes.map((ep: any) => ({
            id: String(ep.id),
            number: Number(ep.number || 1),
            title: ep.title || `Episode ${ep.number}`,
            image: ep.image,
            url: ep.url,
            provider: 'hianime',
          }));

          return {
            success: true,
            anilistId,
            episodes,
            errors,
          };
        }
      } else {
        errors.push({
          provider: 'HiAnime',
          message: `No search matches found for title "${title}".`,
        });
      }
    } catch (err: any) {
      errors.push({
        provider: 'HiAnime',
        message: err?.message || 'HiAnime provider error during episode discovery.',
      });
    }
  }

  return {
    success: false,
    anilistId,
    episodes: [],
    errors,
    message: 'No playable Consumet episodes could be found across available providers.',
  };
}

/**
 * Legacy wrapper for backward compatibility
 */
export async function getConsumetEpisodes(anilistId: string): Promise<ConsumetEpisode[]> {
  const result = await getConsumetEpisodesResult(anilistId);
  return result.episodes;
}

/**
 * Direct title search wrapper
 */
export async function getConsumetEpisodesByTitle(title: string): Promise<ConsumetEpisode[]> {
  try {
    const hianime = new ANIME.Hianime();
    const searchRes = await withTimeout(hianime.search(title), 6000, 'Title search timed out');
    if (searchRes.results && searchRes.results.length > 0) {
      const first = searchRes.results[0];
      const info = await withTimeout(hianime.fetchAnimeInfo(first.id), 6000, 'Info fetch timed out');
      if (info && Array.isArray(info.episodes) && info.episodes.length > 0) {
        return info.episodes.map((ep: any) => ({
          id: String(ep.id),
          number: Number(ep.number || 1),
          title: ep.title || `Episode ${ep.number}`,
          image: ep.image,
          url: ep.url,
          provider: 'hianime',
        }));
      }
    }
  } catch (err: any) {
    console.warn(`[Consumet] Direct title search failed for "${title}":`, err?.message || err);
  }
  return [];
}

/**
 * Extract streaming sources safely for a given episode ID and optional provider
 */
export async function getConsumetSources(
  episodeId: string,
  providerName?: string
): Promise<ConsumetSourcesResult | null> {
  const targetProvider = providerName?.toLowerCase() || 'anilist';

  if (targetProvider === 'hianime') {
    try {
      const hianime = new ANIME.Hianime();
      const res: any = await withTimeout(
        hianime.fetchEpisodeSources(episodeId),
        8000,
        'HiAnime source fetch timed out (8s)'
      );

      if (res && (res.sources?.length > 0 || res.download || res.embedUrl || res.embedURL)) {
        const downloadLink = typeof res.download === 'string'
          ? res.download
          : Array.isArray(res.download) && res.download.length > 0
            ? res.download[0]?.url
            : undefined;

        return {
          provider: 'hianime',
          headers: res.headers as Record<string, string> | undefined,
          sources: (res.sources || []).map((s: any) => ({
            url: s.url,
            isM3U8: Boolean(s.isM3U8 || s.url?.includes('.m3u8')),
            quality: s.quality || 'default',
            isDASH: Boolean(s.isDASH),
          })),
          subtitles: (res.subtitles || []).map((sub: any) => ({
            url: sub.url,
            lang: sub.lang || sub.language || 'English',
          })),
          download: downloadLink,
          embedUrl: res.embedUrl || res.embedURL,
        };
      }
    } catch (err: any) {
      console.warn(`[Consumet] HiAnime source extraction failed for ${episodeId}:`, err?.message || err);
    }
  }

  // Primary/Fallback: Consumet META.Anilist provider
  try {
    const provider = new META.Anilist();
    const res: any = await withTimeout(
      provider.fetchEpisodeSources(episodeId),
      8000,
      'META.Anilist source fetch timed out (8s)'
    );

    if (res && (res.sources?.length > 0 || res.download || res.embedUrl || res.embedURL)) {
      const downloadLink = typeof res.download === 'string'
        ? res.download
        : Array.isArray(res.download) && res.download.length > 0
          ? res.download[0]?.url
          : undefined;

      return {
        provider: 'anilist',
        headers: res.headers as Record<string, string> | undefined,
        sources: (res.sources || []).map((s: any) => ({
          url: s.url,
          isM3U8: Boolean(s.isM3U8 || s.url?.includes('.m3u8')),
          quality: s.quality || 'default',
          isDASH: Boolean(s.isDASH),
        })),
        subtitles: (res.subtitles || []).map((sub: any) => ({
          url: sub.url,
          lang: sub.lang || sub.language || 'English',
        })),
        download: downloadLink,
        embedUrl: res.embedUrl || res.embedURL,
      };
    }
  } catch (err: any) {
    console.warn(`[Consumet] META.Anilist source extraction failed for ${episodeId}:`, err?.message || err);
  }

  return null;
}
