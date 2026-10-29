import { ArrowLeft, ArrowRight, Briefcase, Camera, Check, Copy, ExternalLink, FileText, FolderKanban, Loader2, Shuffle } from "lucide-react";
import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { useAuth } from "@/auth/context";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Textarea } from "@/components/ui/form";
import { Choices } from "@/dashboard/components/Choices";
import { ListSkeleton, LoadError } from "@/dashboard/components/Page";
import { toastError } from "@/dashboard/lib/cvActions";
import { useResource } from "@/dashboard/lib/useResource";
import { toast } from "@/hooks/use-toast";
import { clearPortfolioCache } from "@/hooks/usePortfolioData";
import { copyText } from "@/lib/clipboard";
import { PROFESSIONS, professionPreset } from "@/lib/professions";
import { resolveSettings } from "@/lib/settings";
import { STYLE_PRESETS, presetOf, presetSwatch, surpriseLook } from "@/lib/stylePresets";
import { cn } from "@/lib/utils";

const STEPS = ["What you do", "The basics", "Your look", "Share"];

const Progress = ({ step }) => (
  <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Setup steps">
    {STEPS.map((label, i) => (
      <li key={label} aria-current={i === step ? "step" : undefined}>
        <span className={cn("block h-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
        <span className={cn("mt-2 hidden text-xs sm:block", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>{label}</span>
      </li>
    ))}
  </ol>
);

const StyleCard = ({ preset }) => {
  const c = presetSwatch(preset.look);
  return (
    <>
      <span className="flex h-14 items-end gap-1.5 overflow-hidden rounded-lg border p-2" style={{ background: c.page }} aria-hidden>
        <span className="h-full flex-1 rounded" style={{ background: c.card, boxShadow: `0 0 0 1px ${c.text}14` }} />
        <span className="size-4 rounded-full" style={{ background: c.accent }} />
      </span>
      <span className="pr-5">
        <span className="block font-medium">{preset.name}</span>
        <span className="block text-xs leading-4 text-muted-foreground">{preset.hint}</span>
      </span>
    </>
  );
};

/**
 * /dashboard/welcome: the first minutes after signup. Profession → name, headline, photo →
 * a ready-made look → the link to share. Every step saves as it goes; any step can be skipped.
 */
export const WelcomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const profile = useResource("/me/profile/");
  const [step, setStep] = useState(0);
  const [basics, setBasics] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoId = useId();

  if (profile.loading) return <ListSkeleton rows={4} />;
  if (profile.error) return <LoadError onRetry={profile.reload} />;
  const p = profile.data;
  const settings = resolveSettings(p.settings);
  const form = basics ?? { name: p.name || [user.first_name, user.last_name].filter(Boolean).join(" "), title: p.title, location: p.location, bio: p.bio };

  const save = async (data, next = step + 1) => {
    setSaving(true);
    try {
      const res = await api.patch("/me/profile/", data);
      profile.mutate(res.data);
      clearPortfolioCache();
      setStep(next);
    } catch (error) {
      toastError("Couldn't save", error);
    } finally {
      setSaving(false);
    }
  };
  const saveSettings = (patch) => api.patch("/me/profile/", { settings: { ...settings, ...patch } }).then((res) => profile.mutate(res.data));

  const uploadPhoto = async (file) => {
    setUploading(true);
    try {
      const data = new FormData();
      data.append("profile_image", file);
      const res = await api.patch("/me/profile/", data);
      profile.mutate(res.data);
    } catch (error) {
      toastError("Couldn't upload the photo", error);
    } finally {
      setUploading(false);
    }
  };

  const next = (
    <Button type="submit" size="lg" disabled={saving}>
      {saving && <Loader2 className="animate-spin" />} {step === STEPS.length - 2 ? "Finish" : "Continue"} <ArrowRight />
    </Button>
  );
  const footer = (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
      {step > 0 ? (
        <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
          <ArrowLeft /> Back
        </Button>
      ) : (
        <Button type="button" variant="ghost" onClick={() => navigate("/dashboard")}>
          Skip setup
        </Button>
      )}
      {next}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl py-2">
      <p className="eyebrow mb-3 text-muted-foreground">Welcome to Vega</p>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">
        {["What kind of work do you do?", "Introduce yourself", "Pick a look", "Your portfolio is live"][step]}
      </h1>
      <Progress step={step} />

      {step === 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save({ settings: { ...settings, ...professionPreset(settings.profession) } });
          }}
        >
          <p className="mb-4 text-sm text-muted-foreground">Vega names your sections and arranges your pages for your field. You can change it any time.</p>
          <Choices
            name="profession"
            value={settings.profession}
            onChange={(profession) => saveSettings(professionPreset(profession))}
            options={PROFESSIONS}
            columns="grid-cols-1 sm:grid-cols-2"
            render={(o) => (
              <span className="flex items-start gap-3 pr-6">
                <o.icon className="mt-0.5 size-4 shrink-0 text-primary-ink" aria-hidden />
                <span className="min-w-0">
                  <span className="block font-medium">{o.name}</span>
                  <span className="block text-xs leading-5 text-muted-foreground">{o.hint}</span>
                </span>
              </span>
            )}
          />
          {footer}
        </form>
      )}

      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(form);
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-4">
            {p.profile_image ? (
              <img src={p.profile_image} alt="" className="size-20 shrink-0 rounded-full border object-cover" />
            ) : (
              <span className="flex size-20 shrink-0 items-center justify-center rounded-full border border-dashed text-muted-foreground">
                <Camera className="size-6" aria-hidden />
              </span>
            )}
            <div>
              <label
                htmlFor={photoId}
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border bg-background px-4 text-sm font-medium hover:bg-secondary has-focus-visible:outline-2 has-focus-visible:outline-primary-ink"
              >
                {uploading && <Loader2 className="size-4 animate-spin" />}
                {p.profile_image ? "Change photo" : "Add a photo"}
                <input
                  id={photoId}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <FieldHint className="mt-1.5">A clear, friendly photo. You can skip this.</FieldHint>
            </div>
          </div>
          {[
            ["name", "Full name", "e.g. Hana Girma", true],
            ["title", "Headline", "e.g. Backend developer, Architecture student"],
            ["location", "Location", "e.g. Addis Ababa, Ethiopia"],
          ].map(([name, label, placeholder, required]) => (
            <div key={name} className="flex flex-col gap-1.5">
              <Label htmlFor={`welcome-${name}`}>{label}</Label>
              <Input
                id={`welcome-${name}`}
                value={form[name] ?? ""}
                required={required}
                placeholder={placeholder}
                onChange={(e) => setBasics({ ...form, [name]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="welcome-bio">Short bio</Label>
            <Textarea
              id="welcome-bio"
              rows={3}
              value={form.bio ?? ""}
              placeholder="One or two sentences: what you do and for whom."
              onChange={(e) => setBasics({ ...form, bio: e.target.value })}
            />
          </div>
          {footer}
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(3);
          }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Colours, fonts and layout in one click. Fine-tune it later under Appearance.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => saveSettings(surpriseLook(settings))}>
              <Shuffle /> Surprise me
            </Button>
          </div>
          <Choices
            name="style"
            value={presetOf(settings)}
            onChange={(id) => saveSettings(STYLE_PRESETS.find((s) => s.id === id).look)}
            options={STYLE_PRESETS}
            columns="grid-cols-2 sm:grid-cols-4"
            render={(o) => <StyleCard preset={o} />}
          />
          <p className="mt-3 text-xs text-muted-foreground">Your choice is saved as you pick.</p>
          {footer}
        </form>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div className="surface flex flex-col gap-4 p-5">
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <Check className="size-4" /> Anyone with the link can see it now
            </p>
            <p className="font-mono text-sm break-all">{p.public_url}</p>
            <div className="flex flex-wrap gap-2">
              <Button href={p.public_url} size="lg">
                <ExternalLink /> Open my portfolio
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={async () => (await copyText(p.public_url)) && toast({ title: "Link copied" })}
              >
                <Copy /> Copy link
              </Button>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium">Next, add the evidence</p>
            <ul className="grid gap-2 sm:grid-cols-3">
              {[
                { to: "/dashboard/experience", icon: Briefcase, label: "Add a job or internship" },
                { to: "/dashboard/projects", icon: FolderKanban, label: "Add a project" },
                { to: "/dashboard/cv", icon: FileText, label: "Make your CV" },
              ].map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="surface surface-hover flex h-full items-center gap-3 p-4 text-sm font-medium">
                    <n.icon className="size-4 shrink-0 text-primary-ink" aria-hidden /> {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Button href="/dashboard" variant="ghost" className="self-start">
            Go to the dashboard <ArrowRight />
          </Button>
        </div>
      )}
    </div>
  );
};
