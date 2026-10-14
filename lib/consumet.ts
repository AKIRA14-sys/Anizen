import { ANIME } from "@consumet/extensions";

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
  subtitles: Array<{
    url: string;
    lang: string;
  }>;
  download?: string;
  provider: string;
}

interface ProviderInstance {
  name: string;
  instance: any;
}

function createProviders(): ProviderInstance[] {
  const providers: ProviderInstance[] = [];

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
      create: () => new ANIME.Animekai(),
    },
    {
      name: "kickassanime",
      create: () => new ANIME.Kickassanime(),
    },
  ];

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
  }

  return providers;
}

const PROVIDERS = createProviders();

/**
 * Search Consumet by anime title.
 */
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

  for (const { name, instance } of PROVIDERS) {
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
      }
    } catch (error) {
      console.warn(
        `[Consumet] Search failed on ${name} for "${normalizedTitle}":`,
        error
      );
    }
  }

  return null;
}

/**
 * Compatibility helper.
 * Its argument must be an anime TITLE, not an AniList ID.
 */
export async function getConsumetEpisodes(
  title: string
): Promise<{
  animeId: string;
  provider: string;
  episodes: ConsumetEpisode[];
} | null> {
  return getConsumetEpisodesByTitle(title);
}

/**
 * Fetch sources using the exact episode ID and its provider.
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
    return null;
  }

  try {
    const response = await provider.instance.fetchEpisodeSources(
      episodeId
    );

    if (!response) {
      return null;
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

    return null;
  }
}