import { AnimeMedia } from '@/types/anime';

const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';

async function fetchGraphQL<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  try {
    const response = await fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 3600 }, // Cache responses for 1 hour
    });

    if (!response.ok) {
      throw new Error(`AniList GraphQL error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(`AniList GraphQL Query Error: ${json.errors[0].message}`);
    }

    return json.data;
  } catch (error) {
    console.error('Failed to fetch from AniList API:', error);
    throw error;
  }
}

const MEDIA_FIELDS = `
  id
  title {
    romaji
    english
    native
  }
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  description(asHtml: false)
  status
  format
  episodes
  season
  seasonYear
  meanScore
  averageScore
  popularity
  genres
  studios(isMain: true) {
    nodes {
      id
      name
    }
  }
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
`;

// Helper to sanitize title
export function getAnimeTitle(media: AnimeMedia): string {
  return media.title.english || media.title.romaji || media.title.native || 'Untitled Anime';
}

// Helper to strip HTML tags from AniList descriptions
export function cleanDescription(desc?: string): string {
  if (!desc) return 'No description available for this anime.';
  return desc.replace(/<[^>]*>?/gm, '').trim();
}

// Get Featured / Hero Anime
export async function getFeaturedAnime(): Promise<AnimeMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 8) {
        media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const data = await fetchGraphQL<{ Page: { media: AnimeMedia[] } }>(query);
  return data.Page.media.filter(item => item.bannerImage || item.coverImage.extraLarge);
}

// Get Trending Anime
export async function getTrendingAnime(page = 1, perPage = 12): Promise<AnimeMedia[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const data = await fetchGraphQL<{ Page: { media: AnimeMedia[] } }>(query, { page, perPage });
  return data.Page.media;
}

// Get Current Season Anime
export async function getSeasonalAnime(page = 1, perPage = 12): Promise<AnimeMedia[]> {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  let season = 'WINTER';
  if (month >= 2 && month <= 4) season = 'SPRING';
  else if (month >= 5 && month <= 7) season = 'SUMMER';
  else if (month >= 8 && month <= 10) season = 'FALL';

  const query = `
    query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const data = await fetchGraphQL<{ Page: { media: AnimeMedia[] } }>(query, {
    season,
    seasonYear: year,
    page,
    perPage,
  });
  return data.Page.media;
}

// Get Top Rated Anime
export async function getTopRatedAnime(page = 1, perPage = 12): Promise<AnimeMedia[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const data = await fetchGraphQL<{ Page: { media: AnimeMedia[] } }>(query, { page, perPage });
  return data.Page.media;
}

// Get Airing Schedule
export async function getAiringSchedule(): Promise<any[]> {
  const now = Math.floor(Date.now() / 1000);
  const weekLater = now + 7 * 24 * 3600;

  const query = `
    query ($airingAt_greater: Int, $airingAt_lesser: Int) {
      Page(page: 1, perPage: 24) {
        airingSchedules(airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: TIME) {
          id
          airingAt
          timeUntilAiring
          episode
          media {
            ${MEDIA_FIELDS}
          }
        }
      }
    }
  `;

  try {
    const data = await fetchGraphQL<{ Page: { airingSchedules: any[] } }>(query, {
      airingAt_greater: now,
      airingAt_lesser: weekLater,
    });
    return data.Page.airingSchedules || [];
  } catch (e) {
    console.error('Failed to fetch airing schedule:', e);
    return [];
  }
}

export interface SearchAnimeOptions {
  searchQuery?: string;
  genre?: string;
  sort?: string;
  page?: number;
  perPage?: number;
  season?: string;
  seasonYear?: number;
  format?: string;
  status?: string;
  minScore?: number;
}

// Search and Filter Anime
export async function searchAnime(
  searchQueryOrOptions?: string | SearchAnimeOptions,
  genre?: string,
  sort: string = 'POPULARITY_DESC',
  page = 1,
  perPage = 24
): Promise<{ media: AnimeMedia[]; hasNextPage: boolean }> {
  let opts: SearchAnimeOptions = {};

  if (typeof searchQueryOrOptions === 'object' && searchQueryOrOptions !== null) {
    opts = searchQueryOrOptions;
  } else {
    opts = {
      searchQuery: searchQueryOrOptions,
      genre,
      sort,
      page,
      perPage,
    };
  }

  const p = opts.page || 1;
  const pp = opts.perPage || 24;
  const s = opts.sort || 'POPULARITY_DESC';

  const query = `
    query (
      $search: String,
      $genre: String,
      $sort: [MediaSort],
      $page: Int,
      $perPage: Int,
      $season: MediaSeason,
      $seasonYear: Int,
      $format: MediaFormat,
      $status: MediaStatus,
      $minScore: Int
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        media(
          type: ANIME,
          search: $search,
          genre: $genre,
          sort: $sort,
          season: $season,
          seasonYear: $seasonYear,
          format: $format,
          status: $status,
          averageScore_greater: $minScore,
          isAdult: false
        ) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const variables: Record<string, any> = { page: p, perPage: pp, sort: [s] };
  if (opts.searchQuery && opts.searchQuery.trim()) variables.search = opts.searchQuery.trim();
  if (opts.genre && opts.genre.trim() && opts.genre !== 'All') variables.genre = opts.genre.trim();
  if (opts.season && opts.season !== 'All') variables.season = opts.season;
  if (opts.seasonYear) variables.seasonYear = opts.seasonYear;
  if (opts.format && opts.format !== 'All') variables.format = opts.format;
  if (opts.status && opts.status !== 'All') variables.status = opts.status;
  if (opts.minScore && opts.minScore > 0) variables.minScore = opts.minScore * 10; // Convert 1-10 to 10-100 scale

  const data = await fetchGraphQL<{ Page: { pageInfo: { hasNextPage: boolean }; media: AnimeMedia[] } }>(query, variables);
  return {
    media: data.Page.media || [],
    hasNextPage: !!data.Page.pageInfo?.hasNextPage,
  };
}

// Get Hidden Gems Anime (High Rating, Moderate Popularity)
export async function getHiddenGemsAnime(page = 1, perPage = 12): Promise<AnimeMedia[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(
          type: ANIME,
          sort: [SCORE_DESC],
          averageScore_greater: 78,
          popularity_lesser: 120000,
          popularity_greater: 3000,
          isAdult: false
        ) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await fetchGraphQL<{ Page: { media: AnimeMedia[] } }>(query, { page, perPage });
    return data.Page.media || [];
  } catch (e) {
    console.error('Failed to fetch hidden gems anime:', e);
    return [];
  }
}

// Get Random Anime (Surprise Me)
export async function getRandomAnime(): Promise<AnimeMedia | null> {
  const randomPage = Math.floor(Math.random() * 5) + 1; // Pick from top 5 pages of popular anime
  try {
    const { media } = await searchAnime({
      sort: 'POPULARITY_DESC',
      page: randomPage,
      perPage: 20,
    });
    if (!media || media.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * media.length);
    return media[randomIndex];
  } catch (error) {
    console.error('Failed to get random anime:', error);
    return null;
  }
}

// Get Anime Details by ID
export async function getAnimeById(id: number): Promise<AnimeMedia | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
      }
    }
  `;
  try {
    const data = await fetchGraphQL<{ Media: AnimeMedia }>(query, { id });
    return data.Media;
  } catch (error) {
    console.error(`Failed to fetch anime details for ID ${id}:`, error);
    return null;
  }
}
