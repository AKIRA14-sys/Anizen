export type LayoutDensity = 'compact' | 'comfortable';
export type ViewMode = 'grid' | 'list';

export interface PersonalNote {
  animeId: number;
  animeTitle: string;
  rating?: number; // 1 to 10
  note: string;
  updatedAt: number;
}

export interface ReleaseReminder {
  animeId: number;
  animeTitle: string;
  coverImage: string;
  nextAiringAt: number; // Unix timestamp
  nextEpisode: number;
  createdAt: number;
}

const DENSITY_KEY = 'anizen_layout_density';
const VIEW_MODE_KEY = 'anizen_view_mode';
const PERSONAL_NOTES_KEY = 'anizen_personal_notes';
const RECENT_SEARCHES_KEY = 'anizen_recent_searches';
const REMINDERS_KEY = 'anizen_release_reminders';

// Layout Density
export function getLayoutDensity(): LayoutDensity {
  if (typeof window === 'undefined') return 'compact';
  try {
    const val = localStorage.getItem(DENSITY_KEY);
    return val === 'comfortable' ? 'comfortable' : 'compact';
  } catch {
    return 'compact';
  }
}

export function setLayoutDensity(density: LayoutDensity): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DENSITY_KEY, density);
  } catch (e) {
    console.error('Failed to save layout density:', e);
  }
}

// View Mode (Grid vs List)
export function getViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'grid';
  try {
    const val = localStorage.getItem(VIEW_MODE_KEY);
    return val === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

export function setViewMode(mode: ViewMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode);
  } catch (e) {
    console.error('Failed to save view mode:', e);
  }
}

// Personal Ratings & Notes
export function getPersonalNotesMap(): Record<number, PersonalNote> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PERSONAL_NOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getPersonalNote(animeId: number): PersonalNote | null {
  const map = getPersonalNotesMap();
  return map[animeId] || null;
}

export function savePersonalNote(note: PersonalNote): void {
  if (typeof window === 'undefined') return;
  const map = getPersonalNotesMap();
  map[note.animeId] = { ...note, updatedAt: Date.now() };
  try {
    localStorage.setItem(PERSONAL_NOTES_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save personal note:', e);
  }
}

export function deletePersonalNote(animeId: number): void {
  if (typeof window === 'undefined') return;
  const map = getPersonalNotesMap();
  delete map[animeId];
  try {
    localStorage.setItem(PERSONAL_NOTES_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to delete personal note:', e);
  }
}

// Recent Searches
export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): string[] {
  if (typeof window === 'undefined' || !query.trim()) return [];
  const trimmed = query.trim();
  const searches = getRecentSearches().filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...searches].slice(0, 8); // Keep top 8
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recent search:', e);
  }
  return updated;
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (e) {
    console.error('Failed to clear recent searches:', e);
  }
}

// Release Reminders
export function getRemindersMap(): Record<number, ReleaseReminder> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isReminderSet(animeId: number): boolean {
  const map = getRemindersMap();
  return !!map[animeId];
}

export function toggleReminder(reminder: ReleaseReminder): boolean {
  if (typeof window === 'undefined') return false;
  const map = getRemindersMap();
  let isSet = false;
  if (map[reminder.animeId]) {
    delete map[reminder.animeId];
  } else {
    map[reminder.animeId] = reminder;
    isSet = true;
  }
  try {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save reminder:', e);
  }
  return isSet;
}
