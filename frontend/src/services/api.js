import axios from axios 

const API_BASE_URL = 'http://127.0.0.1:8000/api'
const api = axios.create({
    baseUrl : API_BASE_URL,
    headers : {
        'Content-Type':'application/json'
    }
});

export const portfolioAPI =  {
    getProfile: () => api.get('/profile/main/'),

    getSkills: () => api.get('/skills/'),
    getSkillsByCategory: () => api.get('/skills/by_category/'),

    getProjects: () => api.get('/projects/'),
    getFeaturedProjects: () => api.get('/projects/featured'),

    getExperience: () => api.get('/experience/'),

    //contact - post request

    sendMessage: (data) => api.post('contact', data),
}

export default api;