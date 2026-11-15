import { useEffect, useState } from "react";
import { applyTheme, getCurrentTheme, hasStoredTheme, setTheme, THEME_EVENT, type Theme } from "../../theme";

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(getCurrentTheme);

  useEffect(() => {
    const sync = () => setThemeState(getCurrentTheme());
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const followSystem = () => {
      if (hasStoredTheme()) return;
      const next: Theme = media?.matches ? "dark" : "light";
      applyTheme(next);
      setThemeState(next);
    };

    applyTheme(getCurrentTheme());
    window.addEventListener(THEME_EVENT, sync);
    media?.addEventListener?.("change", followSystem);
    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      media?.removeEventListener?.("change", followSystem);
    };
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
    const root = document.documentElement;
    root.classList.add("theme-switching");
    window.setTimeout(() => root.classList.remove("theme-switching"), 320);
  };

  const label = theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro";

  return (
    <button
      type="button"
      className="geoq-theme-toggle"
      onClick={toggle}
      title={label}
      aria-label={label}
      aria-pressed={theme === "dark"}
    >
      <span className="material-symbols-outlined" aria-hidden="true">
        {theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
      <span className="geoq-theme-toggle-label">{theme === "dark" ? "Claro" : "Oscuro"}</span>
    </button>
  );
}
