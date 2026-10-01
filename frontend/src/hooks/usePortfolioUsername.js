import { useParams } from "react-router-dom";

// /u/:username shows that user's portfolio; / falls back to VITE_PORTFOLIO_USERNAME.
export const usePortfolioUsername = () => {
    const { username } = useParams();
    return username ?? import.meta.env.VITE_PORTFOLIO_USERNAME;
};
