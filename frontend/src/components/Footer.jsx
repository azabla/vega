import { ArrowUp, Globe } from "lucide-react";
import { FaGithub, FaLinkedin, FaTelegram } from "react-icons/fa";
import { useProfile } from "@/hooks/useProfile";

export const Footer = () => {
  const { profile } = useProfile();
  const socials = [
    profile?.github && { icon: FaGithub, label: "GitHub", href: profile.github },
    profile?.linkedin && { icon: FaLinkedin, label: "LinkedIn", href: profile.linkedin },
    profile?.telegram && { icon: FaTelegram, label: "Telegram", href: profile.telegram },
    profile?.website && { icon: Globe, label: "Website", href: profile.website },
  ].filter(Boolean);

  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} {profile?.name}
        </p>
        <div className="flex items-center gap-4">
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="hover:text-foreground">
              <s.icon className="size-4" />
            </a>
          ))}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="inline-flex size-8 items-center justify-center rounded-full border hover:text-foreground"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
