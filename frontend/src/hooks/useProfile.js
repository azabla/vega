import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";

export const useProfile = () => {
    const { data, loading, error } = usePortfolioData(portfolioAPI.getProfile);
    return { profile: data, loading, error };
};
