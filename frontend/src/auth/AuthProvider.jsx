import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/auth/context";
import { clearTokens, getRefreshToken, onSessionEnd, refreshTokens, setTokens } from "@/auth/tokens";
import { authAPI } from "@/services/authAPI";

export const AuthProvider = ({ children }) => {
    const [state, setState] = useState(() => ({
        status: getRefreshToken() ? "loading" : "anonymous",
        user: null,
    }));

    // Restore the session after a reload
    useEffect(() => {
        if (!getRefreshToken()) return;
        let cancelled = false;
        refreshTokens()
            .then(() => authAPI.getMe())
            .then((res) => !cancelled && setState({ status: "authenticated", user: res.data }))
            .catch(() => !cancelled && setState({ status: "anonymous", user: null }));
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => onSessionEnd(() => setState({ status: "anonymous", user: null })), []);

    const login = useCallback(async (credentials) => {
        const { data } = await authAPI.login(credentials);
        setTokens(data);
        const me = await authAPI.getMe();
        setState({ status: "authenticated", user: me.data });
        return me.data;
    }, []);

    const register = useCallback(async (details) => {
        const { data } = await authAPI.register(details);
        setTokens(data);
        setState({ status: "authenticated", user: data.user });
        return data.user;
    }, []);

    const logout = useCallback(async () => {
        const refresh = getRefreshToken();
        try {
            if (refresh) await authAPI.logout(refresh);
        } catch {
            // the token is dropped locally either way
        }
        clearTokens();
        setState({ status: "anonymous", user: null });
    }, []);

    const setUser = useCallback((user) => setState((s) => ({ ...s, user })), []);

    const value = useMemo(
        () => ({ ...state, login, register, logout, setUser }),
        [state, login, register, logout, setUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
