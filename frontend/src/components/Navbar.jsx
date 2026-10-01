import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveSection } from "@/hooks/useActiveSection";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { name: "About", id: "about" },
  { name: "Skills", id: "skills" },
  { name: "Experience", id: "experience" },
  { name: "Projects", id: "projects" },
  { name: "Education", id: "education" },
  { name: "Contact", id: "contact" },
];
const SECTION_IDS = SECTIONS.map((s) => s.id);

const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { profile, loading } = useProfile();
  const base = usePortfolioPath();
  const active = useActiveSection(SECTION_IDS);
  const home = base || "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open ? "border-b bg-background/75 backdrop-blur-xl" : "border-b border-transparent"
      )}
    >
      <nav className="container flex h-16 items-center justify-between gap-6">
        <Link to={home} className="flex items-center gap-2.5 font-semibold" onClick={() => setOpen(false)}>
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-xs text-primary-foreground">
            {loading ? "" : initialsOf(profile?.name)}
          </span>
          {loading ? <Skeleton className="h-4 w-28" /> : <span className="hidden sm:inline">{profile?.name}</span>}
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`${home}#${s.id}`}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                active === s.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.name}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full border bg-card md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="container pb-6 md:hidden">
          <div className="flex flex-col gap-1 border-t pt-4">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`${home}#${s.id}`}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
