import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SystemBackground } from "@/components/SystemBackground";
import { ThemeToggle } from "@/components/ThemeToggle";

export const PortfolioLayout = ({ children }) => {
  const { pathname, hash } = useLocation();

  // new page: start at the top, or at the #section the link points to
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ThemeToggle />
      <SystemBackground />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};
