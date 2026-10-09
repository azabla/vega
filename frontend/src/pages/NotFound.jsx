import { ArrowLeft, Search } from "lucide-react";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { Button } from "@/components/ui/button";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { openCommandPalette } from "@/lib/commandPalette";

export const NotFound = () => {
  const base = usePortfolioPath();
  return (
    <PortfolioLayout title="Page not found">
      <div className="container flex min-h-[70dvh] flex-col items-center justify-center pt-24 pb-16 text-center">
        <p className="font-mono text-sm text-primary-ink">404</p>
        <h1 className="font-heading mt-4 text-h1">This page went on a coffee break</h1>
        <p className="mt-4 max-w-md text-muted-foreground">It may have moved, or it was never here. Try home, or search for what you need.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button href={base || "/"}>
            <ArrowLeft /> Home
          </Button>
          <Button variant="secondary" onClick={openCommandPalette}>
            <Search /> Search
          </Button>
        </div>
      </div>
    </PortfolioLayout>
  );
};
