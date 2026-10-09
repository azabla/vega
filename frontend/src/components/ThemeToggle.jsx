import { Moon, Sun } from "lucide-react";
import { useAppLook } from "@/hooks/useAppearance";
import { cn } from "@/lib/utils";

/** Light/dark switch for the dashboard and login pages (also applies their plain look). */
export const ThemeToggle = ({ className }) => {
  const { isDark, toggleDark } = useAppLook();

  return (
    <button
      type="button"
      onClick={toggleDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition hover:text-foreground",
        className
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
};
