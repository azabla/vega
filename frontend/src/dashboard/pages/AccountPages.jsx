import { CheckCircle2, Circle, Copy, ExternalLink, Inbox, Mail, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/axios";
import { useAuth } from "@/auth/context";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/skeleton";
import { FormFields } from "@/dashboard/components/FormFields";
import { EmptyState, ListSkeleton, LoadError, PageHeader, Panel, SaveButton } from "@/dashboard/components/Page";
import { RecordForm } from "@/dashboard/components/RecordForm";
import { parseApiError } from "@/dashboard/lib/records";
import { useResource } from "@/dashboard/lib/useResource";
import { toast } from "@/hooks/use-toast";
import { authAPI } from "@/services/authAPI";
import { cn } from "@/lib/utils";

const dateTime = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

// The guided first-run checklist: each step links to the page that completes it
const steps = ({ profile, about, skills, projects, experience, education }) => [
  { done: Boolean(profile?.name && profile?.title), label: "Add your name and headline", to: "/dashboard/profile" },
  { done: Boolean(profile?.profile_image), label: "Upload a profile photo", to: "/dashboard/profile" },
  { done: Boolean(about?.title && about?.description), label: "Write your about section", to: "/dashboard/about" },
  { done: (skills?.length ?? 0) >= 3, label: "Add at least 3 skills", to: "/dashboard/skills" },
  { done: (projects?.length ?? 0) >= 1, label: "Add a project", to: "/dashboard/projects" },
  {
    done: (experience?.length ?? 0) + (education?.length ?? 0) >= 1,
    label: "Add experience or education",
    to: (experience?.length ?? 0) ? "/dashboard/education" : "/dashboard/experience",
  },
  {
    done: Boolean(profile?.email || profile?.linkedin || profile?.github || profile?.telegram),
    label: "Add a way to contact you",
    to: "/dashboard/profile",
  },
  { done: Boolean(profile?.settings?.theme), label: "Choose your look", to: "/dashboard/appearance" },
];

export const OverviewPage = () => {
  const { user } = useAuth();
  const profile = useResource("/me/profile/");
  const about = useResource("/me/about/");
  const skills = useResource("/me/skills/");
  const projects = useResource("/me/projects/");
  const experience = useResource("/me/experience/");
  const education = useResource("/me/education/");
  const messages = useResource("/me/messages/");

  const all = [profile, about, skills, projects, experience, education];
  const loading = all.some((r) => r.loading);
  const failed = all.find((r) => r.error);
  const list = steps({
    profile: profile.data,
    about: about.data,
    skills: skills.data,
    projects: projects.data,
    experience: experience.data,
    education: education.data,
  });
  const done = list.filter((s) => s.done).length;
  const percent = Math.round((done / list.length) * 100);
  const publicUrl = `${window.location.origin}/u/${user.username}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Copy failed", description: publicUrl });
    }
  };

  const stats = [
    { label: "Projects", value: projects.data?.length, to: "/dashboard/projects" },
    { label: "Skills", value: skills.data?.length, to: "/dashboard/skills" },
    { label: "Jobs", value: experience.data?.length, to: "/dashboard/experience" },
    { label: "Messages", value: messages.data?.length, to: "/dashboard/messages" },
  ];

  return (
    <>
      <PageHeader
        title={`Hi, ${user.first_name || user.username}`}
        description="Keep your profile up to date. Every change shows on your portfolio right away."
      />

      <div className="flex flex-col gap-6">
        <Panel>
          <p className="text-sm font-medium">Your portfolio</p>
          <p className="mt-1 truncate font-mono text-sm text-muted-foreground">{publicUrl}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`/u/${user.username}`}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "px-3.5")}
            >
              <ExternalLink /> Open
            </a>
            <Button type="button" variant="outline" size="lg" className="px-3.5" onClick={copyLink}>
              <Copy /> Copy link
            </Button>
          </div>
        </Panel>

        {failed ? (
          <LoadError onRetry={() => all.forEach((r) => r.error && r.reload())} />
        ) : (
          <Panel
            title={percent === 100 ? "Your profile is complete" : "Finish your profile"}
            description={`${done} of ${list.length} done`}
          >
            {loading ? (
              <ListSkeleton rows={4} />
            ) : (
              <>
                <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                </div>
                <ul className="flex flex-col">
                  {list.map((step) => (
                    <li key={step.label}>
                      <Link
                        to={step.to}
                        className="-mx-2 flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm hover:bg-muted"
                      >
                        {step.done ? (
                          <CheckCircle2 className="size-5 shrink-0 text-primary" />
                        ) : (
                          <Circle className="size-5 shrink-0 text-muted-foreground/60" />
                        )}
                        <span className={cn(step.done && "text-muted-foreground line-through")}>{step.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <Link key={s.label} to={s.to} className="surface p-4 transition hover:border-primary/40">
              {s.value === undefined ? (
                <Skeleton className="h-8 w-10" />
              ) : (
                <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
              )}
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export const MessagesPage = () => {
  const { data, loading, error, reload, mutate } = useResource("/me/messages/");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/me/messages/${deleting.id}/`);
      mutate((list) => list.filter((m) => m.id !== deleting.id));
      setDeleting(null);
      toast({ title: "Message deleted" });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't delete", description: parseApiError(err).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Messages" description="Sent through the contact form on your portfolio." />
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <LoadError onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState icon={Inbox} title="No messages yet">
          When someone uses the contact form on your portfolio, it shows up here.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((m) => (
            <li key={m.id} className="surface p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{m.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{m.email}</p>
                </div>
                <time dateTime={m.created_at} className="shrink-0 text-xs text-muted-foreground">
                  {dateTime.format(new Date(m.created_at))}
                </time>
              </div>
              {m.subject && <p className="mt-3 text-sm font-medium">{m.subject}</p>}
              <p className="mt-1 text-sm leading-6 whitespace-pre-line text-muted-foreground">{m.message}</p>
              <div className="mt-4 flex gap-2">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "your message"}`)}`}
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-3")}
                >
                  <Mail /> Reply
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="px-3 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleting(m)}
                >
                  <Trash2 /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={deleting !== null}
        onClose={() => !busy && setDeleting(null)}
        title="Delete this message?"
        className="m-auto h-auto max-w-[calc(100%-2rem)] rounded-2xl border sm:max-w-md"
        footer={
          <>
            <Button type="button" variant="outline" size="lg" className="px-4" disabled={busy} onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button type="button" size="lg" className="bg-destructive px-4 text-white hover:bg-destructive/90" disabled={busy} onClick={onDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">The message from {deleting?.name} will be deleted. This can't be undone.</p>
      </Modal>
    </>
  );
};

const accountFields = [
  { name: "first_name", label: "First name", autoComplete: "given-name" },
  { name: "last_name", label: "Last name", autoComplete: "family-name" },
  {
    name: "username",
    label: "Username",
    required: true,
    wide: true,
    autoComplete: "username",
    help: "Your portfolio lives at /u/<username>. Changing it breaks links you've already shared.",
  },
  { name: "email", label: "Email", type: "email", readOnly: true, wide: true, help: "Used to log in. It can't be changed yet." },
];

const passwordFields = [
  { name: "old_password", label: "Current password", type: "password", required: true, wide: true, autoComplete: "current-password" },
  { name: "new_password", label: "New password", type: "password", required: true, wide: true, autoComplete: "new-password", help: "At least 8 characters." },
];

export const AccountPage = () => {
  const { user, setUser } = useAuth();
  const [passwordFormKey, setPasswordFormKey] = useState(0);

  return (
    <>
      <PageHeader title="Settings" description="Your login details." />
      <div className="flex flex-col gap-6">
        <Panel title="Account">
          <RecordForm
            endpoint="/auth/me/"
            record={user}
            fields={accountFields}
            singleton
            onSaved={(saved) => {
              setUser(saved);
              toast({ title: "Account saved" });
            }}
          />
        </Panel>
        <Panel title="Password">
          <PasswordForm
            key={passwordFormKey}
            onSaved={() => {
              setPasswordFormKey((k) => k + 1); // clear the fields
              toast({ title: "Password changed" });
            }}
          />
        </Panel>
      </div>
    </>
  );
};

// Not a record: POST once and clear, so it doesn't go through saveRecord
const PasswordForm = ({ onSaved }) => {
  const [values, setValues] = useState({ old_password: "", new_password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await authAPI.changePassword(values);
      onSaved();
    } catch (error) {
      const parsed = parseApiError(error, passwordFields);
      setErrors(parsed.fieldErrors);
      setMessage(parsed.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert>{message}</FormAlert>
      <FormFields
        fields={passwordFields}
        values={values}
        errors={errors}
        disabled={saving}
        onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))}
      />
      <div className="flex justify-end">
        <SaveButton saving={saving} />
      </div>
    </form>
  );
};
