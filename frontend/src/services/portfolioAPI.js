import api from "@/api/axios";



export const portfolioAPI =  {
    getProfile: () => api.get('/profile/main/'),
    getAboutMe: () => api.get('/about/'),

    getSkills: () => api.get("/skills/"),

    getCategories: () => api.get("/categories/"),

    getSkillsByCategory: () => api.get('/skills/by_category/'),

    getProjects: () => api.get('/projects/'),
    getFeaturedProjects: () => api.get('/projects/featured'),

    getExperience: () => api.get('/experience/'),

    //contact - post request

    sendMessage: (data) => api.post('contact', data),
}

export default api;