import { META, ANIME } from '@consumet/extensions';
import { getAnimeById, getAnimeTitle } from '@/lib/anilist';

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
  subtitles?: {
    url: string;
    lang: string;
  }[];
  download?: string;
  provider: string;
}

interface ConsumetProvider {
  name: string;
  instance: any;
}

/**
 * Initialize providers independently.
 * If one provider is unavailable in the installed package version,
 * the other providers can still be used.
 */
function createProviders(): ConsumetProvider[] {
  const providers: ConsumetProvider[] = [];

  const providerConstructors: {
    name: string;
    constructor: new () => any;
  }[] = [
    {
      name: "hianime",
      constructor: ANIME.Hianime,
    },
    {
      name: "animepahe",
      constructor: ANIME.AnimePahe,
    },
    {
      name: "animekai",
      constructor: ANIME.Animekai,
    },
    {
      name: "kickassanime",
      constructor: ANIME.Kickassanime,
    },
  ];

  for (const provider of providerConstructors) {
    try {
      if (typeof provider.constructor !== "function") {
        console.warn(
          `[Consumet] Provider "${provider.name}" is unavailable.`
        );
        continue;
      }

      providers.push({
        name: provider.name,
        instance: new provider.constructor(),
      });
    } catch (error) {
      console.warn(
        `[Consumet] Could not initialize "${provider.name}":`,
        error
      );
    }
  }

  return providers;
}

const PROVIDERS = createProviders();

/**
 * Fetch episode list for a given AniList ID using Consumet META.Anilist
 * with fallback title search via HiAnime
 */
export async function getConsumetEpisodes(anilistId: string): Promise<ConsumetEpisode[]> {
  // 1. First attempt: Consumet META.Anilist by AniList ID
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

  // 2. Secondary fallback: resolve title from AniList and search HiAnime
  try {
    const parsedId = parseInt(anilistId, 10);
    if (!isNaN(parsedId)) {
      const animeMedia = await getAnimeById(parsedId);
      if (animeMedia) {
        const title = getAnimeTitle(animeMedia);
        const hianime = getHianimeProvider();
        const searchRes = await hianime.search(title);
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
      }
    }
  } catch (err: any) {
    console.warn(`[Consumet] Title search fallback failed for AniList ID ${anilistId}:`, err?.message || err);
  }

  return [];
}

/**
 * Convenience wrapper to search Consumet directly by anime title
 */
export async function getConsumetEpisodesByTitle(title: string): Promise<ConsumetEpisode[]> {
  try {
    const hianime = getHianimeProvider();
    const searchRes = await hianime.search(title);
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

      // Try search results until one provides usable episode information.
      for (const result of results.slice(0, 5)) {
        if (!result?.id) {
          continue;
        }

        try {
          const info = await instance.fetchAnimeInfo(result.id);
          const rawEpisodes = info?.episodes;

          if (!Array.isArray(rawEpisodes) || rawEpisodes.length === 0) {
            continue;
          }

          const episodes: ConsumetEpisode[] = rawEpisodes
            .filter((episode: any) => episode?.id)
            .map((episode: any, index: number) => {
              const parsedNumber = Number(episode.number);

              return {
                id: String(episode.id),
                number:
                  Number.isFinite(parsedNumber) && parsedNumber > 0
                    ? parsedNumber
                    : index + 1,
                title:
                  typeof episode.title === "string" && episode.title.trim()
                    ? episode.title
                    : `Episode ${index + 1}`,
                image:
                  typeof episode.image === "string"
                    ? episode.image
                    : undefined,
                provider: name,
              };
            });

          if (episodes.length === 0) {
            continue;
          }

          return {
            animeId: String(result.id),
            provider: name,
            episodes,
          };
        } catch (error) {
          console.warn(
            `[Consumet] Failed to load anime information from "${name}":`,
            error
          );
        }
      }
    } catch (error) {
      console.warn(
        `[Consumet] Search failed for "${normalizedTitle}" on "${name}":`,
        error
      );

      // Continue to the next provider.
    }
  } catch (err: any) {
    console.warn(`[Consumet] Search failed for title "${title}":`, err?.message || err);
  }
  return [];
}

/**
 * Fetch streaming sources for an episode from its original provider.
 *
 * IMPORTANT:
 * Pass the exact episode ID returned by getConsumetEpisodesByTitle()
 * and the matching provider name.
 */
export async function getConsumetSources(
  episodeId: string,
  providerName: string
): Promise<ConsumetSourcesResult | null> {
  if (!episodeId.trim() || !providerName.trim()) {
    return null;
  }

  const provider = PROVIDERS.find(
    (item) => item.name === providerName
  );

  if (!provider) {
    console.warn(
      `[Consumet] Provider "${providerName}" is unavailable.`
    );

    return null;
  }

  try {
    const response = await provider.instance.fetchEpisodeSources(episodeId);

    if (!response) {
      return null;
    }

    const rawSources = Array.isArray(response.sources)
      ? response.sources
      : [];

    const sources: ConsumetSource[] = rawSources
      .filter(
        (source: any) =>
          typeof source?.url === "string" && source.url.trim().length > 0
      )
      .map((source: any) => ({
        url: source.url,
        isM3U8:
          Boolean(source.isM3U8) ||
          /\.m3u8(?:$|[?#])/i.test(source.url),
        quality:
          typeof source.quality === "string"
            ? source.quality
            : "auto",
      }));

    const subtitles = Array.isArray(response.subtitles)
      ? response.subtitles
          .filter(
            (subtitle: any) =>
              typeof subtitle?.url === "string" &&
              subtitle.url.trim().length > 0
          )
          .map((subtitle: any) => ({
            url: subtitle.url,
            lang:
              subtitle.lang ||
              subtitle.language ||
              "Unknown",
          }))
      : [];

    const download =
      typeof response.download === "string"
        ? response.download
        : undefined;

    if (sources.length === 0 && !download) {
      console.warn(
        `[Consumet] No playable sources returned by "${providerName}".`
      );

      return null;
    }

    const headers =
      response.headers &&
      typeof response.headers === "object" &&
      !Array.isArray(response.headers)
        ? response.headers
        : undefined;

    return {
      headers,
      sources,
      subtitles,
      download,
      provider: providerName,
    };
  } catch (error) {
    console.warn(
      `[Consumet] Failed to fetch episode sources from "${providerName}":`,
      error
    );

    return null;
  }
}