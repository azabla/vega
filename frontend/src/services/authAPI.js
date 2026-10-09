import api from "@/api/axios";

// Account endpoints: /api/auth/...
export const authAPI = {
    login: (data) => api.post("/auth/login/", data),
    register: (data) => api.post("/auth/register/", data),
    logout: (refresh) => api.post("/auth/logout/", { refresh }),
    getMe: () => api.get("/auth/me/"),
    updateMe: (data) => api.patch("/auth/me/", data),
    changePassword: (data) => api.post("/auth/password/change/", data),
};
