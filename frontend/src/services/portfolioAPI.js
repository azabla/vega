import api from "@/api/axios";

// Public portfolio endpoints: /api/u/<username>/...
const u = (username) => `/u/${encodeURIComponent(username)}`;

export const portfolioAPI = {
    getProfile: (username) => api.get(`${u(username)}/profile/`),
    getAboutMe: (username) => api.get(`${u(username)}/about/`),

    getSkills: (username) => api.get(`${u(username)}/skills/`),
    getCategories: (username) => api.get(`${u(username)}/categories/`),

    getProjects: (username) => api.get(`${u(username)}/projects/`),
    getFeaturedProjects: (username) => api.get(`${u(username)}/projects/featured/`),
    getProject: (username, slug) => api.get(`${u(username)}/projects/${slug}/`),
    searchProjects: (username, q) => api.get(`${u(username)}/projects/search/`, { params: { q } }),

    getExperience: (username) => api.get(`${u(username)}/experience/`),
    getEducation: (username) => api.get(`${u(username)}/education/`),
    getCertificates: (username) => api.get(`${u(username)}/certificates/`),

    sendMessage: (username, data) => api.post(`${u(username)}/contact/`, data),
};

export default api;
