export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "geoqocha-theme";
export const THEME_EVENT = "geoqocha:theme";

const THEME_COLOR: Record<Theme, string> = {
  light: "#F0F7FF",
  dark: "#060B14",
};

export function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function getPreferredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Sin acceso a almacenamiento: se usa la preferencia del sistema.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
}

export function setTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // La preferencia no se persiste, pero el tema sí se aplica.
  }
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}

export function hasStoredTheme(): boolean {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
