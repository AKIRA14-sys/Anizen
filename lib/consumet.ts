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
  subtitles: Array<{
    url: string;
    lang: string;
  }>;
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

interface ProviderInstance {
  name: string;
  instance: any;
}

function createProviders(): ProviderInstance[] {
  const constructors: Array<{
    name: string;
    create: () => any;
  }> = [
    {
      name: "hianime",
      create: () => new ANIME.Hianime(),
    },
    {
      name: "animepahe",
      create: () => new ANIME.AnimePahe(),
    },
    {
      name: "animekai",
      create: () => new ANIME.AnimeKai(),
    },
    {
      name: "kickassanime",
      create: () => new ANIME.KickAssAnime(),
    },
  ];

  const providers: ProviderInstance[] = [];

  for (const item of constructors) {
    try {
      providers.push({
        name: item.name,
        instance: item.create(),
      });
    } catch (error) {
      console.warn(
        `[Consumet] Failed to initialize ${item.name}:`,
        error
      );
    }
  } catch (err: any) {
    errors.push({
      provider: 'META.Anilist',
      message: err?.message || 'Failed to fetch via META.Anilist provider.',
    });
  }

  return providers;
}

const PROVIDERS = createProviders();

export async function getConsumetEpisodesByTitle(
  title: string
): Promise<{
  animeId: string;
  provider: string;
  episodes: ConsumetEpisode[];
} | null> {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    return null;
  }

  if (title) {
    // Try HiAnime by title search
    try {
      const search = await instance.search(normalizedTitle);
      const results = search?.results;

      if (!Array.isArray(results) || results.length === 0) {
        continue;
      }

      for (const result of results.slice(0, 5)) {
        if (!result?.id) {
          continue;
        }

        try {
          const info = await instance.fetchAnimeInfo(result.id);
          const rawEpisodes = info?.episodes;

          if (!Array.isArray(rawEpisodes)) {
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
                  typeof episode.title === "string" &&
                  episode.title.trim()
                    ? episode.title
                    : `Episode ${index + 1}`,
                image:
                  typeof episode.image === "string"
                    ? episode.image
                    : undefined,
                provider: name,
              };
            });

          if (episodes.length > 0) {
            return {
              animeId: String(result.id),
              provider: name,
              episodes,
            };
          }
        } catch (error) {
          console.warn(
            `[Consumet] Failed to load episodes from ${name}:`,
            error
          );
        }
      } else {
        errors.push({
          provider: 'HiAnime',
          message: `No search matches found for title "${title}".`,
        });
      }
    } catch (error) {
      console.warn(
        `[Consumet] Search failed on ${name}:`,
        error
      );
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
 * Compatibility helper.
 * The argument must be an anime title, not an AniList ID.
 */
export async function getConsumetEpisodes(
  title: string
) {
  return getConsumetEpisodesByTitle(title);
}

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
    return null;
  }

/**
 * Direct title search wrapper
 */
export async function getConsumetEpisodesByTitle(title: string): Promise<ConsumetEpisode[]> {
  try {
    const response =
      await provider.instance.fetchEpisodeSources(episodeId);

    if (!response) {
      return null;
    }
  } catch (err: any) {
    console.warn(`[Consumet] Direct title search failed for "${title}":`, err?.message || err);
  }
  return [];
}

    const sources: ConsumetSource[] = (
      Array.isArray(response.sources) ? response.sources : []
    )
      .filter(
        (source: any) =>
          typeof source?.url === "string" &&
          source.url.trim().length > 0
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

    const subtitles = (
      Array.isArray(response.subtitles) ? response.subtitles : []
    )
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
      }));

    const download =
      typeof response.download === "string"
        ? response.download
        : undefined;

    if (sources.length === 0 && !download) {
      return null;
    }
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
      `[Consumet] Failed to fetch sources from ${providerName}:`,
      error
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
