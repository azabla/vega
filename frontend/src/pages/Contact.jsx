import { CalendarDays, Clock, LoaderCircle, Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { AvailabilityPill } from "@/components/ui/AvailabilityPill";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/CopyButton";
import { PageHeader } from "@/components/ui/Section";
import { useToast } from "@/hooks/use-toast";
import { useLocalTime } from "@/hooks/useLocalTime";
import { usePortfolioUsername } from "@/hooks/usePortfolioUsername";
import { useProfile } from "@/hooks/useProfile";
import { socialLinksOf } from "@/lib/profile";
import { portfolioAPI } from "@/services/portfolioAPI";

const inputClass =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition placeholder:text-muted-foreground focus-visible:border-primary-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_oklab,var(--primary)_20%,transparent)]";

const Field = ({ label, optional, children }) => (
  <label className="block space-y-2">
    <span className="text-sm font-medium">
      {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
    </span>
    {children}
  </label>
);

export const Contact = () => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const username = usePortfolioUsername();
  const { profile } = useProfile();
  const clock = useLocalTime(profile?.timezone);
  const socials = socialLinksOf(profile);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setSending(true);
    try {
      await portfolioAPI.sendMessage(username, Object.fromEntries(new FormData(form)));
      form.reset();
      setSent(true);
    } catch (error) {
      const errors = error.response?.data;
      toast({
        title: "Message not sent",
        description: errors ? Object.values(errors).flat().join(" ") : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <PortfolioLayout title="Contact" meta={{ description: `Get in touch with ${profile?.name ?? "me"}.` }}>
      <PageHeader
        eyebrow="Contact"
        title="Let's talk"
        description="A project, a role, or a question about something I've built. I read every message and usually reply within two days."
      >
        <div className="mt-6">
          <AvailabilityPill profile={profile} />
        </div>
      </PageHeader>

      <div className="container grid gap-10 pb-16 md:pb-24 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <aside className="min-w-0 space-y-8">
          {profile?.email && (
            <div>
              <p className="eyebrow mb-3 text-muted-foreground">Email</p>
              <a href={`mailto:${profile.email}`} className="font-heading block text-2xl break-all hover:text-primary-ink md:text-3xl">
                {profile.email}
              </a>
              <CopyButton value={profile.email} label="Copy address" className="mt-4" />
            </div>
          )}

          {profile?.booking_url && (
            <div className="surface flex items-center gap-4 p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <CalendarDays className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Prefer to talk?</p>
                <p className="text-sm text-muted-foreground">Book a 20-minute call.</p>
              </div>
              <Button href={profile.booking_url} size="sm" variant="secondary">
                Book
              </Button>
            </div>
          )}

          <dl className="space-y-4 text-sm">
            {profile?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground" aria-hidden />
                <dt className="sr-only">Phone</dt>
                <dd>
                  <a href={`tel:${profile.phone.replace(/\s/g, "")}`} className="hover:text-primary-ink">
                    {profile.phone}
                  </a>
                </dd>
              </div>
            )}
            {profile?.location && (
              <div className="flex items-center gap-3">
                <MapPin className="size-4 text-muted-foreground" aria-hidden />
                <dt className="sr-only">Location</dt>
                <dd>{profile.location}</dd>
              </div>
            )}
            {clock && (
              <div className="flex items-center gap-3">
                <Clock className="size-4 text-muted-foreground" aria-hidden />
                <dt className="sr-only">Local time</dt>
                <dd>
                  {clock.time} local time <span className="text-muted-foreground">· {clock.relative}</span>
                </dd>
              </div>
            )}
          </dl>

          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {socials.map((s) => (
                <li key={s.id}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground">
                    <s.icon className="size-4" /> {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="surface p-6 md:p-10">
          {sent ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-center" role="status">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Mail className="size-6" />
              </span>
              <p className="font-heading mt-6 text-3xl">Message sent. Thank you!</p>
              <p className="mt-2 text-muted-foreground">I'll get back to you soon.</p>
              <Button variant="secondary" size="sm" className="mt-6" onClick={() => setSent(false)}>
                Send another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Name">
                  <input name="name" required maxLength={50} autoComplete="name" placeholder="Your name" className={inputClass} />
                </Field>
                <Field label="Email">
                  <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={inputClass} />
                </Field>
              </div>
              <Field label="Subject" optional>
                <input name="subject" maxLength={30} placeholder="Project inquiry" className={inputClass} />
              </Field>
              <Field label="Message">
                <textarea name="message" required rows={6} placeholder="Tell me a bit about what you have in mind…" className={`${inputClass} resize-y`} />
              </Field>
              <Button type="submit" disabled={sending} size="lg" className="w-full">
                {sending ? <LoaderCircle className="animate-spin" /> : <Send />}
                {sending ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </PortfolioLayout>
  );
};
