import { useAppearance } from "@/hooks/useAppearance";
import { useAchievements } from "@/hooks/usePortfolio";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { CONTACT_PAGE, NAV_PAGES } from "@/lib/navigation";
import { labelsOf } from "@/lib/professions";

/** Pages the owner hasn't switched off, named for their profession, with full hrefs for this portfolio. */
export const useNavItems = () => {
    const base = usePortfolioPath();
    const { settings } = useAppearance();
    const { data: achievements } = useAchievements();
    const labels = labelsOf(settings.profession);
    const withHref = (item) => ({ ...item, label: labels[item.labelKey] ?? item.label, href: `${base}${item.path}` });
    // Most owners have no awards or publications: no link to an empty page
    const shown = (item) => settings.pages[item.page] && (item.page !== "achievements" || achievements?.length > 0);
    return {
        home: base || "/",
        items: NAV_PAGES.filter(shown).map(withHref),
        contact: settings.pages.contact ? withHref(CONTACT_PAGE) : null,
    };
};
