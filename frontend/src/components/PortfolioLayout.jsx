import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CommandPalette } from "@/components/CommandPalette";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PageMeta } from "@/components/PageMeta";
import { useApplyAppearance } from "@/hooks/useAppearance";

/** Every public page: navbar, the owner's look, meta tags, palette and footer. */
export const PortfolioLayout = ({ title, meta, children }) => {
  const { pathname, hash } = useLocation();
  useApplyAppearance();

  // new page: start at the top, or at the #section the link points to
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    // sections appear once their data loads; retry briefly
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el || ++tries > 20) {
        el?.scrollIntoView();
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [pathname, hash]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <a
        href="#main"
        className="sr-only z-[80] rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <PageMeta title={title} {...meta} />
      <Navbar />
      <main id="main" key={pathname} className="flex-1 animate-page-in">
        {children}
      </main>
      <Footer />
      <CommandPalette />
    </div>
  );
};
