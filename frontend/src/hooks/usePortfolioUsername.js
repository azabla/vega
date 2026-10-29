import { useParams } from "react-router-dom";
import { ROOT_USERNAME } from "@/lib/site";
import { useSite } from "@/site/context";

// /u/:username shows that user's portfolio; / shows the portfolio this host serves
// (a subdomain or an owner's own domain), or VITE_PORTFOLIO_USERNAME on a single-portfolio site.
export const usePortfolioUsername = () => {
    const { username } = useParams();
    const site = useSite();
    return username ?? site.username ?? ROOT_USERNAME;
};
