import { AnimeTitle, AnimeCoverImage } from './anime';

export type MangaLibraryCategory = 'Reading' | 'Plan to Read' | 'Completed' | 'On Hold' | 'Dropped' | 'Favourites';

export type ReadingDirection = 'rtl' | 'ltr' | 'vertical';
export type ReadingMode = 'single' | 'webtoon';

export interface MangaMedia {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCoverImage;
  bannerImage?: string;
  description?: string;
  status?: string;
  format?: string;
  chapters?: number;
  volumes?: number;
  seasonYear?: number;
  meanScore?: number;
  averageScore?: number;
  popularity?: number;
  genres?: string[];
  staff?: {
    nodes?: Array<{ id: number; name: { full: string } }>;
  };
}

export interface MangaChapter {
  id: string; // MangaDex UUID
  chapterNumber: string;
  volumeNumber?: string;
  title?: string;
  language: string;
  pagesCount: number;
  publishAt?: string;
  scanlationGroup?: string;
}

export interface MangaChapterPages {
  chapterId: string;
  baseUrl: string;
  hash: string;
  pageFilenames: string[];
  pageUrls: string[];
}

export interface MangaReadingProgress {
  mangaId: number;
  mangaTitle: string;
  coverImage: string;
  chapterId: string;
  chapterNumber: string;
  pageNumber: number;
  totalPages: number;
  updatedAt: number;
  readingDirection?: ReadingDirection;
  readingMode?: ReadingMode;
}

export interface MangaLibraryItem {
  id: number;
  title: string;
  coverImage: string;
  bannerImage?: string;
  meanScore?: number;
  addedAt: number;
  category: MangaLibraryCategory;
  lastReadChapter?: string;
}
