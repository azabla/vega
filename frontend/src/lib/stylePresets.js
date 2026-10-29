// Ready-made looks for the Appearance page: one click sets theme, accent, fonts, hero, layout,
// corners, cards and navigation together. Owners can change anything afterwards.
import { readableOn } from "@/lib/colors";
import { ACCENT_COLORS, THEMES } from "@/lib/settings";

const LOOK_KEYS = ["theme", "accent", "accent_color", "font", "texture", "mode", "hero", "projects_layout", "radius", "surface", "nav"];

export const STYLE_PRESETS = [
  {
    id: "editorial",
    name: "Editorial",
    hint: "Warm paper, serif headings",
    look: { theme: "warm", accent_color: "", font: "editorial", texture: "default", mode: "system", hero: "bento", projects_layout: "showcase", radius: "default", surface: "outline", nav: "bar" },
  },
  {
    id: "studio",
    name: "Studio",
    hint: "Crisp white, oversized type",
    look: { theme: "minimal", accent_color: "", font: "modern", texture: "none", mode: "system", hero: "statement", projects_layout: "grid", radius: "sharp", surface: "outline", nav: "floating" },
  },
  {
    id: "night-shift",
    name: "Night shift",
    hint: "Dark navy, electric lime",
    look: { theme: "midnight", accent: "lime", accent_color: "", font: "modern", texture: "grid", mode: "dark", hero: "split", projects_layout: "showcase", radius: "soft", surface: "elevated", nav: "floating" },
  },
  {
    id: "gallery",
    name: "Gallery",
    hint: "Bold type, work in a grid",
    look: { theme: "mono", accent_color: "", font: "bold", texture: "none", mode: "light", hero: "statement", projects_layout: "grid", radius: "sharp", surface: "filled", nav: "bar" },
  },
  {
    id: "botanical",
    name: "Botanical",
    hint: "Sage greens, soft and round",
    look: { theme: "sage", accent_color: "", font: "classic", texture: "default", mode: "system", hero: "classic", projects_layout: "showcase", radius: "round", surface: "filled", nav: "floating" },
  },
  {
    id: "blush",
    name: "Blush",
    hint: "Rose tones, elegant serif",
    look: { theme: "rose", accent_color: "", font: "elegant", texture: "none", mode: "system", hero: "minimal", projects_layout: "grid", radius: "round", surface: "elevated", nav: "floating" },
  },
  {
    id: "scholar",
    name: "Scholar",
    hint: "Quiet navy, research first",
    look: { theme: "minimal", accent_color: "#1f3a5f", font: "classic", texture: "none", mode: "light", hero: "classic", projects_layout: "list", radius: "soft", surface: "outline", nav: "bar" },
  },
  {
    id: "neon",
    name: "Neon",
    hint: "After-dark violet",
    look: { theme: "midnight", accent: "violet", accent_color: "", font: "bold", texture: "noise", mode: "dark", hero: "split", projects_layout: "grid", radius: "round", surface: "elevated", nav: "floating" },
  },
];

/** The preset these settings match exactly, if any (for the checkmark). */
export const presetOf = (settings) =>
  STYLE_PRESETS.find((p) => Object.entries(p.look).every(([k, v]) => settings[k] === v || (k === "accent" && settings.theme !== "midnight")))?.id ?? null;

/** Colours to draw a preset's thumbnail with: page, card, text, accent. */
export const presetSwatch = (look) => {
  const theme = THEMES.find((t) => t.id === look.theme) ?? THEMES[0];
  const dark = look.mode === "dark";
  const [page, card] = dark ? theme.paper.dark : theme.paper.light;
  const accent = look.accent_color || (look.theme === "midnight" && look.accent === "violet" ? "#a78bfa" : theme.swatch[2]);
  return { page, card, text: readableOn(page), accent };
};

const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

/** A random preset with a random accent: the "Surprise me" button. */
export const surpriseLook = (current) => {
  const preset = pickOne(STYLE_PRESETS.filter((p) => p.id !== presetOf(current)));
  const accent = Math.random() < 0.6 ? pickOne(ACCENT_COLORS).color : "";
  return { ...preset.look, accent_color: accent };
};

/** Only the look keys of a settings object (keeps sections, pages, profession). */
export const lookOf = (settings) => Object.fromEntries(LOOK_KEYS.map((k) => [k, settings[k]]));
