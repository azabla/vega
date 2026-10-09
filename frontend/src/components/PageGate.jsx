import { useAppearance } from "@/hooks/useAppearance";
import { NotFound } from "@/pages/NotFound";

/** Renders the page, or the 404 page when the owner has switched it off. */
export const PageGate = ({ page, children }) => {
  const { settings, ready } = useAppearance();
  if (ready && !settings.pages[page]) return <NotFound />;
  return children;
};
