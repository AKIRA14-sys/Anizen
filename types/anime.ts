export interface AnimeTitle {
  romaji?: string;
  english?: string;
  native?: string;
}

export interface AnimeCoverImage {
  extraLarge?: string;
  large?: string;
  medium?: string;
  color?: string;
}

export interface AnimeMedia {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCoverImage;
  bannerImage?: string;
  description?: string;
  status?: string;
  episodes?: number;
  season?: string;
  seasonYear?: number;
  meanScore?: number;
  averageScore?: number;
  popularity?: number;
  genres?: string[];
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  };
}

export interface AniListResponse {
  data: {
    Page?: {
      pageInfo: {
        total: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
      };
      media: AnimeMedia[];
    };
    Media?: AnimeMedia;
  };
}

export interface AniweebEpisode {
  number: number;
  title?: string;
  titleJapanese?: string;
  image?: string;
  airDate?: string;
  duration?: number;
  filler?: boolean;
  description?: string;
}

export interface AniweebEpisodesResponse {
  anilistId: number;
  title: string;
  totalEpisodes: number;
  availableServers?: number;
  episodes: AniweebEpisode[];
}

export interface WatchlistItem {
  id: number;
  title: string;
  coverImage: string;
  bannerImage?: string;
  meanScore?: number;
  seasonYear?: number;
  addedAt: number;
}
