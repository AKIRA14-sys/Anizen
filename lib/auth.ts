export interface UserSession {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: number;
}

const AUTH_STORAGE_KEY = 'anizen_user_session_v1';

export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUserSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event('anizen_auth_changed'));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event('anizen_auth_changed'));
  } catch {}
}
