import { AnimeMedia, WatchlistItem, WatchlistCategory } from '@/types/anime';
import { getAnimeTitle } from '@/lib/anilist';

const WATCHLIST_STORAGE_KEY = 'anizen_watchlist';

export function getWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!data) return [];
    const list: any[] = JSON.parse(data);
    // Migration: ensure every item has a valid category property
    let needsSave = false;
    const migratedList: WatchlistItem[] = list.map((item) => {
      if (!item.category) {
        needsSave = true;
        return { ...item, category: 'Plan to Watch' as WatchlistCategory };
      }
      return item as WatchlistItem;
    });

    if (needsSave) {
      try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(migratedList));
      } catch (e) {
        console.error('Failed to save migrated watchlist:', e);
      }
    }
    return migratedList;
  } catch (error) {
    console.error('Failed to parse watchlist from localStorage:', error);
    return [];
  }
}

export function isInWatchlist(id: number): boolean {
  const list = getWatchlist();
  return list.some((item) => item.id === id);
}

export function getWatchlistItem(id: number): WatchlistItem | undefined {
  const list = getWatchlist();
  return list.find((item) => item.id === id);
}

export function addToWatchlist(
  media: AnimeMedia,
  category: WatchlistCategory = 'Plan to Watch'
): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  const list = getWatchlist();
  const existingIndex = list.findIndex((item) => item.id === media.id);

  if (existingIndex >= 0) {
    // Update existing item category
    list[existingIndex].category = category;
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to update watchlist category:', e);
    }
    return list;
  } else {
    const newItem: WatchlistItem = {
      id: media.id,
      title: getAnimeTitle(media),
      coverImage: media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium || '',
      bannerImage: media.bannerImage,
      meanScore: media.meanScore || media.averageScore,
      seasonYear: media.seasonYear,
      addedAt: Date.now(),
      category,
    };
    const updated = [newItem, ...list];
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save item to watchlist:', e);
    }
    return updated;
  }
}

export function updateWatchlistCategory(id: number, category: WatchlistCategory): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  const list = getWatchlist();
  const updated = list.map((item) => (item.id === id ? { ...item, category } : item));
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update watchlist category:', e);
  }
  return updated;
}

export function removeFromWatchlist(id: number): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  const list = getWatchlist();
  const updated = list.filter((item) => item.id !== id);
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove item from watchlist:', e);
  }
  return updated;
}

export function clearWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    localStorage.removeItem(WATCHLIST_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear watchlist:', e);
  }
  return [];
}

export function toggleWatchlist(
  media: AnimeMedia,
  category: WatchlistCategory = 'Plan to Watch'
): { updatedList: WatchlistItem[]; isSaved: boolean } {
  if (isInWatchlist(media.id)) {
    const updatedList = removeFromWatchlist(media.id);
    return { updatedList, isSaved: false };
  } else {
    const updatedList = addToWatchlist(media, category);
    return { updatedList, isSaved: true };
  }
}
