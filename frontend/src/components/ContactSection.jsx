import { LoaderCircle, Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { FaGithub, FaLinkedin, FaTelegram } from "react-icons/fa";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { useToast } from "@/hooks/use-toast";
import { usePortfolioUsername } from "@/hooks/usePortfolioUsername";
import { useProfile } from "@/hooks/useProfile";
import { portfolioAPI } from "@/services/portfolioAPI";

const inputClass =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-ring/30";

export const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const username = usePortfolioUsername();
  const { profile } = useProfile();

  // only show what the owner filled in on their profile
  const contactItems = [
    profile?.email && { icon: Mail, label: "Email", value: profile.email, href: `mailto:${profile.email}` },
    profile?.phone && { icon: Phone, label: "Phone", value: profile.phone, href: `tel:${profile.phone.replace(/\s/g, "")}` },
    profile?.location && { icon: MapPin, label: "Location", value: profile.location },
  ].filter(Boolean);
  const socialLinks = [
    profile?.github && { icon: FaGithub, label: "GitHub", href: profile.github },
    profile?.linkedin && { icon: FaLinkedin, label: "LinkedIn", href: profile.linkedin },
    profile?.telegram && { icon: FaTelegram, label: "Telegram", href: profile.telegram },
  ].filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsSubmitting(true);

    try {
      await portfolioAPI.sendMessage(username, Object.fromEntries(new FormData(form)));
      toast({
        title: "Message sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });
      form.reset();
    } catch (error) {
      const errors = error.response?.data;
      toast({
        title: "Message not sent",
        description: errors ? Object.values(errors).flat().join(" ") : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section id="contact">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <SectionHeader
            className="mb-8"
            eyebrow="Contact"
            title="Let's build something"
            description="Have a project, a role or an idea? Send a message — I usually reply within a day or two."
          />
          <Reveal className="space-y-3">
            {contactItems.map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <item.icon className="size-4" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="text-sm font-medium hover:text-primary">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm font-medium">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
            {socialLinks.length > 0 && (
              <div className="flex gap-2 pt-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    className="inline-flex size-10 items-center justify-center rounded-full border bg-card text-muted-foreground transition hover:text-foreground"
                  >
                    <link.icon className="size-4" />
                  </a>
                ))}
              </div>
            )}
          </Reveal>
        </div>

        <Reveal delay={100}>
          <form onSubmit={handleSubmit} className="surface space-y-5 p-6 md:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Name</span>
                <input name="name" required maxLength={50} placeholder="Your name" className={inputClass} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Email</span>
                <input name="email" type="email" required placeholder="you@example.com" className={inputClass} />
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium">
                Subject <span className="font-normal text-muted-foreground">(optional)</span>
              </span>
              <input name="subject" maxLength={30} placeholder="Project inquiry" className={inputClass} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Message</span>
              <textarea
                name="message"
                required
                rows={5}
                placeholder="Tell me a bit about what you have in mind…"
                className={`${inputClass} resize-none`}
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
              {isSubmitting ? "Sending…" : "Send message"}
            </button>
          </form>
        </Reveal>
      </div>
    </Section>
  );
};
