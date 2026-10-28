import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import { useAuth } from "@/auth/context";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/CopyButton";
import { FieldHint, Input, Label, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { Choices, Switch } from "@/dashboard/components/Choices";
import { EmptyState, ListSkeleton, LoadError, PageHeader, Panel } from "@/dashboard/components/Page";
import { downloadFile } from "@/dashboard/lib/download";
import { parseApiError } from "@/dashboard/lib/records";
import { useCvPreview } from "@/dashboard/lib/useCvPreview";
import { useResource } from "@/dashboard/lib/useResource";
import { toast } from "@/hooks/use-toast";
import {
  CONTACT_FIELDS,
  CV_ACCENTS,
  CV_FLAGS,
  CV_FONTS,
  CV_ITEM_SOURCES,
  CV_OPTIONS,
  CV_SECTIONS,
  CV_TEMPLATES,
  DEFAULT_DESIGN,
  FORMATTING_HINT,
  MAX_CUSTOM_SECTIONS,
  defaultItemIds,
  isCustomSection,
  newCustomSectionId,
  resolveDesign,
  resolveSections,
  templateOf,
} from "@/lib/cv";
import { cn } from "@/lib/utils";
import { portfolioFiles } from "@/services/portfolioAPI";

const updated = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const toastError = (title, error) => toast({ variant: "destructive", title, description: parseApiError(error).message || "Please try again." });
const downloadCv = (cv) =>
  downloadFile(`/me/cvs/${cv.id}/pdf/`, `${cv.slug}.pdf`).catch((error) => toastError("Couldn't download", error));

/** A page of the template, drawn from the real renderer (see render_cv_thumbnails). */
const TemplateThumb = ({ template, className }) => (
  <img
    src={templateOf(template).thumbnail}
    alt=""
    loading="lazy"
    className={cn("aspect-[210/297] w-full rounded-md border bg-white object-cover object-top", className)}
  />
);

const TemplatePicker = ({ name, value, onChange, columns = "grid-cols-2 sm:grid-cols-3" }) => (
  <Choices
    name={name}
    value={value}
    onChange={onChange}
    options={CV_TEMPLATES}
    columns={columns}
    render={(t) => (
      <>
        <TemplateThumb template={t.id} />
        <span className="pr-5">
          <span className="block font-medium">{t.name}</span>
          <span className="block text-xs leading-5 text-muted-foreground">{t.hint}</span>
        </span>
      </>
    )}
  />
);

// ---------------------------------------------------------------- list

const NewCvModal = ({ open, onClose, onCreated, count }) => {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("classic");
  const [saving, setSaving] = useState(false);
  const id = useId();

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/me/cvs/", { name: name.trim() || (count ? `CV ${count + 1}` : "General"), template });
      onCreated(data);
    } catch (error) {
      toastError("Couldn't create the CV", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New CV"
      description="Pick a starting template. You can change the template, colours and content at any time."
      className="sm:max-w-3xl"
      footer={
        <>
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={`${id}-form`} size="lg" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />} Create
          </Button>
        </>
      }
    >
      <form id={`${id}-form`} onSubmit={create} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-name`}>Name</Label>
          <Input id={`${id}-name`} value={name} maxLength={120} placeholder="e.g. General, Backend roles, Scholarship" onChange={(e) => setName(e.target.value)} />
          <FieldHint>Only you see it. Make one version per kind of job you apply for.</FieldHint>
        </div>
        <TemplatePicker name={`${id}-template`} value={template} onChange={setTemplate} />
      </form>
    </Modal>
  );
};

export const CVListPage = () => {
  const { data, loading, error, reload, mutate } = useResource("/me/cvs/");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const duplicate = async (cv) => {
    try {
      const { data: copy } = await api.post(`/me/cvs/${cv.id}/duplicate/`);
      mutate((list) => [...list, copy]);
      toast({ title: "CV duplicated", description: copy.name });
    } catch (err) {
      toastError("Couldn't duplicate", err);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/me/cvs/${deleting.id}/`);
      reload(); // another CV may have become the default
      setDeleting(null);
      toast({ title: "CV deleted" });
    } catch (err) {
      toastError("Couldn't delete", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="CV & résumé"
        description="Make a version for each kind of job. Every version is built from your profile, so it stays up to date; here you choose the design and what goes on it."
        action={
          <Button type="button" size="lg" className="self-start px-4" onClick={() => setCreating(true)}>
            <Plus /> New CV
          </Button>
        }
      />

      {loading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <LoadError onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No CV versions yet"
          action={
            <Button type="button" size="lg" onClick={() => setCreating(true)}>
              <Plus /> Create your first CV
            </Button>
          }
        >
          Your portfolio already offers a Classic PDF. Create a CV to pick a template, colours, photo and what it includes.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {data.map((cv) => (
            <li key={cv.id} className="surface flex flex-col overflow-hidden">
              <Link to={`/dashboard/cv/${cv.id}`} className="block border-b bg-muted/40 px-8 pt-6" tabIndex={-1} aria-hidden>
                <TemplateThumb template={cv.template} className="h-44 rounded-b-none border-b-0 shadow-sm" />
              </Link>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">
                    <Link to={`/dashboard/cv/${cv.id}`} className="hover:underline">
                      {cv.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {templateOf(cv.template).name} · updated {updated.format(new Date(cv.updated_at))}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    {cv.is_default && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
                        <Star className="size-3" /> On your portfolio
                      </span>
                    )}
                    {!cv.is_public && (
                      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-muted-foreground">
                        <Lock className="size-3" /> Private
                      </span>
                    )}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-1.5">
                  <Button href={`/dashboard/cv/${cv.id}`} size="sm">
                    Edit
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => downloadCv(cv)}>
                    <Download /> PDF
                  </Button>
                  <span className="ml-auto flex">
                    <Button type="button" variant="ghost" size="icon-lg" aria-label={`Duplicate ${cv.name}`} title="Duplicate" onClick={() => duplicate(cv)}>
                      <Copy />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-lg" aria-label={`Delete ${cv.name}`} title="Delete" onClick={() => setDeleting(cv)}>
                      <Trash2 />
                    </Button>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <NewCvModal
        open={creating}
        count={data?.length ?? 0}
        onClose={() => setCreating(false)}
        onCreated={(cv) => navigate(`/dashboard/cv/${cv.id}`)}
      />
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this CV?"
        description={deleting ? `“${deleting.name}” and its link stop working. Your profile isn't affected.` : ""}
        footer={
          <>
            <Button type="button" variant="outline" size="lg" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" size="lg" disabled={busy} onClick={remove}>
              {busy && <Loader2 className="animate-spin" />} Delete
            </Button>
          </>
        }
      />
    </>
  );
};

// ---------------------------------------------------------------- editor

const toDraft = (cv) => ({
  name: cv.name,
  template: cv.template,
  design: resolveDesign(cv.design),
  content: cv.content ?? {},
  is_public: cv.is_public,
  is_default: cv.is_default,
});

const Segmented = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <p className="text-sm font-medium">{label}</p>
    <div className="flex flex-wrap gap-1 rounded-xl border bg-background p-1" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "min-h-9 flex-1 rounded-lg px-3 text-sm transition",
            value === o.id ? "bg-foreground font-medium text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.name}
        </button>
      ))}
    </div>
  </div>
);

const AccentPicker = ({ value, onChange }) => {
  const id = useId();
  const preset = CV_ACCENTS.some((a) => a.color === value);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Accent colour</p>
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Accent colour">
        {CV_ACCENTS.map((a) => (
          <button
            key={a.color}
            type="button"
            role="radio"
            aria-checked={value === a.color}
            aria-label={a.name}
            title={a.name}
            onClick={() => onChange(a.color)}
            className={cn("size-9 rounded-full border-2 transition", value === a.color ? "border-foreground ring-2 ring-background ring-offset-0" : "border-transparent")}
            style={{ background: a.color }}
          />
        ))}
        <label
          htmlFor={id}
          className={cn(
            "relative flex h-9 cursor-pointer items-center gap-2 rounded-full border bg-background pr-3 pl-1 text-sm has-focus-visible:outline-2 has-focus-visible:outline-primary-ink",
            !preset && "border-foreground"
          )}
        >
          <span className="size-7 rounded-full border" style={{ background: value }} aria-hidden />
          Custom
          <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="sr-only" />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">Text in the accent is darkened automatically when needed, so it stays readable.</p>
    </div>
  );
};

/** Choose which entries of a section go on this CV. No choice = all (projects: featured). */
const ItemPicker = ({ kind, value, onChange }) => {
  const source = CV_ITEM_SOURCES[kind];
  const { data, loading, error, reload } = useResource(source.endpoint);
  if (loading) return <ListSkeleton rows={1} />;
  if (error) return <LoadError onRetry={reload} />;
  const records = data.filter(source.filter ?? (() => true));
  if (!records.length) return <p className="text-sm text-muted-foreground">Nothing in your profile yet.</p>;

  const picking = Array.isArray(value);
  const chosen = new Set(picking ? value : defaultItemIds(kind, records));
  const toggle = (rid) => onChange(chosen.has(rid) ? [...chosen].filter((x) => x !== rid) : [...chosen, rid]);

  return (
    <div className="flex flex-col gap-2">
      <Segmented
        label="Entries"
        value={picking ? "pick" : "auto"}
        options={[
          { id: "auto", name: source.featuredByDefault ? "Featured" : "All" },
          { id: "pick", name: "Choose" },
        ]}
        onChange={(mode) => onChange(mode === "pick" ? [...chosen] : undefined)}
      />
      {picking && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Entries on this CV">
          {records.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={chosen.has(r.id)}
              onClick={() => toggle(r.id)}
              className={cn(
                "inline-flex min-h-9 max-w-full items-center rounded-full border px-3 text-left text-sm transition",
                chosen.has(r.id) ? "border-primary/40 bg-accent text-accent-foreground" : "bg-background text-muted-foreground line-through hover:text-foreground"
              )}
            >
              <span className="truncate">{source.label(r)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SectionRow = ({ section, index, count, onMove, onChange, onRemove, content, setContent }) => {
  const [open, setOpen] = useState(isCustomSection(section.id) && !section.body);
  const id = useId();
  const custom = isCustomSection(section.id);
  const label = section.title || CV_SECTIONS[section.id] || "Custom section";

  return (
    <li className={cn("bg-background", !section.visible && "bg-muted/50")}>
      <div className="flex min-h-14 items-center gap-1 px-2 py-2 sm:px-3">
        <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground">{index + 1}</span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((v) => !v)}
          className={cn("flex min-h-10 min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-medium", !section.visible && "text-muted-foreground line-through")}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        <Button type="button" variant="ghost" size="icon" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUp />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label={`Move ${label} down`} disabled={index === count - 1} onClick={() => onMove(1)}>
          <ArrowDown />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-pressed={!section.visible}
          aria-label={section.visible ? `Hide ${label}` : `Show ${label}`}
          onClick={() => onChange({ visible: !section.visible })}
        >
          {section.visible ? <Eye /> : <EyeOff />}
        </Button>
      </div>
      {open && (
        <div id={`${id}-panel`} className="flex flex-col gap-4 border-t px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-title`}>Title</Label>
            <Input
              id={`${id}-title`}
              value={section.title}
              maxLength={80}
              placeholder={CV_SECTIONS[section.id] ?? "e.g. Publications, Awards, References"}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>
          {section.id === "summary" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-summary`}>Text for this CV</Label>
              <Textarea
                id={`${id}-summary`}
                rows={5}
                maxLength={4000}
                value={content.summary ?? ""}
                placeholder="Leave empty to use the About text from your profile."
                onChange={(e) => setContent({ summary: e.target.value })}
              />
              <FieldHint>{FORMATTING_HINT}</FieldHint>
            </div>
          )}
          {custom && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-body`}>Text</Label>
              <Textarea id={`${id}-body`} rows={6} maxLength={6000} value={section.body ?? ""} onChange={(e) => onChange({ body: e.target.value })} />
              <FieldHint>{FORMATTING_HINT}</FieldHint>
            </div>
          )}
          {CV_ITEM_SOURCES[section.id] && (
            <ItemPicker
              kind={section.id}
              value={content.items?.[section.id]}
              onChange={(ids) => {
                const items = { ...(content.items ?? {}) };
                if (ids === undefined) delete items[section.id];
                else items[section.id] = ids;
                setContent({ items });
              }}
            />
          )}
          {custom && (
            <Button type="button" variant="ghost" className="-ml-2 self-start px-2 text-destructive" onClick={onRemove}>
              <Trash2 /> Remove section
            </Button>
          )}
        </div>
      )}
    </li>
  );
};

const Preview = ({ preview, onRetry }) => (
  <div className="flex flex-col gap-3">
    <p className="flex min-h-5 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
      {preview.loading ? (
        <>
          <Loader2 className="size-3.5 animate-spin" /> Updating preview…
        </>
      ) : preview.error ? (
        <span className="text-destructive">Couldn't update the preview.</span>
      ) : (
        `${preview.pageCount} ${preview.pageCount === 1 ? "page" : "pages"}${preview.pageCount > preview.pages.length ? ` (first ${preview.pages.length} shown)` : ""}`
      )}
      {preview.error && (
        <Button type="button" variant="outline" size="xs" onClick={onRetry}>
          Retry
        </Button>
      )}
    </p>
    {preview.pages.length === 0 && !preview.error ? (
      <div className="aspect-[210/297] w-full animate-pulse rounded-lg border bg-muted" aria-label="Loading preview" />
    ) : (
      preview.pages.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Page ${i + 1} of your CV`}
          className={cn("w-full rounded-lg border bg-white shadow-sm transition-opacity", preview.loading && "opacity-60")}
        />
      ))
    )}
  </div>
);

export const CVEditorPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const cv = useResource(`/me/cvs/${id}/`);
  const profile = useResource("/me/profile/");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [retry, setRetry] = useState(0);
  const [tab, setTab] = useState("edit"); // phones: edit | preview
  const photoInput = useId();

  const saved = cv.data ? toDraft(cv.data) : null;
  const current = draft ?? saved;
  const dirty = Boolean(draft && saved && !same(draft, saved));
  const preview = useCvPreview(id, current, photoVersion + retry);

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  if (cv.loading) return <ListSkeleton rows={5} />;
  if (cv.error) {
    return cv.error.response?.status === 404 ? (
      <EmptyState icon={FileText} title="This CV doesn't exist" action={<Button href="/dashboard/cv">All CVs</Button>} />
    ) : (
      <LoadError onRetry={cv.reload} />
    );
  }

  const set = (patch) => setDraft({ ...current, ...patch });
  const setDesign = (patch) => set({ design: { ...current.design, ...patch } });
  const setContent = (patch) => set({ content: { ...current.content, ...patch } });
  const sections = resolveSections(current.template, current.content.sections);
  const setSections = (next) => setContent({ sections: next });
  const customCount = sections.filter((s) => isCustomSection(s.id)).length;
  const hidden = new Set(current.content.hide_contact ?? []);
  const contactFields = CONTACT_FIELDS.filter((f) => profile.data?.[f.id]);
  const publicUrl = portfolioFiles.cv(user.username, { slug: cv.data.slug });

  const moveSection = (index, step) => {
    const next = [...sections];
    const [item] = next.splice(index, 1);
    next.splice(index + step, 0, item);
    setSections(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/me/cvs/${id}/`, current);
      cv.mutate(data);
      setDraft(null);
      toast({ title: "CV saved" });
    } catch (error) {
      toastError("Couldn't save", error);
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("photo", file);
      const { data } = await api.patch(`/me/cvs/${id}/`, form);
      cv.mutate(data);
      setDesign({ photo: "upload" });
      setPhotoVersion((v) => v + 1);
    } catch (error) {
      toastError("Couldn't upload the photo", error);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    try {
      const { data } = await api.patch(`/me/cvs/${id}/`, { photo: null });
      cv.mutate(data);
      setPhotoVersion((v) => v + 1);
    } catch (error) {
      toastError("Couldn't remove the photo", error);
    }
  };

  return (
    <>
      <Link to="/dashboard/cv" className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All CVs
      </Link>
      <PageHeader
        title={current.name || "Untitled CV"}
        description="Changes show in the preview right away. Your profile stays the same; this only chooses what this CV shows and how."
        action={
          <Button type="button" variant="outline" size="lg" className="self-start px-3.5" disabled={dirty} title={dirty ? "Save first" : undefined} onClick={() => downloadCv(cv.data)}>
            <Download /> Download PDF
          </Button>
        }
      />

      <div className="sticky top-14 z-30 -mx-4 mb-4 flex gap-1 border-b bg-background/90 px-4 py-2 backdrop-blur lg:hidden" role="tablist">
        {[
          ["edit", "Edit"],
          ["preview", "Preview"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn("h-9 flex-1 rounded-full text-sm font-medium transition", tab === key ? "bg-foreground text-background" : "text-muted-foreground")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div className={cn("flex flex-col gap-5 pb-24", tab === "preview" && "hidden lg:flex")}>
          <Panel title="Template" description="The layout. Your content and choices carry over when you switch.">
            <TemplatePicker name="template" value={current.template} onChange={(template) => set({ template })} columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3" />
          </Panel>

          <Panel title="Colour & type">
            <div className="flex flex-col gap-5">
              <AccentPicker value={current.design.accent} onChange={(accent) => setDesign({ accent })} />
              <div>
                <p className="mb-2 text-sm font-medium">Fonts</p>
                <Choices
                  name="font"
                  value={current.design.font}
                  onChange={(font) => setDesign({ font })}
                  options={CV_FONTS}
                  render={(f) => (
                    <span className="flex items-center gap-2 pr-5">
                      <span className="text-2xl leading-none" style={{ fontFamily: f.family }} aria-hidden>
                        Aa
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium">{f.name}</span>
                        <span className="block text-xs leading-4 text-muted-foreground">{f.sample}</span>
                      </span>
                    </span>
                  )}
                />
              </div>
              <Segmented label="Text size" value={current.design.size} options={CV_OPTIONS.size} onChange={(size) => setDesign({ size })} />
              <Segmented label="Spacing" value={current.design.spacing} options={CV_OPTIONS.spacing} onChange={(spacing) => setDesign({ spacing })} />
              <Segmented label="Paper" value={current.design.paper} options={CV_OPTIONS.paper} onChange={(paper) => setDesign({ paper })} />
            </div>
          </Panel>

          <Panel title="Photo">
            <div className="flex flex-col gap-4">
              <Segmented label="Show" value={current.design.photo} options={CV_OPTIONS.photo} onChange={(photo) => setDesign({ photo })} />
              {current.design.photo === "profile" && !profile.data?.profile_image && (
                <p className="text-sm text-muted-foreground">
                  Your profile has no photo yet. <Link to="/dashboard/profile" className="font-medium text-foreground underline underline-offset-4">Add one</Link> or upload one just for this CV.
                </p>
              )}
              {current.design.photo === "upload" && (
                <div className="flex items-center gap-3">
                  {cv.data.photo ? (
                    <img src={cv.data.photo} alt="" className="size-16 shrink-0 rounded-lg border object-cover" />
                  ) : (
                    <span className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">None</span>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <label
                      htmlFor={photoInput}
                      className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border bg-background px-3.5 text-sm font-medium hover:bg-secondary has-focus-visible:outline-2 has-focus-visible:outline-primary-ink"
                    >
                      {uploading && <Loader2 className="size-3.5 animate-spin" />}
                      {cv.data.photo ? "Replace" : "Upload photo"}
                      <input
                        id={photoInput}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadPhoto(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {cv.data.photo && (
                      <Button type="button" variant="ghost" size="sm" onClick={removePhoto}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {current.design.photo !== "none" && (
                <Segmented label="Shape" value={current.design.photo_shape} options={CV_OPTIONS.photo_shape} onChange={(photo_shape) => setDesign({ photo_shape })} />
              )}
            </div>
          </Panel>

          <Panel title="Header" description="Name and contact details come from your profile.">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cv-headline">Headline on this CV</Label>
                <Input
                  id="cv-headline"
                  value={current.content.headline ?? ""}
                  maxLength={220}
                  placeholder={profile.data?.title || "e.g. Backend developer"}
                  onChange={(e) => setContent({ headline: e.target.value })}
                />
                <FieldHint>Leave empty to use your profile title.</FieldHint>
              </div>
              {contactFields.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Contact details shown</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Contact details shown">
                    {contactFields.map((f) => {
                      const on = !hidden.has(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setContent({ hide_contact: on ? [...hidden, f.id] : [...hidden].filter((h) => h !== f.id) })}
                          className={cn(
                            "inline-flex min-h-9 items-center rounded-full border px-3 text-sm transition",
                            on ? "border-primary/40 bg-accent text-accent-foreground" : "bg-background text-muted-foreground line-through"
                          )}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Sections" description="Reorder, rename or hide sections, choose entries, and add your own (publications, awards, references…). Empty sections are left out.">
            <ol className="divide-y overflow-hidden rounded-xl border">
              {sections.map((s, i) => (
                <SectionRow
                  key={s.id}
                  section={s}
                  index={i}
                  count={sections.length}
                  content={current.content}
                  setContent={setContent}
                  onMove={(step) => moveSection(i, step)}
                  onChange={(patch) => setSections(sections.map((x) => (x.id === s.id ? { ...x, ...patch } : x)))}
                  onRemove={() => setSections(sections.filter((x) => x.id !== s.id))}
                />
              ))}
            </ol>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              disabled={customCount >= MAX_CUSTOM_SECTIONS}
              onClick={() => setSections([...sections, { id: newCustomSectionId(), visible: true, title: "", body: "" }])}
            >
              <Plus /> Add a section
            </Button>
          </Panel>

          <Panel title="Details">
            <div className="flex flex-col gap-5">
              <Segmented label="Dates" value={current.design.dates} options={CV_OPTIONS.dates} onChange={(dates) => setDesign({ dates })} />
              <Segmented label="Skills" value={current.design.skills_style} options={CV_OPTIONS.skills_style} onChange={(skills_style) => setDesign({ skills_style })} />
              <ul className="divide-y overflow-hidden rounded-xl border">
                {CV_FLAGS.map((f) => (
                  <li key={f.id} className="flex min-h-14 items-center justify-between gap-3 bg-background px-4">
                    <span className="text-sm">{f.label}</span>
                    <Switch checked={current.design[f.id]} label={f.label} onChange={(on) => setDesign({ [f.id]: on })} />
                  </li>
                ))}
              </ul>
              <Button type="button" variant="ghost" className="-ml-2 self-start px-2 text-muted-foreground" onClick={() => set({ design: { ...DEFAULT_DESIGN } })}>
                <RotateCcw /> Reset the design
              </Button>
            </div>
          </Panel>

          <Panel title="Name & sharing">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cv-name">Name</Label>
                <Input id="cv-name" value={current.name} maxLength={120} onChange={(e) => set({ name: e.target.value })} />
                <FieldHint>Only you see it.</FieldHint>
              </div>
              <ul className="divide-y overflow-hidden rounded-xl border">
                <li className="flex min-h-16 items-center justify-between gap-3 bg-background px-4 py-2">
                  <span className="text-sm">
                    <span className="block font-medium">Use on my portfolio</span>
                    <span className="block text-xs text-muted-foreground">The Download PDF button on your Résumé page</span>
                  </span>
                  <Switch
                    checked={current.is_default}
                    label="Use on my portfolio"
                    onChange={(on) => (on ? set({ is_default: true, is_public: true }) : toast({ title: "Make another CV the default instead" }))}
                  />
                </li>
                <li className="flex min-h-16 items-center justify-between gap-3 bg-background px-4 py-2">
                  <span className="text-sm">
                    <span className="block font-medium">Anyone with the link</span>
                    <span className="block text-xs text-muted-foreground">Off: only you can download it here</span>
                  </span>
                  <Switch checked={current.is_public} label="Anyone with the link can download" onChange={(on) => !current.is_default && set({ is_public: on })} />
                </li>
              </ul>
              {saved.is_public && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium">Link</p>
                  <CopyButton value={new URL(publicUrl, window.location.origin).href} className="self-start font-mono text-xs">
                    {publicUrl.replace(/^https?:\/\//, "")}
                  </CopyButton>
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                className="-ml-2 self-start px-2 text-muted-foreground"
                onClick={async () => {
                  try {
                    const { data } = await api.post(`/me/cvs/${id}/duplicate/`);
                    navigate(`/dashboard/cv/${data.id}`);
                    toast({ title: "Duplicated", description: "You're editing the copy." });
                  } catch (error) {
                    toastError("Couldn't duplicate", error);
                  }
                }}
              >
                <Copy /> Duplicate this CV
              </Button>
            </div>
          </Panel>
        </div>

        {/* scrolls on its own on desktop, so it must be reachable by keyboard */}
        <section
          tabIndex={0}
          aria-label="Preview"
          className={cn("rounded-lg lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:pb-24", tab === "edit" && "hidden lg:block")}
        >
          <Preview preview={preview} onRetry={() => setRetry((r) => r + 1)} />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="min-w-0 truncate text-sm text-muted-foreground" aria-live="polite">
            {dirty ? "You have unsaved changes" : "All changes saved"}
          </p>
          <div className="flex shrink-0 gap-2">
            {dirty && (
              <Button type="button" variant="outline" size="lg" className="px-4" disabled={saving} onClick={() => setDraft(null)}>
                Discard
              </Button>
            )}
            <Button type="button" size="lg" className="min-w-24 px-4" disabled={!dirty || saving} onClick={save}>
              {saving && <Loader2 className="animate-spin" />}
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
