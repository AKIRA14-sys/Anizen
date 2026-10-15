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

export type WatchlistCategory = 'Watching' | 'Plan to Watch' | 'Completed' | 'On Hold' | 'Dropped' | 'Favourites';

export interface AnimeRelationEdge {
  relationType: 'PREQUEL' | 'SEQUEL' | 'PARENT' | 'SIDE_STORY' | 'ALTERNATIVE' | 'SUMMARY' | 'SPIN_OFF' | 'OTHER' | string;
  node: {
    id: number;
    title: AnimeTitle;
    coverImage: AnimeCoverImage;
    bannerImage?: string;
    format?: string;
    status?: string;
    episodes?: number;
    seasonYear?: number;
    meanScore?: number;
  };
}

export interface AnimeMedia {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCoverImage;
  bannerImage?: string;
  description?: string;
  status?: string;
  format?: string;
  episodes?: number;
  season?: string;
  seasonYear?: number;
  meanScore?: number;
  averageScore?: number;
  popularity?: number;
  genres?: string[];
  studios?: {
    nodes?: Array<{ id: number; name: string }>;
  };
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  };
  relations?: {
    edges?: AnimeRelationEdge[];
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
  category: WatchlistCategory;
}

export interface WatchProgressItem {
  animeId: number;
  animeTitle: string;
  coverImage: string;
  bannerImage?: string;
  episodeNumber: number;
  totalEpisodes?: number;
  updatedAt: number;
  watchedEpisodes: number[];
}
