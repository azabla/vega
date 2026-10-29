import { ArrowRight, FileText, Globe, GraduationCap, LayoutTemplate, QrCode, Smartphone, Sparkles, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/Reveal";
import { useAuth } from "@/auth/context";
import { CV_TEMPLATES } from "@/lib/cv";
import { PROFESSIONS } from "@/lib/professions";
import { BASE_DOMAIN } from "@/lib/site";
import { useSiteInfo } from "@/site/useSiteInfo";

const STEPS = [
  { icon: UserRound, title: "Fill in your profile once", text: "Jobs, education, projects, skills and certificates, from your phone. A form, not a website builder." },
  { icon: LayoutTemplate, title: "Pick a look", text: "Themes, fonts and layouts for your site, set up for your profession. Everything previews as you go." },
  { icon: FileText, title: "Make your CVs", text: "Versions for every kind of job, from the same facts. Download a polished PDF in seconds." },
  { icon: QrCode, title: "Share one link", text: "Your own address, a QR code on your CV, and your domain if you have one." },
];

const FEATURES = [
  { icon: Sparkles, title: "Evidence, not star ratings", text: "Every skill links to the projects, jobs and certificates that prove it." },
  { icon: FileText, title: `${CV_TEMPLATES.length} CV templates`, text: "Sidebars, colours, fonts, rich text and per-job rewrites, with a live preview of the real PDF." },
  { icon: GraduationCap, title: "Made for Ethiopia", text: "TVET, Diploma and BSc/MSc levels, Amharic-ready fonts, and a guided start for students." },
  {
    icon: Globe,
    title: "Your own address",
    text: `${BASE_DOMAIN ? `yourname.${BASE_DOMAIN}` : "A short link of your own"}, or connect a domain you own. HTTPS is set up for you.`,
  },
  { icon: Smartphone, title: "Mobile-first", text: "Build and publish your portfolio from your phone in about ten minutes." },
  { icon: QrCode, title: "QR code included", text: "Print it on your CV or business card; it opens your portfolio." },
];

/** The main site's home: what Vega is, and the way in. Product copy only; no owner's data. */
export const Landing = () => {
  const { status } = useAuth();
  const info = useSiteInfo();
  const signedIn = status === "authenticated";
  // Sign-ups can be closed (REGISTRATION_OPEN); then only existing accounts log in
  const closed = !signedIn && info?.registration_open === false;
  const start = signedIn ? "/dashboard" : closed ? "/login" : "/register";
  const cta = signedIn ? "Go to your dashboard" : closed ? "Log in" : "Create your portfolio";
  const showcase = CV_TEMPLATES.filter((t) => ["modern", "swiss", "cards", "elegant", "executive"].includes(t.id));

  return (
    <AppShell>
      {/* React 19 hoists these into <head> */}
      <title>Vega — your career, one link</title>
      <meta name="description" content="Build a portfolio site and CVs from one profile. Share them with one link and a QR code." />

      <section className="relative overflow-hidden border-b">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
        <div className="container relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-fade-up">
            <p className="eyebrow mb-5">Portfolio · CV · QR code</p>
            <h1 className="font-heading text-display">Your career, one link.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Write your experience once. Vega turns it into a portfolio website and as many CVs as you need, and keeps them all up to date.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={start} size="lg">
                {cta} <ArrowRight />
              </Button>
              {!signedIn && !closed && (
                <Button href="/login" variant="outline" size="lg">
                  Log in
                </Button>
              )}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {closed ? "New sign-ups open soon." : "Free: portfolio, CV and PDF export, QR code."}
            </p>
          </div>
          <div className="relative mx-auto h-80 w-full max-w-md sm:h-96" aria-hidden>
            {showcase.map((t, i) => (
              <img
                key={t.id}
                src={t.thumbnail}
                alt=""
                className="absolute top-1/2 left-1/2 w-44 rounded-md border bg-white shadow-lg sm:w-52"
                style={{ transform: `translate(-50%, -50%) translateX(${(i - 2) * 58}px) rotate(${(i - 2) * 5}deg)`, zIndex: 5 - Math.abs(i - 2) }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16 md:py-24" aria-labelledby="how">
        <p className="eyebrow mb-3">How it works</p>
        <h2 id="how" className="font-heading text-h2">From profile to shared link in four steps</h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 80} className="surface flex flex-col gap-3 p-5">
              <span className="flex items-center justify-between">
                <s.icon className="size-5 text-primary-ink" aria-hidden />
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              </span>
              <h3 className="font-medium">{s.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="border-y bg-card/50">
        <div className="container py-16 md:py-24">
          <p className="eyebrow mb-3">For every profession</p>
          <h2 className="font-heading text-h2">Set up for the work you do</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">Pick your field and Vega names your sections and arranges your pages to match. You can change everything afterwards.</p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {PROFESSIONS.filter((p) => p.id !== "general").map((p) => (
              <li key={p.id} className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm">
                <p.icon className="size-4 text-primary-ink" aria-hidden /> {p.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container py-16 md:py-24" aria-labelledby="features">
        <p className="eyebrow mb-3">What you get</p>
        <h2 id="features" className="font-heading text-h2">Everything an employer looks for, in one place</h2>
        <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex gap-4">
              <f.icon className="mt-0.5 size-5 shrink-0 text-primary-ink" aria-hidden />
              <div>
                <h3 className="font-medium">{f.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="container pb-20">
        <div className="surface flex flex-col items-start gap-5 p-8 sm:flex-row sm:items-center sm:justify-between md:p-12">
          <div>
            <h2 className="font-heading text-h2">Ready when you are</h2>
            <p className="mt-2 text-muted-foreground">It takes about ten minutes to publish your first version.</p>
          </div>
          <Button href={start} size="lg">
            {cta} <ArrowRight />
          </Button>
        </div>
      </section>
    </AppShell>
  );
};
