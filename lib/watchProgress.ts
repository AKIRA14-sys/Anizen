import { WatchProgressItem } from '@/types/anime';

export type { WatchProgressItem };

const WATCH_PROGRESS_KEY = 'anizen_watch_progress_v1';

export function getWatchProgressMap(): Record<number, WatchProgressItem> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(WATCH_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Error reading watch progress from localStorage:', error);
    return {};
  }
}

export function saveWatchProgressMap(map: Record<number, WatchProgressItem>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event('anizen_watch_progress_updated'));
  } catch (error) {
    console.error('Error saving watch progress to localStorage:', error);
  }
}

export function getContinueWatchingList(): WatchProgressItem[] {
  const map = getWatchProgressMap();
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getAnimeWatchProgress(animeId: number): WatchProgressItem | null {
  const map = getWatchProgressMap();
  return map[animeId] || null;
}

export function updateWatchProgress(data: {
  animeId: number;
  animeTitle: string;
  coverImage: string;
  bannerImage?: string;
  lastWatchedEpisode: number;
  totalEpisodes?: number;
  currentTime?: number;
  duration?: number;
}): WatchProgressItem {
  const map = getWatchProgressMap();
  const existing = map[data.animeId];
  const watchedSet = new Set<number>(existing?.watchedEpisodes || []);
  watchedSet.add(data.lastWatchedEpisode);

  const updated: WatchProgressItem = {
    animeId: data.animeId,
    animeTitle: data.animeTitle,
    coverImage: data.coverImage,
    bannerImage: data.bannerImage || existing?.bannerImage,
    episodeNumber: data.lastWatchedEpisode,
    totalEpisodes: data.totalEpisodes || existing?.totalEpisodes,
    updatedAt: Date.now(),
    watchedEpisodes: Array.from(watchedSet),
  };

  map[data.animeId] = updated;
  saveWatchProgressMap(map);
  return updated;
}

export function toggleEpisodeWatched(animeId: number, episodeNumber: number): boolean {
  const map = getWatchProgressMap();
  const existing = map[animeId];
  if (!existing) return false;

  const watchedSet = new Set<number>(existing.watchedEpisodes || []);
  let isWatched = false;
  if (watchedSet.has(episodeNumber)) {
    watchedSet.delete(episodeNumber);
  } else {
    watchedSet.add(episodeNumber);
    isWatched = true;
  }

  map[animeId] = {
    ...existing,
    watchedEpisodes: Array.from(watchedSet),
    updatedAt: Date.now(),
  };

  saveWatchProgressMap(map);
  return isWatched;
}

export function isEpisodeWatched(animeId: number, episodeNumber: number): boolean {
  const map = getWatchProgressMap();
  const existing = map[animeId];
  return existing ? existing.watchedEpisodes.includes(episodeNumber) : false;
}

export function removeContinueWatching(animeId: number): WatchProgressItem[] {
  const map = getWatchProgressMap();
  delete map[animeId];
  saveWatchProgressMap(map);
  return getContinueWatchingList();
}

export function clearWatchHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(WATCH_PROGRESS_KEY);
    window.dispatchEvent(new Event('anizen_watch_progress_updated'));
  } catch (e) {
    console.error('Error clearing watch history:', e);
  }
}
