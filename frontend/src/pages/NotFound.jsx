import { ArrowLeft, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { Button } from "@/components/ui/button";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { usePortfolioUsername } from "@/hooks/usePortfolioUsername";
import { mainSiteUrl } from "@/lib/site";
import { openCommandPalette } from "@/lib/commandPalette";

const Plain = ({ title, children, action }) => (
  <AppShell>
    <title>{title}</title>
    <div className="container flex min-h-[60dvh] flex-col items-center justify-center py-16 text-center">
      <p className="font-mono text-sm text-primary-ink">404</p>
      <h1 className="font-heading mt-4 text-h1">{title}</h1>
      <p className="mt-4 max-w-md text-muted-foreground">{children}</p>
      <div className="mt-8">{action}</div>
    </div>
  </AppShell>
);

/** A host that isn't the main site, a portfolio subdomain or a verified domain. */
export const UnknownDomain = () => (
  <Plain
    title="This domain isn't connected yet"
    action={
      <Button href={mainSiteUrl("/")}>
        <ArrowLeft /> Go to Vega
      </Button>
    }
  >
    If it's yours, add its DNS records and verify it under Dashboard → Domain. It can take a little while for DNS changes to show.
  </Plain>
);

export const NotFound = () => {
  const base = usePortfolioPath();
  const username = usePortfolioUsername();
  if (!username) {
    // the main site, outside any portfolio
    return (
      <Plain
        title="Page not found"
        action={
          <Button href="/">
            <ArrowLeft /> Home
          </Button>
        }
      >
        It may have moved, or it was never here.
      </Plain>
    );
  }
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
