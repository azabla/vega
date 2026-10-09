import {
  Award,
  Briefcase,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  Inbox,
  Info,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Palette,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/auth/context";
import { useAppLook } from "@/hooks/useAppearance";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/appearance", label: "Appearance", icon: Palette },
  { heading: "Profile" },
  { to: "/dashboard/profile", label: "Profile", icon: UserRound },
  { to: "/dashboard/about", label: "About & services", icon: Info },
  { to: "/dashboard/skills", label: "Skills", icon: Sparkles },
  { heading: "Work" },
  { to: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { to: "/dashboard/experience", label: "Experience", icon: Briefcase },
  { to: "/dashboard/education", label: "Education", icon: GraduationCap },
  { to: "/dashboard/certificates", label: "Certificates", icon: Award },
  { to: "/dashboard/languages", label: "Languages", icon: Languages },
  { to: "/dashboard/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { heading: "Account" },
  { to: "/dashboard/messages", label: "Messages", icon: Inbox },
  { to: "/dashboard/account", label: "Settings", icon: Settings },
];

const NavItems = ({ onNavigate }) => (
  <nav className="flex flex-col gap-0.5" aria-label="Dashboard">
    {NAV.map((item) =>
      item.heading ? (
        <p key={item.heading} className="mt-5 mb-1.5 px-3 font-mono text-[0.68rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {item.heading}
        </p>
      ) : (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors md:min-h-9",
              isActive ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <item.icon className="size-4 shrink-0" />
          {item.label}
        </NavLink>
      )
    )}
  </nav>
);

const SidebarFooter = ({ user, onLogout }) => (
  <div className="flex flex-col gap-1 border-t pt-4">
    <a
      href={`/u/${user.username}`}
      target="_blank"
      rel="noreferrer"
      className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground md:min-h-9"
    >
      <ExternalLink className="size-4" />
      View my portfolio
    </a>
    <button
      type="button"
      onClick={onLogout}
      className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground md:min-h-9"
    >
      <LogOut className="size-4" />
      Log out
    </button>
    <div className="mt-3 flex items-center gap-3 px-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs text-primary-foreground uppercase">
        {user.username.slice(0, 2)}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="truncate font-medium">@{user.username}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <ThemeToggle className="size-8" />
    </div>
  </div>
);

const Brand = () => (
  <Link to="/dashboard" className="flex items-center gap-2.5 font-semibold">
    <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-sm text-primary-foreground">V</span>
    Vega
  </Link>
);

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useAppLook();
  const wide = location.pathname.startsWith("/dashboard/appearance");

  // Each page starts at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-dvh bg-background">
      {/* Phones: top bar + slide-in drawer */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-xl md:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="inline-flex size-10 items-center justify-center rounded-full border bg-card"
        >
          <Menu className="size-4" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col overflow-y-auto border-l bg-card px-3 py-4 shadow-2xl">
            <div className="mb-2 flex items-center justify-between px-3">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex size-10 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1">
              <NavItems onNavigate={() => setOpen(false)} />
            </div>
            <SidebarFooter user={user} onLogout={logout} />
          </aside>
        </div>
      )}

      {/* Tablets and up: fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-card/50 px-3 py-5 md:flex">
        <div className="mb-3 px-3">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavItems />
        </div>
        <SidebarFooter user={user} onLogout={logout} />
      </aside>

      <main className="md:pl-64">
        <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 sm:py-10", wide ? "max-w-7xl" : "max-w-3xl")}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
