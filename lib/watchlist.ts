import { AnimeMedia, WatchlistItem } from '@/types/anime';
import { getAnimeTitle } from '@/lib/anilist';

const WATCHLIST_STORAGE_KEY = 'anizen_watchlist';

export function getWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to parse watchlist from localStorage:', error);
    return [];
  }
}

export function isInWatchlist(id: number): boolean {
  const list = getWatchlist();
  return list.some(item => item.id === id);
}

export function addToWatchlist(media: AnimeMedia): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  const list = getWatchlist();
  if (!list.some(item => item.id === media.id)) {
    const newItem: WatchlistItem = {
      id: media.id,
      title: getAnimeTitle(media),
      coverImage: media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium || '',
      bannerImage: media.bannerImage,
      meanScore: media.meanScore || media.averageScore,
      seasonYear: media.seasonYear,
      addedAt: Date.now(),
    };
    const updated = [newItem, ...list];
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save item to watchlist:', e);
    }
    return updated;
  }
  return list;
}

export function removeFromWatchlist(id: number): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  const list = getWatchlist();
  const updated = list.filter(item => item.id !== id);
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove item from watchlist:', e);
  }
  return updated;
}

export function toggleWatchlist(media: AnimeMedia): { updatedList: WatchlistItem[]; isSaved: boolean } {
  if (isInWatchlist(media.id)) {
    const updatedList = removeFromWatchlist(media.id);
    return { updatedList, isSaved: false };
  } else {
    const updatedList = addToWatchlist(media);
    return { updatedList, isSaved: true };
  }
}
