import { AlignLeft, Columns2, LayoutGrid, Moon, Sun } from "lucide-react";
import { Input, Label, Select } from "@/components/ui/form";
import { Switch } from "@/dashboard/components/Choices";
import { cn } from "@/lib/utils";

const layouts = [
  { id: "editorial", label: "Editorial", icon: Columns2 },
  { id: "cards", label: "Cards", icon: LayoutGrid },
  { id: "compact", label: "Compact", icon: AlignLeft },
];

const presets = [
  { name: "Editorial", layout: "editorial", mode: "light", font: "editorial", accent: "#0f766e", spacing: "comfortable" },
  { name: "After hours", layout: "cards", mode: "dark", font: "modern", accent: "#818cf8", spacing: "comfortable" },
  { name: "Minimal", layout: "compact", mode: "light", font: "mono", accent: "#9a3412", spacing: "compact" },
];

export const WebsiteStudioDesign = ({ options, setOption, applyPreset }) => (
  <>
    <fieldset className="grid min-w-0 gap-2">
      <legend className="mb-2 text-sm font-medium">Starting styles</legend>
      <div className="grid grid-cols-3 gap-2">
        {presets.map(({ name, ...preset }) => (
          <button
            key={name}
            type="button"
            aria-pressed={Object.keys(preset).every((key) => preset[key] === options[key])}
            onClick={() => applyPreset(preset)}
            className="grid gap-2 rounded-xl border bg-background p-2 text-left text-xs leading-snug transition hover:border-foreground/50 aria-pressed:border-primary-ink aria-pressed:ring-1 aria-pressed:ring-primary-ink"
          >
            <span className={cn("grid h-12 content-center gap-1.5 rounded-md px-2", preset.mode === "dark" ? "bg-slate-950" : "bg-stone-100")} aria-hidden>
              <span className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: preset.accent }} />
              <span className="h-1 w-1/2 rounded-full bg-slate-400/70" />
              <span className="h-1 w-full rounded-full bg-slate-400/40" />
            </span>
            <span>{name}</span>
          </button>
        ))}
      </div>
    </fieldset>
    <fieldset className="grid min-w-0 gap-2">
      <legend className="mb-2 text-sm font-medium">Layout</legend>
      <div className="grid grid-cols-3 gap-2">
        {layouts.map((layout) => (
          <button key={layout.id} type="button" aria-pressed={options.layout === layout.id} onClick={() => setOption("layout", layout.id)} className="grid min-h-16 place-items-center content-center gap-1.5 rounded-lg border bg-background px-1 py-2 text-xs hover:bg-muted aria-pressed:border-primary-ink aria-pressed:bg-accent">
            <layout.icon className="size-4" aria-hidden />
            {layout.label}
          </button>
        ))}
      </div>
    </fieldset>
    <div className="grid grid-cols-2 gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="studio-font">Heading font</Label>
        <Select id="studio-font" value={options.font} onChange={(event) => setOption("font", event.target.value)}>
          <option value="editorial">Serif</option><option value="modern">Sans serif</option><option value="mono">Monospace</option>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="studio-spacing">Spacing</Label>
        <Select id="studio-spacing" value={options.spacing} onChange={(event) => setOption("spacing", event.target.value)}>
          <option value="comfortable">Comfortable</option><option value="compact">Compact</option><option value="airy">Airy</option>
        </Select>
      </div>
    </div>
    <fieldset className="grid min-w-0 gap-2">
      <legend className="mb-2 text-sm font-medium">Colour mode</legend>
      <div className="grid grid-cols-2 gap-2">
        {[{ id: "light", label: "Light", icon: Sun }, { id: "dark", label: "Dark", icon: Moon }].map((mode) => (
          <button key={mode.id} type="button" aria-pressed={options.mode === mode.id} onClick={() => setOption("mode", mode.id)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-background text-sm hover:bg-muted aria-pressed:border-primary-ink aria-pressed:bg-accent">
            <mode.icon className="size-4" aria-hidden />{mode.label}
          </button>
        ))}
      </div>
    </fieldset>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-3">
      <Label htmlFor="studio-accent">Accent colour</Label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">{options.accent}</span>
        <Input id="studio-accent" type="color" value={options.accent} onChange={(event) => setOption("accent", event.target.value)} className="h-9 w-11 cursor-pointer p-0.5" />
      </div>
    </div>
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3">
      <span className="text-sm font-medium">Section navigation</span>
      <Switch checked={options.show_navigation} onChange={(show) => setOption("show_navigation", show)} label="Show section navigation" />
    </div>
  </>
);
