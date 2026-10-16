import { MangaMedia } from '@/types/manga';

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
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`AniList Manga GraphQL error: ${response.status}`);
    }

    const json = await response.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(`AniList Manga Query Error: ${json.errors[0].message}`);
    }

    return json.data;
  } catch (error) {
    console.error('Failed to fetch manga from AniList:', error);
    throw error;
  }
}

const MANGA_FIELDS = `
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
  chapters
  volumes
  meanScore
  averageScore
  popularity
  genres
`;

export function getMangaTitle(media: { title: { english?: string; romaji?: string; native?: string } }): string {
  return media.title.english || media.title.romaji || media.title.native || 'Untitled Manga';
}

export function cleanDescription(desc?: string): string {
  if (!desc) return 'No description available for this manga.';
  return desc.replace(/<[^>]*>?/gm, '').trim();
}

export async function getTrendingManga(page = 1, perPage = 12): Promise<MangaMedia[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: MANGA, sort: TRENDING_DESC, isAdult: false) {
          ${MANGA_FIELDS}
        }
      }
    }
  `;
  const data = await fetchGraphQL<{ Page: { media: MangaMedia[] } }>(query, { page, perPage });
  return data.Page.media || [];
}

export async function getPopularManga(page = 1, perPage = 12): Promise<MangaMedia[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
          ${MANGA_FIELDS}
        }
      }
    }
  `;
  const data = await fetchGraphQL<{ Page: { media: MangaMedia[] } }>(query, { page, perPage });
  return data.Page.media || [];
}

export async function searchManga(
  searchQuery?: string,
  genre?: string,
  sort: string = 'POPULARITY_DESC',
  page = 1,
  perPage = 24
): Promise<{ media: MangaMedia[]; hasNextPage: boolean }> {
  const query = `
    query ($search: String, $genre: String, $sort: [MediaSort], $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        media(type: MANGA, search: $search, genre: $genre, sort: $sort, isAdult: false) {
          ${MANGA_FIELDS}
        }
      }
    }
  `;

  const variables: Record<string, any> = { page, perPage, sort: [sort] };
  if (searchQuery && searchQuery.trim()) variables.search = searchQuery.trim();
  if (genre && genre.trim() && genre !== 'All') variables.genre = genre.trim();

  const data = await fetchGraphQL<{ Page: { pageInfo: { hasNextPage: boolean }; media: MangaMedia[] } }>(query, variables);
  return {
    media: data.Page.media || [],
    hasNextPage: !!data.Page.pageInfo?.hasNextPage,
  };
}

export async function getMangaById(id: number): Promise<MangaMedia | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: MANGA) {
        ${MANGA_FIELDS}
      }
    }
  `;
  try {
    const data = await fetchGraphQL<{ Media: MangaMedia }>(query, { id });
    return data.Media;
  } catch (error) {
    console.error(`Failed to fetch manga details for ID ${id}:`, error);
    return null;
  }
}
