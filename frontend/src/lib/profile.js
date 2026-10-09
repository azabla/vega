import { Globe, Mail } from "lucide-react";
import { FaGithub, FaLinkedin, FaTelegram } from "react-icons/fa";

// Brand marks aren't in Lucide; these three come from react-icons and are only used here.
export const socialLinksOf = (profile) =>
    profile
        ? [
              profile.github && { id: "github", icon: FaGithub, label: "GitHub", href: profile.github },
              profile.linkedin && { id: "linkedin", icon: FaLinkedin, label: "LinkedIn", href: profile.linkedin },
              profile.telegram && { id: "telegram", icon: FaTelegram, label: "Telegram", href: profile.telegram },
              profile.website && { id: "website", icon: Globe, label: "Website", href: profile.website },
          ].filter(Boolean)
        : [];

export const emailLinkOf = (profile) =>
    profile?.email ? { id: "email", icon: Mail, label: "Email", href: `mailto:${profile.email}` } : null;

export { FaGithub as GithubIcon };

const AVAILABILITY = {
    open: { label: "Open to work", tone: "success", pulse: true },
    freelance: { label: "Available for freelance", tone: "success", pulse: true },
    busy: { label: "Busy", tone: "warning", pulse: false },
    unavailable: { label: "Not available", tone: "muted", pulse: false },
};

/** { label, note, tone, pulse } or null when the owner hasn't set a status */
export const availabilityOf = (profile) => {
    const meta = AVAILABILITY[profile?.availability];
    if (!meta) return null;
    return { ...meta, note: profile.availability_note || "" };
};

// The résumé file the owner uploaded, if any (profile first, then about)
export const resumeFileOf = (profile, about) => profile?.resume || about?.cv_file || null;

// schema.org Person for search engines, built from the profile
export const personJsonLd = (profile) =>
  profile && {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.title || undefined,
    description: profile.bio || undefined,
    image: profile.profile_image || undefined,
    url: window.location.origin + window.location.pathname,
    address: profile.location ? { "@type": "PostalAddress", addressLocality: profile.location } : undefined,
    sameAs: socialLinksOf(profile).map((s) => s.href),
  };
