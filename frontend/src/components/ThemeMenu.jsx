import { Popover } from "@base-ui/react/popover";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { setMode, setPreview, useAppearance } from "@/hooks/useAppearance";
import { ACCENTS, FONTS, THEMES } from "@/lib/settings";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const Group = ({ label, children }) => (
  <fieldset className="space-y-2">
    <legend className="eyebrow mb-2 text-muted-foreground">{label}</legend>
    {children}
  </fieldset>
);

// A radio styled as a tile; the native input keeps arrow-key navigation
const Choice = ({ name, checked, onChange, className, children, label, showCheck = true }) => (
  <label
    className={cn(
      "relative flex cursor-pointer items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
      checked ? "border-primary-ink" : "hover:border-input",
      className
    )}
  >
    <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" aria-label={label} />
    {children}
    {checked && showCheck && <Check className="ml-auto size-3.5 shrink-0 text-primary-ink" />}
  </label>
);

/** Light / dark / system for everyone; theme, accent and fonts in preview mode. */
export const ThemeMenu = () => {
  const { mode, isDark, settings, ownerSettings, preview, canCustomize } = useAppearance();
  const ModeIcon = isDark ? Moon : Sun;
  const previewing = Object.keys(preview).length > 0;

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label="Appearance"
        className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground data-[popup-open]:bg-secondary data-[popup-open]:text-foreground"
      >
        {canCustomize ? <Palette className="size-4" /> : <ModeIcon className="size-4" />}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={10} className="z-[60]">
          <Popover.Popup className="w-[min(20rem,calc(100vw-2rem))] origin-[var(--transform-origin)] space-y-5 rounded-2xl border bg-popover p-4 text-popover-foreground shadow-[0_24px_60px_-20px_color-mix(in_oklab,var(--foreground)_35%,transparent)] transition-[transform,opacity] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <Popover.Title className="sr-only">Appearance</Popover.Title>
            <Group label="Mode">
              <div className="grid grid-cols-3 gap-1.5">
                {MODES.map((m) => (
                  <Choice
                    key={m.id}
                    name="mode"
                    label={m.label}
                    checked={mode === m.id}
                    onChange={() => setMode(m.id)}
                    showCheck={false}
                    className={cn("flex-col justify-center gap-1 py-2.5 text-xs", mode === m.id && "bg-accent text-accent-foreground")}
                  >
                    <m.icon className="size-4" />
                    {m.label}
                  </Choice>
                ))}
              </div>
            </Group>

            {canCustomize && (
              <>
                <Group label="Theme">
                  <div className="grid grid-cols-2 gap-1.5">
                    {THEMES.map((t) => (
                      <Choice
                        key={t.id}
                        name="theme"
                        label={t.name}
                        checked={settings.theme === t.id}
                        onChange={() => setPreview({ theme: t.id })}
                      >
                        <span className="flex -space-x-1" aria-hidden>
                          {t.swatch.map((c) => (
                            <span key={c} className="size-3.5 rounded-full border border-black/10" style={{ background: c }} />
                          ))}
                        </span>
                        {t.name}
                      </Choice>
                    ))}
                  </div>
                </Group>

                {settings.theme === "midnight" && (
                  <Group label="Accent">
                    <div className="grid grid-cols-2 gap-1.5">
                      {ACCENTS.map((a) => (
                        <Choice
                          key={a.id}
                          name="accent"
                          label={a.name}
                          checked={settings.accent === a.id}
                          onChange={() => setPreview({ accent: a.id })}
                        >
                          <span className="size-3.5 rounded-full" style={{ background: a.color }} aria-hidden />
                          {a.name}
                        </Choice>
                      ))}
                    </div>
                  </Group>
                )}

                <Group label="Fonts">
                  <div className="space-y-1.5">
                    {FONTS.map((f) => (
                      <Choice
                        key={f.id}
                        name="font"
                        label={`${f.name}: ${f.sample}`}
                        checked={settings.font === f.id}
                        onChange={() => setPreview({ font: f.id })}
                      >
                        <span className="w-8 text-xl leading-none" style={{ fontFamily: f.family }} aria-hidden>
                          Aa
                        </span>
                        <span className="min-w-0">
                          <span className="block">{f.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{f.sample}</span>
                        </span>
                      </Choice>
                    ))}
                  </div>
                </Group>

                <p className="text-xs leading-5 text-muted-foreground">
                  Preview only, for this tab. The saved look is{" "}
                  <span className="text-foreground">
                    {THEMES.find((t) => t.id === ownerSettings.theme)?.name} ·{" "}
                    {FONTS.find((f) => f.id === ownerSettings.font)?.name}
                  </span>
                  .
                  {previewing && (
                    <button type="button" onClick={() => setPreview(null)} className="ml-1 text-primary-ink link-underline">
                      Reset
                    </button>
                  )}
                </p>
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};
