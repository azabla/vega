import { Link } from "react-router-dom";
import { useAuth } from "@/auth/context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useSiteInfo } from "@/site/useSiteInfo";

export const Logo = () => (
  <Link to="/" className="flex items-center gap-2.5 font-semibold">
    <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-sm text-primary-foreground" aria-hidden>
      V
    </span>
    Vega
  </Link>
);

/** Frame for the product's own pages (landing, 404 on the main site): the plain app look, not an owner's. */
export const AppShell = ({ children }) => {
  const { status } = useAuth();
  const info = useSiteInfo();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <nav className="container flex h-16 items-center justify-between gap-3" aria-label="Main">
          <Logo />
          <div className="flex items-center gap-2">
            {status === "authenticated" ? (
              <Button href="/dashboard" size="sm">
                Dashboard
              </Button>
            ) : (
              <>
                <Button href="/login" variant="ghost" size="sm">
                  Log in
                </Button>
                {info?.registration_open !== false && (
                  <Button href="/register" size="sm">
                    Get started
                  </Button>
                )}
              </>
            )}
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t">
        <div className="container flex flex-col gap-2 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Vega · a career identity for Ethiopian professionals</p>
          <p className="font-mono text-xs">Portfolio · CV · QR · your own domain</p>
        </div>
      </footer>
    </div>
  );
};
