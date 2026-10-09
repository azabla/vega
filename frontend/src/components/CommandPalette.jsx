import { Dialog } from "@base-ui/react/dialog";
import {
  ArrowRight,
  Briefcase,
  CornerDownLeft,
  FileText,
  FolderGit2,
  Home,
  Mail,
  Moon,
  Palette,
  Search,
  Sparkles,
  Sun,
  User,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { setMode, setPreview, useAppearance } from "@/hooks/useAppearance";
import { useNavItems } from "@/hooks/useNavItems";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { useProfile } from "@/hooks/useProfile";
import { copyText } from "@/lib/clipboard";
import { onOpenCommandPalette } from "@/lib/commandPalette";
import { resumeFileOf, socialLinksOf } from "@/lib/profile";
import { THEMES } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { portfolioAPI } from "@/services/portfolioAPI";

const PAGE_ICONS = { projects: FolderGit2, experience: Briefcase, skills: Wrench, about: User, resume: FileText, contact: Mail };

// every word of the query must appear somewhere in the label or keywords
const matches = (item, query) => {
  const haystack = `${item.label} ${item.keywords ?? ""}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
};

const useCommands = (close) => {
  const navigate = useNavigate();
  const base = usePortfolioPath();
  const { home, items, contact } = useNavItems();
  const { profile } = useProfile();
  const { data: projects } = usePortfolioData(portfolioAPI.getProjects);
  const { isDark, canCustomize } = useAppearance();

  return useMemo(() => {
    const go = (href) => () => {
      close();
      navigate(href);
    };
    const pages = [
      { id: "home", label: "Home", icon: Home, run: go(home) },
      ...[...items, contact].filter(Boolean).map((p) => ({
        id: `page-${p.page}`,
        label: p.label,
        keywords: p.page,
        icon: PAGE_ICONS[p.page],
        run: go(p.href),
      })),
    ];
    const work = (projects ?? []).map((p) => ({
      id: `project-${p.slug}`,
      label: p.title,
      hint: p.category || p.status_display,
      keywords: `project ${p.summary} ${p.skills.map((s) => s.name).join(" ")}`,
      icon: Sparkles,
      run: go(`${base}/projects/${p.slug}`),
    }));

    const resumeFile = resumeFileOf(profile);
    const actions = [
      profile?.email && {
        id: "copy-email",
        label: "Copy email address",
        hint: profile.email,
        keywords: "mail contact",
        icon: Mail,
        run: async () => {
          close();
          const ok = await copyText(profile.email);
          toast({ title: ok ? "Email copied" : "Couldn't copy", description: profile.email });
        },
      },
      {
        id: "resume",
        label: resumeFile ? "Download résumé" : "Open résumé",
        keywords: "cv resume pdf print",
        icon: FileText,
        run: resumeFile
          ? () => {
              close();
              window.open(resumeFile, "_blank", "noopener");
            }
          : go(`${base}/resume`),
      },
      {
        id: "toggle-theme",
        label: isDark ? "Switch to light mode" : "Switch to dark mode",
        keywords: "theme dark light mode appearance",
        icon: isDark ? Sun : Moon,
        run: () => setMode(isDark ? "light" : "dark"),
      },
      ...(canCustomize
        ? THEMES.map((t) => ({
            id: `theme-${t.id}`,
            label: `Preview ${t.name} theme`,
            keywords: "theme preset colour color",
            icon: Palette,
            run: () => setPreview({ theme: t.id }),
          }))
        : []),
      ...socialLinksOf(profile).map((s) => ({
        id: `social-${s.id}`,
        label: `Open ${s.label}`,
        hint: s.href.replace(/^https?:\/\/(www\.)?/, ""),
        icon: s.icon,
        run: () => {
          close();
          window.open(s.href, "_blank", "noopener");
        },
      })),
    ].filter(Boolean);

    return [
      { heading: "Pages", items: pages },
      { heading: "Projects", items: work },
      { heading: "Actions", items: actions },
    ];
  }, [base, home, items, contact, projects, profile, isDark, canCustomize, navigate, close]);
};

const PaletteBody = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const groups = useCommands(onClose);

  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter((item) => matches(item, query)) }))
    .filter((g) => g.items.length);
  const flat = visible.flatMap((g) => g.items);
  const current = Math.min(active, Math.max(0, flat.length - 1));
  const optionId = (i) => `${listId}-${i}`;

  useEffect(() => {
    document.getElementById(optionId(current))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const onKeyDown = (e) => {
    const step = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (step) {
      e.preventDefault();
      setActive((current + step + flat.length) % Math.max(1, flat.length));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : flat.length - 1);
    } else if (e.key === "Enter" && flat[current]) {
      e.preventDefault();
      flat[current].run();
    }
  };

  let index = -1;
  return (
    <>
      <div className="flex items-center gap-3 border-b px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search pages, projects, actions…"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={flat.length ? optionId(current) : undefined}
          aria-autocomplete="list"
          aria-label="Search commands"
          className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground focus-visible:outline-none"
        />
        <kbd className="hidden rounded-md border px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground sm:block">ESC</kbd>
      </div>

      <div id={listId} role="listbox" aria-label="Commands" className="max-h-[min(26rem,60vh)] overflow-y-auto p-2">
        {flat.length === 0 && (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">No results for “{query}”</p>
        )}
        {visible.map((group) => (
          <div key={group.heading} role="group" aria-label={group.heading} className="mb-1">
            <p className="eyebrow px-3 pt-3 pb-1.5 text-muted-foreground" aria-hidden>
              {group.heading}
            </p>
            {group.items.map((item) => {
              index += 1;
              const i = index;
              const Icon = item.icon ?? ArrowRight;
              const selected = i === current;
              return (
                <div
                  key={item.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={selected}
                  onMouseMove={() => setActive(i)}
                  onClick={() => item.run()}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                    selected ? "bg-accent text-accent-foreground" : "text-foreground"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", selected ? "" : "text-muted-foreground")} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="hidden max-w-[40%] truncate text-xs text-muted-foreground sm:block">{item.hint}</span>}
                  {selected && <CornerDownLeft className="size-3.5 shrink-0 opacity-70" aria-hidden />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="hidden items-center gap-4 border-t px-4 py-2.5 font-mono text-[0.65rem] text-muted-foreground sm:flex">
        <span>↑↓ to move</span>
        <span>↵ to open</span>
        <span>esc to close</span>
      </div>
    </>
  );
};

/** ⌘K / Ctrl+K anywhere, or openCommandPalette() from a button. */
export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => onOpenCommandPalette(() => setOpen(true)), []);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-[12vh] left-1/2 z-[71] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-[0_40px_100px_-30px_color-mix(in_oklab,var(--foreground)_50%,transparent)] transition-[transform,opacity] duration-200 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          {open && <PaletteBody onClose={close} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
