import { ArrowDown, ArrowUp, Check, ExternalLink, Eye, EyeOff, Laptop, Loader2, Moon, RotateCcw, Shuffle, Smartphone, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/api/axios";
import { useAuth } from "@/auth/context";
import { Button } from "@/components/ui/button";
import { Choices, Switch } from "@/dashboard/components/Choices";
import { ListSkeleton, LoadError, PageHeader, Panel } from "@/dashboard/components/Page";
import { parseApiError } from "@/dashboard/lib/records";
import { useResource } from "@/dashboard/lib/useResource";
import { toast } from "@/hooks/use-toast";
import { PREVIEW_MESSAGE } from "@/hooks/useAppearance";
import { clearPortfolioCache } from "@/hooks/usePortfolioData";
import { PROFESSIONS, labelsOf, professionPreset } from "@/lib/professions";
import {
  ACCENTS,
  ACCENT_COLORS,
  DEFAULT_SETTINGS,
  FONTS,
  HOME_SECTIONS,
  NAV_STYLES,
  PAGES,
  RADII,
  SURFACES,
  THEMES,
  resolveSettings,
} from "@/lib/settings";
import { STYLE_PRESETS, presetOf, presetSwatch, surpriseLook } from "@/lib/stylePresets";
import { cn } from "@/lib/utils";

const TEXTURES = [
  { id: "default", name: "Theme default" },
  { id: "none", name: "None" },
  { id: "grid", name: "Grid" },
  { id: "noise", name: "Paper grain" },
];

const MODES = [
  { id: "system", name: "Visitor's device", icon: Laptop },
  { id: "light", name: "Light", icon: Sun },
  { id: "dark", name: "Dark", icon: Moon },
];

// Tiny wireframes so each layout is recognisable at a glance
const Bar = ({ className }) => <span className={cn("block rounded-sm bg-current", className)} />;
const HEROES = [
  {
    id: "bento",
    name: "Bento",
    hint: "Intro plus tiles: role, location, featured project, numbers",
    sketch: (
      <span className="grid h-full grid-cols-3 grid-rows-2 gap-1">
        <Bar className="col-span-2 row-span-2 opacity-60" />
        <Bar className="opacity-30" />
        <Bar className="opacity-30" />
      </span>
    ),
  },
  {
    id: "classic",
    name: "Classic",
    hint: "Text on the left, portrait on the right",
    sketch: (
      <span className="grid h-full grid-cols-[1.4fr_1fr] items-center gap-2">
        <span className="space-y-1">
          <Bar className="h-2 w-4/5 opacity-60" />
          <Bar className="h-1 w-full opacity-30" />
          <Bar className="h-1 w-3/4 opacity-30" />
        </span>
        <Bar className="h-full opacity-40" />
      </span>
    ),
  },
  {
    id: "minimal",
    name: "Minimal",
    hint: "One centred statement",
    sketch: (
      <span className="flex h-full flex-col items-center justify-center gap-1">
        <Bar className="h-2 w-3/5 opacity-60" />
        <Bar className="h-1 w-4/5 opacity-30" />
        <Bar className="h-1 w-2/5 opacity-30" />
      </span>
    ),
  },
];

HEROES.push(
  {
    id: "split",
    name: "Split",
    hint: "Text beside a tall portrait and featured work",
    sketch: (
      <span className="grid h-full grid-cols-2 gap-1.5">
        <span className="flex flex-col justify-center gap-1">
          <Bar className="h-2 w-4/5 opacity-60" />
          <Bar className="h-1 w-full opacity-30" />
        </span>
        <Bar className="h-full opacity-40" />
      </span>
    ),
  },
  {
    id: "statement",
    name: "Statement",
    hint: "Huge name and a ribbon of skills",
    sketch: (
      <span className="flex h-full flex-col justify-center gap-1">
        <Bar className="h-3.5 w-full opacity-60" />
        <Bar className="h-1 w-1/2 opacity-30" />
        <span className="mt-0.5 flex gap-1 opacity-30">
          <Bar className="h-1 flex-1" />
          <Bar className="h-1 flex-1" />
          <Bar className="h-1 flex-1" />
        </span>
      </span>
    ),
  }
);

// Card styles, drawn small
const SURFACE_SKETCH = {
  outline: "border bg-card",
  elevated: "bg-card shadow-md",
  filled: "bg-secondary",
};

/** A preset drawn in its own colours and font: page, a card, the accent, "Aa". */
const PresetThumb = ({ preset }) => {
  const c = presetSwatch(preset.look);
  const family = FONTS.find((f) => f.id === preset.look.font)?.family;
  const radius = { sharp: "2px", round: "10px" }[preset.look.radius] ?? "6px";
  return (
    <span className="block overflow-hidden rounded-lg border" style={{ background: c.page, color: c.text }} aria-hidden>
      <span className="flex items-center justify-between px-2.5 pt-2">
        <span className="text-xl leading-none" style={{ fontFamily: family }}>
          Aa
        </span>
        <span className="h-2 w-7 rounded-full" style={{ background: c.accent }} />
      </span>
      <span className="m-2 flex h-7 items-center gap-1.5 px-2" style={{ background: c.card, borderRadius: radius, boxShadow: `0 0 0 1px ${c.text}14` }}>
        <span className="h-1 w-1/2 rounded-full opacity-50" style={{ background: c.text }} />
        <span className="ml-auto size-2.5 rounded-full" style={{ background: c.accent }} />
      </span>
    </span>
  );
};

/** Any theme can take an accent colour; empty = the theme's own. */
const AccentColors = ({ value, theme, onChange }) => {
  const own = THEMES.find((t) => t.id === theme)?.swatch[2];
  const custom = value && !ACCENT_COLORS.some((a) => a.color === value);
  const swatch = (selected) => cn("relative size-9 rounded-full border-2 transition", selected ? "border-foreground" : "border-transparent");
  return (
    <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Accent colour">
      <button type="button" role="radio" aria-checked={!value} aria-label="The theme's own accent" title="Theme's own" onClick={() => onChange("")} className={swatch(!value)} style={{ background: own }}>
        {!value && <Check className="absolute inset-0 m-auto size-4 text-background mix-blend-difference" />}
      </button>
      <span className="mx-1 h-6 w-px bg-border" aria-hidden />
      {ACCENT_COLORS.map((a) => (
        <button key={a.color} type="button" role="radio" aria-checked={value === a.color} aria-label={a.name} title={a.name} onClick={() => onChange(a.color)} className={swatch(value === a.color)} style={{ background: a.color }} />
      ))}
      <label className={cn("relative flex h-9 cursor-pointer items-center gap-2 rounded-full border bg-background pr-3 pl-1 text-sm has-focus-visible:outline-2 has-focus-visible:outline-primary-ink", custom && "border-foreground")}>
        <span className="size-7 rounded-full border" style={{ background: value || own }} aria-hidden />
        Custom
        <input type="color" value={value || own} onChange={(e) => onChange(e.target.value.toLowerCase())} className="sr-only" />
      </label>
    </div>
  );
};

const LAYOUTS = [
  {
    id: "showcase",
    name: "Showcase",
    hint: "Large alternating image and story",
    sketch: (
      <span className="flex h-full flex-col justify-center gap-1.5">
        <span className="grid grid-cols-[1.3fr_1fr] gap-1.5">
          <Bar className="h-4 opacity-50" />
          <Bar className="h-1.5 self-center opacity-30" />
        </span>
        <span className="grid grid-cols-[1fr_1.3fr] gap-1.5">
          <Bar className="h-1.5 self-center opacity-30" />
          <Bar className="h-4 opacity-50" />
        </span>
      </span>
    ),
  },
  {
    id: "grid",
    name: "Grid",
    hint: "Cards in columns",
    sketch: (
      <span className="grid h-full grid-cols-3 items-center gap-1">
        <Bar className="h-7 opacity-40" />
        <Bar className="h-7 opacity-40" />
        <Bar className="h-7 opacity-40" />
      </span>
    ),
  },
  {
    id: "list",
    name: "List",
    hint: "Compact rows, text only",
    sketch: (
      <span className="flex h-full flex-col justify-center gap-1.5">
        <Bar className="h-1.5 opacity-40" />
        <Bar className="h-1.5 opacity-40" />
        <Bar className="h-1.5 opacity-40" />
      </span>
    ),
  },
];

const PAGE_LABELS = {
  projects: "Projects",
  experience: "Experience",
  skills: "Skills",
  achievements: "Awards & publications",
  about: "About",
  resume: "Résumé",
  contact: "Contact",
};

const Sketch = ({ option }) => (
  <>
    <span className="block h-12 rounded-lg border bg-card p-2 text-foreground">{option.sketch}</span>
    <span>
      <span className="block font-medium">{option.name}</span>
      <span className="block text-xs leading-5 text-muted-foreground">{option.hint}</span>
    </span>
  </>
);

/** The real site in an iframe, fed the unsaved draft over postMessage. */
const Preview = ({ username, draft, dark, device }) => {
  const frame = useRef(null);
  const box = useRef(null);
  const [scale, setScale] = useState(1);
  const width = device === "phone" ? 390 : 1280;

  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, settings: draft, dark }, window.location.origin);
  }, [draft, dark]);
  useEffect(send, [send]);

  // Fit the desktop preview into the panel
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  const height = device === "phone" ? 760 : 800;
  return (
    <div ref={box} className="w-full">
      <div className="mx-auto overflow-hidden rounded-2xl border bg-card shadow-sm" style={{ width: width * scale, height: height * scale }}>
        <iframe
          ref={frame}
          title="Live preview of your portfolio"
          src={`/u/${encodeURIComponent(username)}`}
          onLoad={send}
          style={{ width, height, transform: `scale(${scale})`, transformOrigin: "0 0" }}
          className="block border-0"
        />
      </div>
    </div>
  );
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export const AppearancePage = () => {
  const { user } = useAuth();
  const profile = useResource("/me/profile/");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("edit"); // phones: edit | preview
  const [device, setDevice] = useState("phone");
  const [previewDark, setPreviewDark] = useState(false);

  const saved = profile.data ? resolveSettings(profile.data.settings) : null;
  const current = draft ?? saved;
  const dirty = Boolean(draft && saved && !same(draft, saved));

  const set = (patch) => setDraft({ ...current, ...patch });
  const moveSection = (index, step) => {
    const sections = [...current.sections];
    const [item] = sections.splice(index, 1);
    sections.splice(index + step, 0, item);
    set({ sections });
  };
  const toggleSection = (id) => set({ sections: current.sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)) });

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch("/me/profile/", { settings: current });
      profile.mutate(data);
      clearPortfolioCache();
      setDraft(null);
      toast({ title: "Look saved", description: "Your portfolio uses it now." });
    } catch (error) {
      toast({ variant: "destructive", title: "Couldn't save", description: parseApiError(error).message || "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  // Warn before leaving the page with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  if (profile.loading) return <ListSkeleton rows={5} />;
  if (profile.error) return <LoadError onRetry={profile.reload} />;

  const labels = labelsOf(current.profession);
  const sectionName = {
    ...Object.fromEntries(HOME_SECTIONS.map((s) => [s.id, s.name])),
    projects: `Featured ${labels.projectsPage.toLowerCase()}`,
    achievements: labels.achievements,
  };

  return (
    <>
      <PageHeader
        title="Appearance"
        description="Choose how your portfolio looks and what it shows. The preview updates as you go; nothing changes for visitors until you save."
        action={
          <Button href={`/u/${user.username}`} variant="outline" size="lg" className="self-start px-3.5">
            <ExternalLink /> Open site
          </Button>
        }
      />

      {/* phones: switch between the settings and the preview */}
      <div className="sticky top-14 z-30 -mx-4 mb-4 flex gap-1 border-b bg-background/90 px-4 py-2 backdrop-blur lg:hidden" role="tablist">
        {[
          ["edit", "Settings"],
          ["preview", "Preview"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn("h-9 flex-1 rounded-full text-sm font-medium transition", tab === id ? "bg-foreground text-background" : "text-muted-foreground")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className={cn("flex flex-col gap-5 pb-24", tab === "preview" && "hidden lg:flex")}>
          <Panel
            title="Start from a style"
            description="Ready-made looks: colours, fonts, layout and shape in one click. Fine-tune anything below."
            action={
              <Button type="button" variant="outline" size="sm" onClick={() => set(surpriseLook(current))}>
                <Shuffle /> Surprise me
              </Button>
            }
          >
            <Choices
              name="style"
              value={presetOf(current)}
              onChange={(id) => set(STYLE_PRESETS.find((p) => p.id === id).look)}
              options={STYLE_PRESETS}
              columns="grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4"
              render={(p) => (
                <>
                  <PresetThumb preset={p} />
                  <span className="pr-5">
                    <span className="block font-medium">{p.name}</span>
                    <span className="block text-xs leading-4 text-muted-foreground">{p.hint}</span>
                  </span>
                </>
              )}
            />
          </Panel>

          <Panel title="Profession" description="Names your sections the way your field does, and sets up the home page to match. You can change everything below afterwards.">
            <Choices
              name="profession"
              value={current.profession}
              onChange={(profession) => set(professionPreset(profession))}
              options={PROFESSIONS}
              columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
              render={(p) => (
                <span className="flex items-start gap-3 pr-6">
                  <p.icon className="mt-0.5 size-4 shrink-0 text-primary-ink" aria-hidden />
                  <span className="min-w-0">
                    <span className="block font-medium">{p.name}</span>
                    <span className="block text-xs leading-5 text-muted-foreground">{p.hint}</span>
                  </span>
                </span>
              )}
            />
          </Panel>

          <Panel title="Theme" description="Colours for light and dark mode.">
            <Choices
              name="theme"
              value={current.theme}
              onChange={(theme) => set({ theme })}
              options={THEMES}
              render={(t) => (
                <>
                  <span className="flex h-10 overflow-hidden rounded-lg border" aria-hidden>
                    {t.swatch.map((c) => (
                      <span key={c} className="flex-1" style={{ background: c }} />
                    ))}
                  </span>
                  <span className="font-medium">{t.name}</span>
                </>
              )}
            />
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">Accent colour</p>
              <AccentColors value={current.accent_color} theme={current.theme} onChange={(accent_color) => set({ accent_color })} />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Any colour works: text in the accent is darkened or lightened automatically so it stays readable in light and dark mode.
              </p>
            </div>
            {current.theme === "midnight" && !current.accent_color && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">Midnight's own accent</p>
                <Choices
                  name="accent"
                  value={current.accent}
                  onChange={(accent) => set({ accent })}
                  options={ACCENTS}
                  render={(a) => (
                    <span className="flex items-center gap-2">
                      <span className="size-5 rounded-full border" style={{ background: a.color }} aria-hidden />
                      <span className="font-medium">{a.name}</span>
                    </span>
                  )}
                />
              </div>
            )}
          </Panel>

          <Panel title="Fonts" description="A heading face paired with a body face.">
            <Choices
              name="font"
              value={current.font}
              onChange={(font) => set({ font })}
              options={FONTS}
              columns="grid-cols-1"
              render={(f) => (
                <span className="flex items-center gap-3 pr-6">
                  <span className="w-12 text-3xl leading-none" style={{ fontFamily: f.family }} aria-hidden>
                    Aa
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{f.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{f.sample}</span>
                  </span>
                </span>
              )}
            />
          </Panel>

          <Panel title="Home page layout">
            <p className="mb-2 text-sm font-medium">Top of the page</p>
            <Choices name="hero" value={current.hero} onChange={(hero) => set({ hero })} options={HEROES} columns="grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3" render={(o) => <Sketch option={o} />} />
            <p className="mt-5 mb-2 text-sm font-medium">Projects</p>
            <Choices
              name="projects_layout"
              value={current.projects_layout}
              onChange={(projects_layout) => set({ projects_layout })}
              options={LAYOUTS}
              columns="grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3"
              render={(o) => <Sketch option={o} />}
            />
          </Panel>

          <Panel title="Shape & style" description="Corners, cards and the navigation bar.">
            <p className="mb-2 text-sm font-medium">Corners</p>
            <Choices
              name="radius"
              value={current.radius}
              onChange={(radius) => set({ radius })}
              options={RADII}
              columns="grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4"
              render={(o) => (
                <span className="flex items-center gap-2 pr-5">
                  <span
                    className="size-6 border-2 border-foreground/60 bg-accent"
                    style={{ borderRadius: { sharp: "3px", soft: "8px", round: "14px" }[o.id] ?? "8px" }}
                    aria-hidden
                  />
                  <span className="font-medium">{o.name}</span>
                </span>
              )}
            />
            <p className="mt-5 mb-2 text-sm font-medium">Cards</p>
            <Choices
              name="surface"
              value={current.surface}
              onChange={(surface) => set({ surface })}
              options={SURFACES}
              columns="grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3"
              render={(o) => (
                <>
                  <span className="flex h-12 items-center justify-center rounded-lg bg-background p-2" aria-hidden>
                    <span className={cn("h-full w-4/5 rounded-md", SURFACE_SKETCH[o.id])} />
                  </span>
                  <span>
                    <span className="block font-medium">{o.name}</span>
                    <span className="block text-xs leading-5 text-muted-foreground">{o.hint}</span>
                  </span>
                </>
              )}
            />
            <p className="mt-5 mb-2 text-sm font-medium">Navigation</p>
            <Choices
              name="nav"
              value={current.nav}
              onChange={(nav) => set({ nav })}
              options={NAV_STYLES}
              columns="grid-cols-1 sm:grid-cols-2"
              render={(o) => (
                <>
                  <span className="flex h-12 flex-col rounded-lg border bg-card p-1.5" aria-hidden>
                    <span className={cn("flex h-3 items-center gap-1 px-1.5", o.id === "floating" ? "mx-3 mt-0.5 rounded-full border" : "border-b")}>
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span className="h-0.5 w-6 rounded-full bg-current opacity-30" />
                    </span>
                  </span>
                  <span>
                    <span className="block font-medium">{o.name}</span>
                    <span className="block text-xs leading-5 text-muted-foreground">{o.hint}</span>
                  </span>
                </>
              )}
            />
          </Panel>

          <Panel title="Home page sections" description="Reorder them, or hide the ones you don't need. Empty sections hide on their own.">
            <ol className="divide-y overflow-hidden rounded-xl border">
              {current.sections.map((s, i) => (
                <li key={s.id} className={cn("flex min-h-14 items-center gap-2 bg-background px-3 py-2", !s.visible && "bg-muted/50")}>
                  <span className="w-5 font-mono text-xs text-muted-foreground">{i + 1}</span>
                  <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", !s.visible && "text-muted-foreground line-through")}>{sectionName[s.id]}</span>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Move ${sectionName[s.id]} up`} disabled={i === 0} onClick={() => moveSection(i, -1)}>
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${sectionName[s.id]} down`}
                    disabled={i === current.sections.length - 1}
                    onClick={() => moveSection(i, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-pressed={!s.visible}
                    aria-label={s.visible ? `Hide ${sectionName[s.id]}` : `Show ${sectionName[s.id]}`}
                    onClick={() => toggleSection(s.id)}
                  >
                    {s.visible ? <Eye /> : <EyeOff />}
                  </Button>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Pages" description="Switch a page off to remove it from the menu.">
            <ul className="divide-y overflow-hidden rounded-xl border">
              {PAGES.map((p) => (
                <li key={p} className="flex min-h-14 items-center justify-between gap-3 bg-background px-4">
                  <span className="text-sm font-medium">{PAGE_LABELS[p]}</span>
                  <Switch checked={current.pages[p]} label={`Show the ${PAGE_LABELS[p]} page`} onChange={(on) => set({ pages: { ...current.pages, [p]: on } })} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Details">
            <p className="mb-2 text-sm font-medium">Background</p>
            <Choices
              name="texture"
              value={current.texture}
              onChange={(texture) => set({ texture })}
              options={TEXTURES}
              render={(o) => <span className="pr-6 font-medium">{o.name}</span>}
            />
            <p className="mt-5 mb-2 text-sm font-medium">First visit shows</p>
            <Choices
              name="mode"
              value={current.mode}
              onChange={(mode) => set({ mode })}
              options={MODES}
              columns="grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3"
              render={(o) => (
                <span className="flex items-center gap-2 pr-6 font-medium">
                  <o.icon className="size-4 shrink-0" aria-hidden />
                  {o.name}
                </span>
              )}
            />
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Visitors can always switch light/dark themselves.</p>
            <Button
              type="button"
              variant="ghost"
              className="mt-4 -ml-2 px-2 text-muted-foreground"
              onClick={() => setDraft(resolveSettings({ ...DEFAULT_SETTINGS, ...professionPreset(current.profession) }))}
            >
              <RotateCcw /> Restore the default look
            </Button>
          </Panel>
        </div>

        <div className={cn("lg:sticky lg:top-6", tab === "edit" && "hidden lg:block")}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex rounded-full border bg-card p-1" role="group" aria-label="Preview size">
              {[
                ["phone", Smartphone, "Phone"],
                ["desktop", Laptop, "Desktop"],
              ].map(([id, icon, label]) => {
                const Icon = icon;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={device === id}
                    onClick={() => setDevice(id)}
                    className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition", device === id ? "bg-secondary text-foreground" : "text-muted-foreground")}
                  >
                    <Icon className="size-3.5" /> {label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-pressed={previewDark}
              onClick={() => setPreviewDark((v) => !v)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              {previewDark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
              {previewDark ? "Dark" : "Light"}
            </button>
          </div>
          <Preview username={user.username} draft={current} dark={previewDark} device={device} />
        </div>
      </div>

      {/* Save bar: always reachable, says when there's something to save */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="min-w-0 truncate text-sm text-muted-foreground" aria-live="polite">
            {dirty ? "You have unsaved changes" : "All changes saved"}
          </p>
          <div className="flex shrink-0 gap-2">
            {dirty && (
              <Button type="button" variant="outline" size="lg" className="px-4" disabled={saving} onClick={() => setDraft(null)}>
                Discard
              </Button>
            )}
            <Button type="button" size="lg" className="min-w-24 px-4" disabled={!dirty || saving} onClick={save}>
              {saving && <Loader2 className="animate-spin" />}
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
