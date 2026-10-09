import { usePortfolioData } from "@/hooks/usePortfolioData";
import { portfolioAPI } from "@/services/portfolioAPI";

// One hook per public resource. Lists default to [] once loaded, so callers
// only need `loading` to tell "not yet" from "empty".
const useList = (fetcher) => {
    const { data, loading, error } = usePortfolioData(fetcher);
    return { data: loading ? null : (data ?? []), loading, error };
};

export const useProjects = () => useList(portfolioAPI.getProjects);
export const useExperience = () => useList(portfolioAPI.getExperience);
export const useEducation = () => useList(portfolioAPI.getEducation);
export const useSkills = () => useList(portfolioAPI.getSkills);
export const useCertificates = () => useList(portfolioAPI.getCertificates);
export const useLanguages = () => useList(portfolioAPI.getLanguages);
export const useTestimonials = () => useList(portfolioAPI.getTestimonials);

// 404 when the owner hasn't written one: treated as "no about", not an error
export const useAbout = () => {
    const { data, loading } = usePortfolioData(portfolioAPI.getAboutMe);
    return { data, loading };
};

export const useProject = (slug) => usePortfolioData(portfolioAPI.getProject, slug);
