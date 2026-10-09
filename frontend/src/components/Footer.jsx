import { ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavItems } from "@/hooks/useNavItems";
import { useProfile } from "@/hooks/useProfile";
import { emailLinkOf, socialLinksOf } from "@/lib/profile";

export const Footer = () => {
  const { profile } = useProfile();
  const { items, contact } = useNavItems();
  const links = [emailLinkOf(profile), ...socialLinksOf(profile)].filter(Boolean);

  return (
    <footer className="border-t">
      <div className="container grid gap-8 py-10 text-sm md:grid-cols-[1fr_auto] md:items-end">
        <div className="min-w-0">
          <p className="font-heading text-2xl">{profile?.name}</p>
          {profile?.title && <p className="mt-1 text-muted-foreground">{profile.title}</p>}
          <nav aria-label="Footer" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground">
            {[...items, ...(contact ? [contact] : [])].map((item) => (
              <Link key={item.page} to={item.href} className="transition hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-4 md:items-end">
          <div className="flex items-center gap-1">
            {links.map((s) => (
              <a
                key={s.id}
                href={s.href}
                target={s.id === "email" ? undefined : "_blank"}
                rel="noreferrer"
                aria-label={s.label}
                className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <s.icon className="size-4" />
              </a>
            ))}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Back to top"
              className="ml-1 inline-flex size-9 items-center justify-center rounded-full border text-muted-foreground transition hover:text-foreground"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} {profile?.name} · Built with Vega
          </p>
        </div>
      </div>
    </footer>
  );
};
