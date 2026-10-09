import axios from "axios";

// The access token lives in memory only; the refresh token is kept in
// localStorage so a reload can get a new access token (see docs/03-auth.md).
const REFRESH_KEY = "vega.refresh";
const API_BASE_URL = import.meta.env.VITE_API_URL;

let accessToken = null;
let refreshing = null;
const logoutListeners = new Set();

export const getAccessToken = () => accessToken;

export const getRefreshToken = () => {
    try {
        return localStorage.getItem(REFRESH_KEY);
    } catch {
        return null;
    }
};

export const setTokens = ({ access, refresh }) => {
    accessToken = access ?? null;
    if (refresh) {
        try {
            localStorage.setItem(REFRESH_KEY, refresh);
        } catch {
            // storage blocked: the session lasts until the tab is closed
        }
    }
};

export const clearTokens = () => {
    const hadSession = Boolean(accessToken || getRefreshToken());
    accessToken = null;
    try {
        localStorage.removeItem(REFRESH_KEY);
    } catch {
        // nothing stored
    }
    if (hadSession) logoutListeners.forEach((listener) => listener());
};

// Called when the session ends without the user asking (refresh token expired)
export const onSessionEnd = (listener) => {
    logoutListeners.add(listener);
    return () => logoutListeners.delete(listener);
};

/**
 * Exchange the refresh token for a new pair. Concurrent callers share one
 * request: refresh tokens rotate and the old one is blacklisted, so a second
 * parallel refresh with the same token would fail and log the user out.
 */
export const refreshTokens = () => {
    if (!refreshing) {
        const refresh = getRefreshToken();
        if (!refresh) return Promise.reject(new Error("Not signed in"));

        // Plain axios, not the app instance, so the 401 interceptor can't loop
        refreshing = axios
            .post(`${API_BASE_URL}/auth/token/refresh/`, { refresh })
            .then((res) => {
                setTokens(res.data);
                return res.data.access;
            })
            .catch((error) => {
                // A network error keeps the session; a rejected token ends it
                if (error.response) clearTokens();
                throw error;
            })
            .finally(() => {
                refreshing = null;
            });
    }
    return refreshing;
};
