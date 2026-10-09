import { ArrowRight, CalendarDays } from "lucide-react";
import { AvailabilityPill } from "@/components/ui/AvailabilityPill";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Reveal } from "@/components/ui/Reveal";
import { useNavItems } from "@/hooks/useNavItems";
import { useProfile } from "@/hooks/useProfile";

export const ContactCTA = () => {
  const { profile } = useProfile();
  const { contact } = useNavItems();
  if (!profile || (!contact && !profile.email)) return null;

  return (
    <section id="contact" className="py-16 md:py-28">
      <div className="container">
        <Reveal className="surface relative overflow-hidden px-6 py-14 text-center md:px-16 md:py-24">
          <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
          <div className="relative">
            <AvailabilityPill profile={profile} />
            <h2 className="font-heading mx-auto mt-6 max-w-3xl text-display">
              Have something in mind? <span className="text-primary-ink italic">Let's talk.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              A project, a role or just a question. I read every message and usually reply within two days.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
              {contact && (
                <Button href={contact.href} size="lg">
                  Send a message <ArrowRight />
                </Button>
              )}
              {profile.email && <CopyButton value={profile.email} className="h-12 px-6">{profile.email}</CopyButton>}
              {profile.booking_url && (
                <Button href={profile.booking_url} size="lg" variant="ghost">
                  <CalendarDays /> Book a call
                </Button>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
