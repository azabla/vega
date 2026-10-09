import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ThemeMenu } from "@/components/ThemeMenu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavItems } from "@/hooks/useNavItems";
import { useProfile } from "@/hooks/useProfile";
import { openCommandPalette, shortcutLabel } from "@/lib/commandPalette";
import { initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";

const linkClass = ({ isActive }) =>
  cn(
    "rounded-full px-3 py-1.5 text-sm transition-colors",
    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
  );

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { profile, loading } = useProfile();
  const { home, items, contact } = useNavItems();
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The mobile sheet closes on navigation and locks the page behind it
  const [openedAt, setOpenedAt] = useState(pathname);
  if (open && openedAt !== pathname) {
    setOpen(false);
    setOpenedAt(pathname);
  }
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300",
        scrolled || open ? "border-b bg-background/80 backdrop-blur-xl" : "border-b border-transparent"
      )}
    >
      <nav className="container flex h-16 items-center justify-between gap-4" aria-label="Main">
        <Link to={home} className="flex min-w-0 items-center gap-2.5" aria-label={profile?.name ? `${profile.name}, home` : "Home"}>
          <span className="font-heading flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
            {loading ? "" : initialsOf(profile?.name)}
          </span>
          {loading ? (
            <Skeleton className="h-4 w-28" />
          ) : (
            <span className="hidden truncate font-medium sm:inline">{profile?.name}</span>
          )}
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex">
          {items.map((item) => (
            <NavLink key={item.page} to={item.href} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openCommandPalette}
            className="hidden h-9 items-center gap-2 rounded-full border bg-card px-3 text-sm text-muted-foreground transition hover:text-foreground md:inline-flex"
          >
            <Search className="size-4" />
            Search
            <kbd className="rounded border bg-secondary px-1.5 font-mono text-[0.65rem]">{shortcutLabel}</kbd>
          </button>
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Search"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground md:hidden"
          >
            <Search className="size-4" />
          </button>
          <ThemeMenu />
          {contact && (
            <Button href={contact.href} size="sm" className="ml-1 hidden sm:inline-flex">
              {contact.label}
            </Button>
          )}
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full text-foreground transition hover:bg-secondary lg:hidden"
            onClick={() => {
              setOpenedAt(pathname);
              setOpen((v) => !v);
            }}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="container h-[calc(100dvh-4rem)] overflow-y-auto pb-10 lg:hidden">
          <ul className="flex flex-col border-t pt-4">
            {[{ page: "home", label: "Home", href: home }, ...items, ...(contact ? [contact] : [])].map((item, i) => (
              <li key={item.page} className="animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                <NavLink
                  to={item.href}
                  end={item.page === "home"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "font-heading flex items-center justify-between border-b py-4 text-3xl",
                      isActive ? "text-primary-ink" : "text-foreground"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};
