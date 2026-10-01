import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { useProfile } from "@/hooks/useProfile";

export const PortfolioLayout = ({ title, children }) => {
  const { pathname, hash } = useLocation();
  const { profile } = useProfile();

  // new page: start at the top, or at the #section the link points to
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    // sections appear once their data loads; retry briefly
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.getElementById(hash.slice(1));
      if (el || ++tries > 20) {
        el?.scrollIntoView();
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [pathname, hash]);

  useEffect(() => {
    if (profile?.name) {
      document.title = title ? `${title} · ${profile.name}` : `${profile.name} — ${profile.title}`;
    }
  }, [title, profile]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};
