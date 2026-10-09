import axios from "axios";
import { getAccessToken, getRefreshToken, refreshTokens } from "@/auth/tokens";

// No default Content-Type: axios sends JSON for objects and lets the browser
// set the multipart boundary for FormData uploads.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// On a 401, refresh the access token once and retry the request
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response } = error;
        const isAuthCall = config?.url?.startsWith("/auth/login") || config?.url?.startsWith("/auth/register");
        if (response?.status !== 401 || !config || config._retried || isAuthCall || !getRefreshToken()) {
            throw error;
        }
        config._retried = true;
        let access;
        try {
            access = await refreshTokens();
        } catch {
            throw error; // session ended: callers see the original 401
        }
        config.headers.Authorization = `Bearer ${access}`;
        return api(config);
    }
);

export default api;
