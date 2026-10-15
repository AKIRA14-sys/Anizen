import { MangaReadingProgress } from '@/types/manga';

const READING_PROGRESS_KEY = 'anizen_reading_progress_v1';

export function getReadingProgressMap(): Record<number, MangaReadingProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(READING_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveReadingProgress(progress: MangaReadingProgress): void {
  if (typeof window === 'undefined') return;
  const map = getReadingProgressMap();
  map[progress.mangaId] = progress;
  try {
    localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save reading progress:', e);
  }
}

export function getContinueReadingList(): MangaReadingProgress[] {
  const map = getReadingProgressMap();
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function removeContinueReading(mangaId: number): MangaReadingProgress[] {
  if (typeof window === 'undefined') return [];
  const map = getReadingProgressMap();
  delete map[mangaId];
  try {
    localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(map));
  } catch {}
  return getContinueReadingList();
}
