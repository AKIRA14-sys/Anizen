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
  episodes
  season
  seasonYear
  meanScore
  averageScore
  popularity
  genres
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

// Search and Filter Anime
export async function searchAnime(
  searchQuery?: string,
  genre?: string,
  sort: string = 'POPULARITY_DESC',
  page = 1,
  perPage = 24
): Promise<{ media: AnimeMedia[]; hasNextPage: boolean }> {
  const query = `
    query ($search: String, $genre: String, $sort: [MediaSort], $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        media(type: ANIME, search: $search, genre: $genre, sort: $sort, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const variables: Record<string, any> = { page, perPage, sort: [sort] };
  if (searchQuery && searchQuery.trim()) variables.search = searchQuery.trim();
  if (genre && genre.trim()) variables.genre = genre.trim();

  const data = await fetchGraphQL<{ Page: { pageInfo: { hasNextPage: boolean }; media: AnimeMedia[] } }>(query, variables);
  return {
    media: data.Page.media,
    hasNextPage: data.Page.pageInfo.hasNextPage,
  };
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
