import { useAppearance } from "@/hooks/useAppearance";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { CONTACT_PAGE, NAV_PAGES } from "@/lib/navigation";

/** Pages the owner hasn't switched off, with full hrefs for this portfolio. */
export const useNavItems = () => {
    const base = usePortfolioPath();
    const { settings } = useAppearance();
    const withHref = (item) => ({ ...item, href: `${base}${item.path}` });
    return {
        home: base || "/",
        items: NAV_PAGES.filter((item) => settings.pages[item.page]).map(withHref),
        contact: settings.pages.contact ? withHref(CONTACT_PAGE) : null,
    };
};
