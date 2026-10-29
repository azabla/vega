import { useEffect, useState } from "react";
import api from "@/api/axios";
import { detectSite } from "@/lib/site";
import { SiteContext } from "@/site/context";

const detected = detectSite(window.location.hostname);

/** Works out which site this hostname serves; an owner's own domain needs one API call. */
export const SiteProvider = ({ children }) => {
  const [site, setSite] = useState(detected.kind === "custom" ? { kind: "loading" } : detected);

  useEffect(() => {
    if (detected.kind !== "custom") return;
    api
      .get("/sites/resolve/", { params: { host: detected.host } })
      .then(({ data }) => setSite(data.kind === "portfolio" ? { kind: "portfolio", username: data.username } : { kind: "main" }))
      .catch(() => setSite({ kind: "unknown" }));
  }, []);

  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
};
