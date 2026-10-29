import { ArrowLeft, Copy, Download, FileText, LayoutTemplate, Loader2, Palette, Plus, Redo2, RotateCcw, Settings2, Type, Undo2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import { useAuth } from "@/auth/context";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/CopyButton";
import { FieldHint, Input, Label } from "@/components/ui/form";
import { Choices, Switch } from "@/dashboard/components/Choices";
import { CvPreview } from "@/dashboard/components/cv/CvPreview";
import { LayoutPanelBody } from "@/dashboard/components/cv/LayoutPanel";
import { AccentPicker, Segmented, TemplatePicker } from "@/dashboard/components/cv/Pickers";
import { SectionList } from "@/dashboard/components/cv/SectionList";
import { EmptyState, ListSkeleton, LoadError, PageHeader, Panel } from "@/dashboard/components/Page";
import { downloadCv, toastError } from "@/dashboard/lib/cvActions";
import { useCvPreview } from "@/dashboard/lib/useCvPreview";
import { useHistory } from "@/dashboard/lib/useHistory";
import { useResource } from "@/dashboard/lib/useResource";
import { toast } from "@/hooks/use-toast";
import {
  CONTACT_FIELDS,
  CV_FLAGS,
  CV_FONTS,
  CV_OPTIONS,
  CV_SECTIONS,
  DEFAULT_DESIGN,
  MAX_CUSTOM_SECTIONS,
  isCustomSection,
  newCustomSectionId,
  resolveDesign,
  resolveSections,
  sidebarOf,
} from "@/lib/cv";
import { cvSectionTitle } from "@/lib/professions";
import { resolveSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { portfolioFiles } from "@/services/portfolioAPI";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const toDraft = (cv) => ({
  name: cv.name,
  template: cv.template,
  design: resolveDesign(cv.design),
  content: cv.content ?? {},
  is_public: cv.is_public,
  is_default: cv.is_default,
});

const TABS = [
  { id: "design", label: "Design", icon: Palette },
  { id: "layout", label: "Layout", icon: LayoutTemplate },
  { id: "content", label: "Content", icon: Type },
  { id: "settings", label: "Settings", icon: Settings2 },
];

// Typing in a field (not a shortcut aimed at the page)
const isTextTarget = (el) => el?.closest?.("input, textarea, select, [contenteditable=true]");

export const CVEditorPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const cv = useResource(`/me/cvs/${id}/`);
  const profile = useResource("/me/profile/");
  const history = useHistory();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [retry, setRetry] = useState(0);
  const [view, setView] = useState("edit"); // phones: edit | preview
  const [tab, setTab] = useState("design");
  const [focus, setFocus] = useState(null); // {id, at}: a section clicked in the preview
  const photoInput = useId();
  const tabsId = useId();

  const saved = cv.data ? toDraft(cv.data) : null;
  const current = history.draft ?? saved;
  const dirty = Boolean(history.draft && saved && !same(history.draft, saved));
  const preview = useCvPreview(id, current, photoVersion + retry);
  const { undo, redo } = history;

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  // Ctrl/⌘+Z, Ctrl/⌘+Shift+Z or Ctrl+Y, except while typing (text fields have their own undo)
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey) || isTextTarget(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === "z" || key === "y") {
        e.preventDefault();
        if (key === "y" || e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  useEffect(() => {
    if (focus?.id === "header") {
      requestAnimationFrame(() => document.getElementById("cv-header-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [focus]);

  if (cv.loading) return <ListSkeleton rows={5} />;
  if (cv.error) {
    return cv.error.response?.status === 404 ? (
      <EmptyState icon={FileText} title="This CV doesn't exist" action={<Button href="/dashboard/cv">All CVs</Button>} />
    ) : (
      <LoadError onRetry={cv.reload} />
    );
  }

  const set = (patch, key) => history.set({ ...current, ...patch }, key);
  const setDesign = (patch, key) => set({ design: { ...current.design, ...patch } }, key);
  const setContent = (patch, key) => set({ content: { ...current.content, ...patch } }, key);
  const sections = resolveSections(current.template, current.content.sections);
  const setSections = (next, key) => setContent({ sections: next }, key);
  const customCount = sections.filter((s) => isCustomSection(s.id)).length;
  const hidden = new Set(current.content.hide_contact ?? []);
  const contactFields = CONTACT_FIELDS.filter((f) => profile.data?.[f.id]);
  const profession = profile.data ? resolveSettings(profile.data.settings).profession : "general";
  const publicUrl = portfolioFiles.cv(user.username, { slug: cv.data.slug });
  const sidebar = sidebarOf(current.template, current.design);

  const labelOf = (sid) => {
    if (sid === "header") return "name & contact";
    const s = sections.find((x) => x.id === sid);
    return s?.title || cvSectionTitle(profession, sid) || CV_SECTIONS[sid] || "section";
  };
  const pick = (sid) => {
    setTab("content");
    setView("edit");
    setFocus({ id: sid, at: Date.now() });
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/me/cvs/${id}/`, current);
      cv.mutate(data);
      history.reset();
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
        description="Changes show in the preview right away; click any part of the preview to edit it. Your profile stays the same: this only chooses what this CV shows and how."
        action={
          <Button type="button" variant="outline" size="lg" className="self-start px-3.5" disabled={dirty} title={dirty ? "Save first" : undefined} onClick={() => downloadCv(cv.data)}>
            <Download /> Download PDF
          </Button>
        }
      />

      <div className="sticky top-14 z-30 -mx-4 mb-4 flex gap-1 border-b bg-background/90 px-4 py-2 backdrop-blur lg:hidden" role="tablist" aria-label="Edit or preview">
        {[
          ["edit", "Edit"],
          ["preview", "Preview"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            onClick={() => setView(key)}
            className={cn("h-9 flex-1 rounded-full text-sm font-medium transition", view === key ? "bg-foreground text-background" : "text-muted-foreground")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div className={cn("flex flex-col gap-5 pb-24", view === "preview" && "hidden lg:flex")}>
          <div className="grid grid-cols-4 gap-1 rounded-xl border bg-card p-1" role="tablist" aria-label="Editor sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`${tabsId}-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`${tabsId}-${t.id}-panel`}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium transition sm:flex-row sm:gap-1.5 sm:text-sm",
                  tab === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <t.icon className="size-4" aria-hidden /> {t.label}
              </button>
            ))}
          </div>

          <div id={`${tabsId}-${tab}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`} className="flex flex-col gap-5">
            {tab === "design" && (
              <>
                <Panel title="Template" description="The look. Your content, layout and choices carry over when you switch.">
                  <TemplatePicker name="template" value={current.template} onChange={(template) => set({ template })} columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3" />
                </Panel>

                <Panel title="Colour & type">
                  <div className="flex flex-col gap-5">
                    <AccentPicker value={current.design.accent} onChange={(accent) => setDesign({ accent }, "accent")} />
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

                <Button type="button" variant="ghost" className="-ml-2 self-start px-2 text-muted-foreground" onClick={() => set({ design: { ...DEFAULT_DESIGN } })}>
                  <RotateCcw /> Reset the design and layout
                </Button>
              </>
            )}

            {tab === "layout" && (
              <Panel title="Layout" description="Works with every template: add or move a sidebar, restyle section titles, align the header.">
                <LayoutPanelBody template={current.template} design={current.design} setDesign={setDesign} />
              </Panel>
            )}

            {tab === "content" && (
              <>
                <div id="cv-header-panel" className="scroll-mt-32">
                  <Panel title="Header" description="Name and contact details come from your profile.">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cv-headline">Headline on this CV</Label>
                        <Input
                          id="cv-headline"
                          value={current.content.headline ?? ""}
                          maxLength={220}
                          placeholder={profile.data?.title || "e.g. Backend developer"}
                          onChange={(e) => setContent({ headline: e.target.value }, "headline")}
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
                </div>

                <Panel
                  title="Sections"
                  description="Drag to reorder. Open a section to rename it, write or rewrite its text for this CV, choose its entries and set its layout. Empty sections are left out."
                >
                  <SectionList
                    sections={sections}
                    setSections={setSections}
                    content={current.content}
                    setContent={setContent}
                    profession={profession}
                    sidebar={sidebar}
                    focus={focus}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    disabled={customCount >= MAX_CUSTOM_SECTIONS}
                    onClick={() => {
                      const sid = newCustomSectionId();
                      setSections([...sections, { id: sid, visible: true, title: "", body: "" }]);
                      setFocus({ id: sid, at: Date.now() });
                    }}
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
                  </div>
                </Panel>
              </>
            )}

            {tab === "settings" && (
              <Panel title="Name & sharing">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cv-name">Name</Label>
                    <Input id="cv-name" value={current.name} maxLength={120} onChange={(e) => set({ name: e.target.value }, "name")} />
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
            )}
          </div>
        </div>

        {/* scrolls on its own on desktop, so it must be reachable by keyboard */}
        <section
          tabIndex={0}
          aria-label="Preview"
          className={cn("rounded-lg lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:p-1 lg:pb-24", view === "edit" && "hidden lg:block")}
        >
          <CvPreview preview={preview} onRetry={() => setRetry((r) => r + 1)} onPick={pick} labelOf={labelOf} />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-1">
            <Button type="button" variant="ghost" size="icon-lg" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!history.canUndo} onClick={undo}>
              <Undo2 />
            </Button>
            <Button type="button" variant="ghost" size="icon-lg" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" disabled={!history.canRedo} onClick={redo}>
              <Redo2 />
            </Button>
            <p className="ml-1 min-w-0 truncate text-sm text-muted-foreground max-sm:sr-only" aria-live="polite">
              {dirty ? "You have unsaved changes" : "All changes saved"}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {dirty && (
              <Button type="button" variant="outline" size="lg" className="px-4" disabled={saving} onClick={history.reset}>
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
