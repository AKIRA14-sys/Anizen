import { META, ANIME } from '@consumet/extensions';

export interface ConsumetEpisode {
  id: string;
  number: number;
  title?: string;
  image?: string;
  description?: string;
  url?: string;
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
  headers?: Record<string, string>;
  sources: ConsumetSource[];
  subtitles?: ConsumetSubtitle[];
  download?: string;
  embedUrl?: string;
}

// Instance cache
let anilistProvider: InstanceType<typeof META.Anilist> | null = null;
let hianimeProvider: InstanceType<typeof ANIME.Hianime> | null = null;

function getAnilistProvider() {
  if (!anilistProvider) {
    anilistProvider = new META.Anilist();
  }
  return anilistProvider;
}

function getHianimeProvider() {
  if (!hianimeProvider) {
    hianimeProvider = new ANIME.Hianime();
  }
  return hianimeProvider;
}

/**
 * Fetch episode list for a given AniList ID using Consumet META.Anilist
 */
export async function getConsumetEpisodes(anilistId: string): Promise<ConsumetEpisode[]> {
  try {
    const provider = getAnilistProvider();
    const info = await provider.fetchAnimeInfo(anilistId);
    if (info && Array.isArray(info.episodes) && info.episodes.length > 0) {
      return info.episodes.map((ep: any) => ({
        id: String(ep.id || ep.number),
        number: Number(ep.number || 1),
        title: ep.title || `Episode ${ep.number}`,
        image: ep.image,
        description: ep.description,
        url: ep.url,
      }));
    }
  } catch (err: any) {
    console.warn(`[Consumet] Fetch info failed for AniList ID ${anilistId}:`, err?.message || err);
  }

  // Secondary fallback: search HiAnime directly
  try {
    const hianime = getHianimeProvider();
    const searchRes = await hianime.search(anilistId);
    if (searchRes.results && searchRes.results.length > 0) {
      const first = searchRes.results[0];
      const info = await hianime.fetchAnimeInfo(first.id);
      if (info && Array.isArray(info.episodes) && info.episodes.length > 0) {
        return info.episodes.map((ep: any) => ({
          id: String(ep.id),
          number: Number(ep.number || 1),
          title: ep.title || `Episode ${ep.number}`,
          image: ep.image,
          url: ep.url,
        }));
      }
    }
  } catch (err: any) {
    console.warn(`[Consumet] HiAnime fallback failed for AniList ID ${anilistId}:`, err?.message || err);
  }

  return [];
}

/**
 * Fetch streaming sources for a given episode ID using Consumet
 */
export async function getConsumetSources(episodeId: string): Promise<ConsumetSourcesResult | null> {
  try {
    const provider = getAnilistProvider();
    const res: any = await provider.fetchEpisodeSources(episodeId);
    if (res && (res.sources?.length > 0 || res.download || res.embedUrl || res.embedURL)) {
      const downloadLink = typeof res.download === 'string'
        ? res.download
        : Array.isArray(res.download) && res.download.length > 0
          ? res.download[0]?.url
          : undefined;

      return {
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
    console.warn(`[Consumet] Fetch episode sources failed for ${episodeId}:`, err?.message || err);
  }

  // Fallback: try HiAnime directly
  try {
    const hianime = getHianimeProvider();
    const res: any = await hianime.fetchEpisodeSources(episodeId);
    if (res && (res.sources?.length > 0 || res.download || res.embedUrl || res.embedURL)) {
      const downloadLink = typeof res.download === 'string'
        ? res.download
        : Array.isArray(res.download) && res.download.length > 0
          ? res.download[0]?.url
          : undefined;

      return {
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
    console.warn(`[Consumet] HiAnime fetchEpisodeSources failed for ${episodeId}:`, err?.message || err);
  }

  return null;
}
