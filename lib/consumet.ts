import { ANIME } from '@consumet/extensions';

export interface ConsumetEpisode {
  id: string;
  number: number;
  title?: string;
  image?: string;
  provider: string;
}

export interface ConsumetSource {
  url: string;
  isM3U8?: boolean;
  quality?: string;
}

export interface ConsumetSourcesResult {
  headers?: Record<string, string>;
  sources: ConsumetSource[];
  subtitles?: { url: string; lang: string }[];
  download?: string;
  provider: string;
}

// List of providers to try (in order of preference)
const PROVIDERS = [
  { name: 'hianime', instance: new ANIME.Hianime() },
  { name: 'animepahe', instance: new ANIME.AnimePahe() },
  { name: 'animekai', instance: new ANIME.Animekai() },
  { name: 'kickassanime', instance: new ANIME.Kickassanime() },
];

/**
 * Search across multiple providers and return episodes from the first one that works
 */
export async function getConsumetEpisodesByTitle(title: string): Promise<{
  animeId: string;
  provider: string;
  episodes: ConsumetEpisode[];
} | null> {
  for (const { name, instance } of PROVIDERS) {
    try {
      const search = await instance.search(title);
      if (!search?.results?.length) continue;

      const best = search.results[0];
      const info = await instance.fetchAnimeInfo(best.id);

      if (info?.episodes?.length > 0) {
        return {
          animeId: best.id,
          provider: name,
          episodes: info.episodes.map((ep: any) => ({
            id: ep.id,
            number: Number(ep.number),
            title: ep.title || `Episode ${ep.number}`,
            image: ep.image,
            provider: name,
          })),
        };
      }
    } catch (err) {
      console.warn(`[Consumet] \( {name} failed for title " \){title}":`, err);
      // Continue to next provider
    }
  }

  return null; // All providers failed
}

/**
 * Get streaming sources from a specific provider using the exact episode ID
 */
export async function getConsumetSources(
  episodeId: string,
  providerName: string
): Promise<ConsumetSourcesResult | null> {
  const provider = PROVIDERS.find((p) => p.name === providerName);
  if (!provider) return null;

  try {
    const res: any = await provider.instance.fetchEpisodeSources(episodeId);

    if (!res || (!res.sources?.length && !res.download)) {
      return null;
    }

    return {
      headers: res.headers,
      sources: (res.sources || []).map((s: any) => ({
        url: s.url,
        isM3U8: Boolean(s.isM3U8 || s.url?.includes('.m3u8')),
        quality: s.quality || 'auto',
      })),
      subtitles: (res.subtitles || []).map((sub: any) => ({
        url: sub.url,
        lang: sub.lang || sub.language || 'English',
      })),
      download: typeof res.download === 'string' ? res.download : undefined,
      provider: providerName,
    };
  } catch (err) {
    console.warn(`[Consumet] Failed to get sources from ${providerName}:`, err);
    return null;
  }
}