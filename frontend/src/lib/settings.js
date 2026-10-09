// Portfolio.settings defaults and options.
// Keep in sync with backend/portfolio/site_settings.py.

export const THEMES = [
  { id: "warm", name: "Warm", swatch: ["#f7f1e8", "#3b2a20", "#a84b2a"] },
  { id: "minimal", name: "Minimal", swatch: ["#ffffff", "#111113", "#2350d8"] },
  { id: "midnight", name: "Midnight", swatch: ["#0b1020", "#e6e9f2", "#c6f432"] },
  { id: "mono", name: "Mono", swatch: ["#ffffff", "#0a0a0a", "#ff4f00"] },
];

export const ACCENTS = [
  { id: "lime", name: "Lime", color: "#c6f432" },
  { id: "violet", name: "Violet", color: "#a78bfa" },
];

export const FONTS = [
  { id: "editorial", name: "Editorial", sample: "Instrument Serif + Geist", family: '"Instrument Serif", serif' },
  { id: "modern", name: "Modern", sample: "Space Grotesk + Inter", family: '"Space Grotesk Variable", sans-serif' },
  { id: "classic", name: "Classic", sample: "Fraunces + DM Sans", family: '"Fraunces Variable", serif' },
];

// Background texture when the owner leaves it on "default"
export const THEME_TEXTURE = { minimal: "none", warm: "noise", midnight: "grid", mono: "grid" };
// Midnight is a dark theme first: visitors without a preference see it dark
export const THEME_MODE = { midnight: "dark" };

export const HOME_SECTIONS = [
  { id: "about", name: "About" },
  { id: "projects", name: "Featured projects" },
  { id: "experience", name: "Experience" },
  { id: "skills", name: "Skills" },
  { id: "testimonials", name: "Testimonials" },
  { id: "contact", name: "Contact" },
];

export const PAGES = ["about", "experience", "projects", "skills", "resume", "contact"];

export const DEFAULT_SETTINGS = {
  theme: "warm",
  accent: "lime",
  font: "editorial",
  texture: "default",
  mode: "system",
  hero: "bento",
  projects_layout: "showcase",
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
    ...known.filter((id) => !stored.some((x) => x.id === id)).map((id) => ({ id, visible: true })),
  ];

  const pages = Object.fromEntries(PAGES.map((p) => [p, s.pages?.[p] !== false]));

  return {
    theme,
    accent: pick(s.accent, ACCENTS.map((a) => a.id), DEFAULT_SETTINGS.accent),
    font: pick(s.font, FONTS.map((f) => f.id), DEFAULT_SETTINGS.font),
    texture: pick(s.texture, ["default", "none", "grid", "noise"], "default"),
    mode: pick(s.mode, ["system", "light", "dark"], THEME_MODE[theme] ?? "system"),
    hero: pick(s.hero, ["bento", "classic", "minimal"], DEFAULT_SETTINGS.hero),
    projects_layout: pick(s.projects_layout, ["showcase", "grid", "list"], DEFAULT_SETTINGS.projects_layout),
    sections,
    pages,
  };
};
