import { useCallback, useEffect, useState } from "react";
import api from "@/api/axios";
import { clearPortfolioCache } from "@/hooks/usePortfolioData";

/**
 * Load an owner API resource: a list (`/me/skills/`) or a single object
 * (`/me/profile/`). `params` filters a list, e.g. { project: 3 }.
 * A null endpoint loads nothing.
 */
export const useResource = (endpoint, params) => {
    const paramKey = JSON.stringify(params ?? {});
    const [state, setState] = useState({ key: null, data: null, error: null });
    const [version, setVersion] = useState(0);
    const requestKey = `${endpoint}?${paramKey}#${version}`;

    useEffect(() => {
        if (!endpoint) return; // the caller passes the data in instead
        let cancelled = false;
        api.get(endpoint, { params: JSON.parse(paramKey) })
            .then((res) => !cancelled && setState({ key: requestKey, data: res.data, error: null }))
            .catch((error) => !cancelled && setState({ key: requestKey, data: null, error }));
        return () => {
            cancelled = true;
        };
    }, [endpoint, paramKey, requestKey]);

    const reload = useCallback(() => setVersion((v) => v + 1), []);

    // Apply a local change after a successful save, without a refetch
    const mutate = useCallback((update) => {
        clearPortfolioCache();
        setState((s) => ({ ...s, data: typeof update === "function" ? update(s.data) : update }));
    }, []);

    // Keep showing the previous data while a reload is in flight
    const fresh = state.key === requestKey;
    return {
        data: state.data,
        error: fresh ? state.error : null,
        loading: state.key === null || (!fresh && state.data === null),
        reload,
        mutate,
    };
};
