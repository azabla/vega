// Portfolio.settings defaults and options.
// Keep in sync with backend/portfolio/site_settings.py.

import { PROFESSIONS } from "@/lib/professions";

// `paper`: background and card colours (light, dark), the same as in index.css. A custom accent
// colour is checked for contrast against them (lib/colors.js).
export const THEMES = [
  { id: "warm", name: "Warm", swatch: ["#f7f1e8", "#3b2a20", "#a84b2a"], paper: { light: ["#f7f1e8", "#fffaf3"], dark: ["#1c1512", "#251c18"] } },
  { id: "minimal", name: "Minimal", swatch: ["#ffffff", "#111113", "#2350d8"], paper: { light: ["#ffffff", "#ffffff"], dark: ["#0b0b0d", "#131316"] } },
  { id: "midnight", name: "Midnight", swatch: ["#0b1020", "#e6e9f2", "#c6f432"], paper: { light: ["#f4f6fb", "#ffffff"], dark: ["#0b1020", "#121933"] } },
  { id: "mono", name: "Mono", swatch: ["#ffffff", "#0a0a0a", "#ff4f00"], paper: { light: ["#ffffff", "#ffffff"], dark: ["#0a0a0a", "#141414"] } },
  { id: "sage", name: "Sage", swatch: ["#f2f5ef", "#1f2a22", "#3f6b4b"], paper: { light: ["#f2f5ef", "#fbfcf9"], dark: ["#111712", "#182019"] } },
  { id: "rose", name: "Rose", swatch: ["#fbf4f2", "#3a2328", "#b4466a"], paper: { light: ["#fbf4f2", "#fffaf9"], dark: ["#1a1214", "#23181b"] } },
];

// Suggested accent colours for any theme (settings.accent_color); any #rrggbb works
export const ACCENT_COLORS = [
  { name: "Cobalt", color: "#2350d8" },
  { name: "Violet", color: "#6d3fe0" },
  { name: "Fuchsia", color: "#c026d3" },
  { name: "Rose", color: "#e11d48" },
  { name: "Tangerine", color: "#ea580c" },
  { name: "Amber", color: "#d97706" },
  { name: "Lime", color: "#84cc16" },
  { name: "Emerald", color: "#059669" },
  { name: "Teal", color: "#0d9488" },
  { name: "Sky", color: "#0284c7" },
  { name: "Ink", color: "#1f2937" },
];

export const ACCENTS = [
  { id: "lime", name: "Lime", color: "#c6f432" },
  { id: "violet", name: "Violet", color: "#a78bfa" },
];

export const FONTS = [
  { id: "editorial", name: "Editorial", sample: "Instrument Serif + Geist", family: '"Instrument Serif", serif' },
  { id: "modern", name: "Modern", sample: "Space Grotesk + Inter", family: '"Space Grotesk Variable", sans-serif' },
  { id: "classic", name: "Classic", sample: "Fraunces + DM Sans", family: '"Fraunces Variable", serif' },
  { id: "bold", name: "Bold", sample: "Bricolage Grotesque + Inter", family: '"Bricolage Grotesque Variable", sans-serif' },
  { id: "elegant", name: "Elegant", sample: "Playfair Display + Manrope", family: '"Playfair Display Variable", serif' },
];

export const RADII = [
  { id: "default", name: "Theme default" },
  { id: "sharp", name: "Sharp" },
  { id: "soft", name: "Soft" },
  { id: "round", name: "Round" },
];
export const SURFACES = [
  { id: "outline", name: "Outline", hint: "Hairline borders" },
  { id: "elevated", name: "Elevated", hint: "Soft shadows" },
  { id: "filled", name: "Filled", hint: "Tinted, no borders" },
];
export const NAV_STYLES = [
  { id: "bar", name: "Bar", hint: "Full width, blurs on scroll" },
  { id: "floating", name: "Floating", hint: "A rounded bar that floats" },
];
export const HEROES = ["bento", "classic", "minimal", "split", "statement"];

// Background texture when the owner leaves it on "default"
export const THEME_TEXTURE = { minimal: "none", warm: "noise", midnight: "grid", mono: "grid", sage: "noise", rose: "none" };
// Midnight is a dark theme first: visitors without a preference see it dark
export const THEME_MODE = { midnight: "dark" };

export const HOME_SECTIONS = [
  { id: "about", name: "About" },
  { id: "projects", name: "Featured projects" },
  { id: "experience", name: "Experience" },
  { id: "skills", name: "Skills" },
  { id: "achievements", name: "Awards & publications" },
  { id: "education", name: "Education" },
  { id: "testimonials", name: "Testimonials" },
  { id: "contact", name: "Contact" },
];
// Sections that start hidden until the owner (or a profession preset) turns them on
const HIDDEN_BY_DEFAULT = ["education"];

export const PAGES = ["about", "experience", "projects", "skills", "achievements", "resume", "contact"];

export const DEFAULT_SETTINGS = {
  theme: "warm",
  accent: "lime",
  font: "editorial",
  texture: "default",
  mode: "system",
  hero: "bento",
  projects_layout: "showcase",
  profession: "general",
  accent_color: "",
  radius: "default",
  surface: "outline",
  nav: "bar",
};

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

/** Fill in defaults and drop anything invalid, so bad data never breaks a page. */
export const resolveSettings = (raw) => {
  const s = raw && typeof raw === "object" ? raw : {};
  const theme = pick(s.theme, THEMES.map((t) => t.id), DEFAULT_SETTINGS.theme);

  // stored order first, then any section the owner hasn't placed yet
  const known = HOME_SECTIONS.map((x) => x.id);
  const stored = (Array.isArray(s.sections) ? s.sections : []).filter((x) => known.includes(x?.id));
  const sections = [
    ...stored.map((x) => ({ id: x.id, visible: x.visible !== false })),
    ...known.filter((id) => !stored.some((x) => x.id === id)).map((id) => ({ id, visible: !HIDDEN_BY_DEFAULT.includes(id) })),
  ];

  const pages = Object.fromEntries(PAGES.map((p) => [p, s.pages?.[p] !== false]));

  return {
    theme,
    accent: pick(s.accent, ACCENTS.map((a) => a.id), DEFAULT_SETTINGS.accent),
    font: pick(s.font, FONTS.map((f) => f.id), DEFAULT_SETTINGS.font),
    texture: pick(s.texture, ["default", "none", "grid", "noise"], "default"),
    mode: pick(s.mode, ["system", "light", "dark"], THEME_MODE[theme] ?? "system"),
    hero: pick(s.hero, HEROES, DEFAULT_SETTINGS.hero),
    accent_color: typeof s.accent_color === "string" && /^#[0-9a-f]{6}$/i.test(s.accent_color) ? s.accent_color.toLowerCase() : "",
    radius: pick(s.radius, RADII.map((r) => r.id), DEFAULT_SETTINGS.radius),
    surface: pick(s.surface, SURFACES.map((x) => x.id), DEFAULT_SETTINGS.surface),
    nav: pick(s.nav, NAV_STYLES.map((n) => n.id), DEFAULT_SETTINGS.nav),
    projects_layout: pick(s.projects_layout, ["showcase", "grid", "list"], DEFAULT_SETTINGS.projects_layout),
    profession: pick(s.profession, PROFESSIONS.map((p) => p.id), DEFAULT_SETTINGS.profession),
    sections,
    pages,
  };
};
