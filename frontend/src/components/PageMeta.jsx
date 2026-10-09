import { useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";

/**
 * Title, description, Open Graph/Twitter tags and optional JSON-LD for a page.
 * React 19 hoists <meta> and <link> into <head>.
 */
export const PageMeta = ({ title, description, image, type = "website", jsonLd }) => {
  const { profile } = useProfile();
  const fullTitle = profile?.name
    ? title
      ? `${title} · ${profile.name}`
      : `${profile.name}${profile.title ? ` — ${profile.title}` : ""}`
    : title;
  const desc = description || profile?.bio || "";
  const img = image || profile?.profile_image;
  const url = typeof window !== "undefined" ? window.location.href.split("#")[0] : undefined;

  useEffect(() => {
    if (fullTitle) document.title = fullTitle;
  }, [fullTitle]);

  return (
    <>
      {desc && <meta name="description" content={desc} />}
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      {fullTitle && <meta property="og:title" content={fullTitle} />}
      {desc && <meta property="og:description" content={desc} />}
      {url && <meta property="og:url" content={url} />}
      {img && <meta property="og:image" content={img} />}
      <meta name="twitter:card" content={img ? "summary_large_image" : "summary"} />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    </>
  );
};
