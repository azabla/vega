import { useEffect, useState } from "react";
import api from "@/api/axios";

/**
 * Live preview of an unsaved CV draft: the server renders the real PDF and returns
 * its pages as images, so the preview is exact on any device. Debounced; a newer
 * draft cancels the request for an older one. `version` forces a refresh (new photo).
 */
export const useCvPreview = (cvId, draft, version = 0, delay = 450) => {
    const payload = draft && JSON.stringify({ id: cvId, template: draft.template, design: draft.design, content: draft.content });
    const [state, setState] = useState({ key: null, pages: [], pageCount: 0, error: null });
    const key = `${payload}#${version}`;

    useEffect(() => {
        if (!payload) return;
        const controller = new AbortController();
        const timer = setTimeout(() => {
            api.post("/me/cvs/preview/", JSON.parse(payload), { signal: controller.signal })
                .then(({ data }) => setState({ key, pages: data.pages, pageCount: data.page_count, error: null }))
                .catch((error) => {
                    if (controller.signal.aborted) return;
                    setState((s) => ({ ...s, key, error }));
                });
        }, delay);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [payload, key, delay]);

    return { pages: state.pages, pageCount: state.pageCount, error: state.error, loading: Boolean(payload) && state.key !== key };
};
