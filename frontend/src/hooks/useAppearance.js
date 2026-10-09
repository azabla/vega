import { useEffect, useSyncExternalStore } from "react";
import { useProfile } from "@/hooks/useProfile";
import { usePortfolioUsername } from "@/hooks/usePortfolioUsername";
import { ACCENTS, FONTS, THEMES, THEME_MODE, THEME_TEXTURE, resolveSettings } from "@/lib/settings";

// The look of a page comes from three places, strongest last:
//   1. the owner's Portfolio.settings (theme, font, texture, default mode)
//   2. a preview the visitor picked in the theme menu (theme, accent, font), this tab only
//   3. the visitor's light/dark choice, remembered across visits
// index.html repeats this logic before first paint so there is no flash.

const MODE_KEY = "theme"; // "light" | "dark" | "system"; absent = owner's default
const PREVIEW_KEY = "look-preview";
const lookKey = (username) => `look:${String(username).toLowerCase()}`;

const storage = {
  get: (key, store = localStorage) => {
    try {
      return store.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value, store = localStorage) => {
    try {
      if (value == null) store.removeItem(key);
      else store.setItem(key, value);
    } catch {
      // storage blocked: the choice still applies until the tab closes
    }
  },
};

const parse = (json) => {
  try {
    return JSON.parse(json) ?? {};
  } catch {
    return {};
  }
};

// ?theme=midnight&accent=violet&font=modern previews a look; ?customize shows the picker
const previewFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const preview = {};
  if (THEMES.some((t) => t.id === params.get("theme"))) preview.theme = params.get("theme");
  if (ACCENTS.some((a) => a.id === params.get("accent"))) preview.accent = params.get("accent");
  if (FONTS.some((f) => f.id === params.get("font"))) preview.font = params.get("font");
  return { preview, customize: params.has("customize") || Object.keys(preview).length > 0 };
};

const media = window.matchMedia("(prefers-color-scheme: dark)");
const fromUrl = previewFromUrl();
const savedPreview = parse(storage.get(PREVIEW_KEY, sessionStorage));

// The dashboard's Appearance page embeds the site in an iframe and posts unsaved
// settings here, so the preview shows the draft before it's saved.
export const PREVIEW_MESSAGE = "vega:appearance-draft";
const embedded = window.parent !== window;

let state = {
  draft: null,
  mode: storage.get(MODE_KEY),
  preview: { ...savedPreview, ...fromUrl.preview },
  systemDark: media.matches,
  canCustomize:
    import.meta.env.DEV || fromUrl.customize || Object.keys(savedPreview).length > 0,
};
if (fromUrl.customize) storage.set(PREVIEW_KEY, JSON.stringify(state.preview), sessionStorage);

const listeners = new Set();
const update = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
media.addEventListener("change", (e) => update({ systemDark: e.matches }));
if (embedded) {
  window.addEventListener("message", (e) => {
    if (e.origin !== window.location.origin || e.data?.type !== PREVIEW_MESSAGE) return;
    update({ draft: e.data.settings ?? null, previewDark: e.data.dark });
  });
}

export const setMode = (mode) => {
  storage.set(MODE_KEY, mode);
  update({ mode });
};

export const setPreview = (patch) => {
  const preview = patch ? { ...state.preview, ...patch } : {};
  storage.set(PREVIEW_KEY, Object.keys(preview).length ? JSON.stringify(preview) : null, sessionStorage);
  update({ preview });
};

/** The resolved look for the current portfolio, plus the visitor's choices. */
export const useAppearance = () => {
  const snap = useSyncExternalStore(subscribe, () => state);
  const { profile, loading } = useProfile();
  const owner = resolveSettings(snap.draft ?? profile?.settings);
  const settings = { ...owner, ...snap.preview };
  // a previewed theme brings its own default mode (Midnight is dark-first)
  const defaultMode = snap.preview.theme ? (THEME_MODE[snap.preview.theme] ?? "system") : owner.mode;
  const mode = snap.mode ?? defaultMode;
  const isDark =
    typeof snap.previewDark === "boolean"
      ? snap.previewDark
      : mode === "dark" || (mode === "system" && snap.systemDark);
  const texture = settings.texture === "default" ? THEME_TEXTURE[settings.theme] : settings.texture;

  return {
    settings, // full resolved settings (sections, pages, layouts...) with any preview applied
    ownerSettings: owner,
    mode,
    isDark,
    texture,
    ready: !loading,
    preview: snap.preview,
    canCustomize: snap.canCustomize,
    toggleDark: () => setMode(isDark ? "light" : "dark"),
  };
};

/** Applies the look to <html>. Call once, in the site layout. */
export const useApplyAppearance = () => {
  const username = usePortfolioUsername();
  const { settings, ownerSettings, isDark, texture, ready } = useAppearance();

  const ownerTexture =
    ownerSettings.texture === "default" ? THEME_TEXTURE[ownerSettings.theme] : ownerSettings.texture;
  const ownerLook = JSON.stringify({
    theme: ownerSettings.theme,
    accent: ownerSettings.accent,
    font: ownerSettings.font,
    texture: ownerTexture,
    mode: ownerSettings.mode,
  });

  useEffect(() => {
    // until the profile arrives, keep what index.html applied from the cache
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.accent = settings.accent;
    root.dataset.font = settings.font;
    root.dataset.texture = texture;
    root.removeAttribute("data-app");
    root.classList.toggle("dark", isDark);
    // a dashboard preview must not overwrite the cached saved look
    if (!embedded) storage.set(lookKey(username), ownerLook);
  }, [ready, username, settings.theme, settings.accent, settings.font, texture, isDark, ownerLook]);
};

/** Dashboard and login pages: one plain look, with the visitor's light/dark choice. */
export const useAppLook = () => {
  const snap = useSyncExternalStore(subscribe, () => state);
  const mode = snap.mode ?? "system";
  const isDark = mode === "dark" || (mode === "system" && snap.systemDark);
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-app", "");
    root.dataset.theme = "minimal";
    delete root.dataset.accent;
    delete root.dataset.font;
    delete root.dataset.texture;
    root.classList.toggle("dark", isDark);
  }, [isDark]);
  return { isDark, toggleDark: () => setMode(isDark ? "light" : "dark") };
};
