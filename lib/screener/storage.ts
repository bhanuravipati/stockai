/**
 * Saved-screen persistence. There's no user/auth model in this app (see
 * CLAUDE.md), so screens live in the browser's localStorage — same pattern
 * as the peer-column preference in app/company/[symbol]/peers/page.tsx.
 */

const SCREENS_STORAGE_KEY = "nebulion:screens";

export interface SavedScreen {
  id: string;
  name: string;
  query: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}

function isSavedScreen(v: unknown): v is SavedScreen {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return typeof s.id === "string" && typeof s.name === "string" && typeof s.query === "string" && typeof s.createdAt === "string" && typeof s.updatedAt === "string";
}

export function loadScreens(): SavedScreen[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SCREENS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedScreen);
  } catch {
    return [];
  }
}

function saveScreens(screens: SavedScreen[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCREENS_STORAGE_KEY, JSON.stringify(screens));
  } catch {
    // Storage full/unavailable — silently drop, matching the peer-columns preference pattern.
  }
}

export function upsertScreen(screen: SavedScreen): void {
  const screens = loadScreens();
  const idx = screens.findIndex((s) => s.id === screen.id);
  if (idx >= 0) screens[idx] = screen;
  else screens.push(screen);
  saveScreens(screens);
}

export function deleteScreen(id: string): void {
  saveScreens(loadScreens().filter((s) => s.id !== id));
}

export function touchLastRun(id: string): void {
  const screens = loadScreens();
  const idx = screens.findIndex((s) => s.id === id);
  if (idx < 0) return;
  screens[idx] = { ...screens[idx], lastRunAt: new Date().toISOString() };
  saveScreens(screens);
}
