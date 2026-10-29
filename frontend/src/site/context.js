import { createContext, useContext } from "react";

export const SiteContext = createContext({ kind: "main" });

/** { kind: "loading" | "main" | "portfolio" | "unknown", username? } for this hostname (lib/site.js). */
export const useSite = () => useContext(SiteContext);
