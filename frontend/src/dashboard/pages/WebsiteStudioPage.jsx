import { ArrowDown, ArrowUp, Bold, ChevronDown, Download, FileUp, Italic, Laptop, List, Loader2, Plus, Redo2, Save, Smartphone, Tablet, Trash2, Undo2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { FieldHint, FormAlert, Input, Label, Textarea } from "@/components/ui/form";
import { WebsiteStudioDesign } from "@/dashboard/components/WebsiteStudioDesign";
import { Switch } from "@/dashboard/components/Choices";
import { ListSkeleton, LoadError, PageHeader, Panel } from "@/dashboard/components/Page";
import { saveBlob } from "@/dashboard/lib/download";
import { parseApiError } from "@/dashboard/lib/records";
import { useHistory } from "@/dashboard/lib/useHistory";
import { useResource } from "@/dashboard/lib/useResource";
import { cn } from "@/lib/utils";

const DRAFT_URL = "/me/website-draft/";
const MAX_SECTIONS = 20;
const devices = [
  { id: "desktop", label: "Desktop", icon: Laptop, width: 1280, height: 1000 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: 768, height: 920 },
  { id: "phone", label: "Phone", icon: Smartphone, width: 390, height: 760 },
];

const Field = ({ label, children }) => {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
    </div>
  );
};

const SitePreview = ({ html, waiting, error, retry, device, setDevice, className }) => {
  const box = useRef(null);
  const [available, setAvailable] = useState(0);
  const { width, height } = devices.find(({ id }) => id === device);
  const scale = Math.min(1, (available || width) / width);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width) setAvailable(entry.contentRect.width);
    });
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);
  return (
    <Panel
      title="Live preview"
      action={
        <div className="flex gap-1" role="group" aria-label="Preview width">
          {devices.map((option) => (
            <Button key={option.id} type="button" variant={device === option.id ? "secondary" : "ghost"} size="icon" onClick={() => setDevice(option.id)} aria-label={`${option.label} preview`} aria-pressed={device === option.id} title={option.label}><option.icon /></Button>
          ))}
        </div>
      }
      className={cn("min-w-0 overflow-hidden bg-muted/25 xl:sticky xl:top-4", className)}
    >
      <div className="mb-3 flex flex-wrap justify-between gap-x-3 text-xs text-muted-foreground">
        <span role="status">{waiting ? "Updating preview…" : html && !error ? "Preview is up to date" : ""}</span>
        <span>{width} px viewport</span>
      </div>
      {error && <LoadError onRetry={retry}>Couldn't update the preview.</LoadError>}
      <div ref={box} className="min-w-0">
        {html ? (
          <div className="mx-auto overflow-hidden rounded-2xl border bg-muted/30 shadow-sm" style={{ width: width * scale, height: height * scale }}>
            <iframe
              title="Website draft preview"
              srcDoc={html}
              sandbox=""
              className="block border-0"
              style={{ width, height, transform: `scale(${scale})`, transformOrigin: "0 0" }}
            />
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-xl border bg-muted/30" aria-busy={waiting}>
            {waiting && <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />}
          </div>
        )}
      </div>
    </Panel>
  );
};

const SectionEditor = ({ section, index, count, patch, move, remove }) => {
  const textarea = useRef(null);
  const format = (style) => {
    const field = textarea.current;
    const { selectionStart: start, selectionEnd: end } = field;
    const value = section.body;
    const from = style === "bullet" ? (start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1) : start;
    const selected = value.slice(from, end);
    const marker = style === "bold" ? "**" : "*";
    const formatted = style === "bullet"
      ? selected.split("\n").map((line) => line.startsWith("- ") ? line : "- " + line).join("\n")
      : marker + selected + marker;
    const body = value.slice(0, from) + formatted + value.slice(end);
    if (body.length > field.maxLength) return;
    patch({ body });
    requestAnimationFrame(() => {
      field.focus();
      const caret = from + (style === "bullet" ? formatted.length : marker.length);
      field.setSelectionRange(caret, style === "bullet" ? caret : caret + selected.length);
    });
  };
  return (
    <details className="group rounded-xl border bg-background open:border-border open:shadow-xs">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1 break-words">{section.title || "Untitled section"}</span>
        {!section.visible && <span className="text-xs text-muted-foreground">Hidden</span>}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="grid gap-4 border-t p-4">
        <Field label="Section title">
          {(id) => <Input id={id} value={section.title} maxLength={100} onChange={(event) => patch({ title: event.target.value }, "title")} />}
        </Field>
        <Field label="Section text">
          {(id) => (
            <div className="overflow-hidden rounded-xl border">
              <div className="flex gap-1 border-b bg-muted/40 px-1 py-0.5" role="group" aria-label="Text formatting">
                {[{ id: "bold", label: "Bold", icon: Bold }, { id: "italic", label: "Italic", icon: Italic }, { id: "bullet", label: "Bullet list", icon: List }].map((option) => (
                  <Button key={option.id} type="button" size="icon" variant="ghost" aria-label={option.label} title={option.label} onMouseDown={(event) => event.preventDefault()} onClick={() => format(option.id)}><option.icon /></Button>
                ))}
              </div>
              <Textarea ref={textarea} id={id} rows={7} value={section.body} maxLength={12000} onChange={(event) => patch({ body: event.target.value }, "body")} className="rounded-none border-0 shadow-none focus-visible:ring-inset" />
            </div>
          )}
        </Field>
        <FieldHint>Use a blank line for paragraphs, “- ” for bullets, and **text** for bold.</FieldHint>
        <div className="flex flex-wrap items-center gap-2">
          <Switch checked={section.visible} onChange={(visible) => patch({ visible })} label={`Show ${section.title || "untitled section"}`} />
          <span className="mr-auto text-xs text-muted-foreground">Show on website</span>
          <Button type="button" size="icon" variant="ghost" aria-label="Move section up" disabled={index === 0} onClick={() => move(-1)}><ArrowUp /></Button>
          <Button type="button" size="icon" variant="ghost" aria-label="Move section down" disabled={index === count - 1} onClick={() => move(1)}><ArrowDown /></Button>
          <Button type="button" size="icon" variant="ghost" aria-label="Delete section" onClick={remove}><Trash2 /></Button>
        </div>
      </div>
    </details>
  );
};

const editorDraft = (data) => data && ({
  ...data,
  options: { spacing: "comfortable", ...data.options },
  sections: data.sections.map((section) => ({ ...section, key: crypto.randomUUID() })),
});

const requestDraft = (data) => ({
  ...data,
  sections: data.sections.map(({ title, body, visible }) => ({ title, body, visible })),
});

const Studio = ({ savedData, onSave }) => {
  const [saved, setSaved] = useState(() => editorDraft(savedData));
  const history = useHistory();
  const draft = history.draft ?? saved;
  const dirty = Boolean(history.draft && history.draft !== saved);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(null);
  const [revision, setRevision] = useState(0);
  const [device, setDevice] = useState(() => window.matchMedia("(max-width: 639px)").matches ? "phone" : "desktop");
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState("content");
  const [mobilePane, setMobilePane] = useState("edit");
  const fileInput = useRef(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!draft) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { data, headers } = await api.post(DRAFT_URL + "preview/", requestDraft(draft), {
          responseType: "text",
          signal: controller.signal,
        });
        const filename = /filename="([^"]+)"/.exec(headers["content-disposition"] ?? "")?.[1];
        if (!controller.signal.aborted) setPreview({ draft, revision, html: data, filename });
      } catch {
        if (!controller.signal.aborted) setPreview({ draft, revision, error: true });
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [draft, revision]);

  const importWord = async (file) => {
    if (!file || uploading || saving) return;
    setUploadError("");
    if (!/\.docx?$/i.test(file.name) || file.size > 5 * 1024 * 1024) {
      setUploadError("Choose a .doc or .docx file no larger than 5 MB.");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    try {
      const { data } = await api.post(DRAFT_URL + "import/", form);
      history.set(editorDraft(data.draft));
      setTab("content");
      setMobilePane("edit");
      setNotice(data.excluded_contact_details
        ? `Imported ${file.name}. Recognized contact and personal details were left out. Review all sections before sharing.`
        : `Imported ${file.name}. Review the name and sections before sharing.`);
    } catch (error) {
      setUploadError(parseApiError(error).message || "Couldn't import this Word document.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const { data } = await api.put(DRAFT_URL, requestDraft(draft));
      setSaved(editorDraft(data));
      onSave(data);
      history.reset();
      setNotice("Private draft saved.");
    } catch (error) {
      setSaveError(parseApiError(error).message || "Couldn't save the draft.");
    } finally {
      setSaving(false);
    }
  };

  const update = (patch, key) => history.set({ ...draft, ...patch }, key);
  const setOption = (key, value) => update({ options: { ...draft.options, [key]: value } }, key);
  const patchSection = (key, patch, field) => update({
    sections: draft.sections.map((section) => section.key === key ? { ...section, ...patch } : section),
  }, field && key + field);
  const moveSection = (index, step) => {
    const sections = [...draft.sections];
    const [section] = sections.splice(index, 1);
    sections.splice(index + step, 0, section);
    update({ sections });
  };

  const fresh = preview?.draft === draft && preview?.revision === revision;
  const locked = uploading || saving;
  const chooseFile = () => fileInput.current?.click();
  return (
    <>
      <PageHeader
        title="Website studio"
        description="Upload a Word CV, review the extracted sections, then customize and download your website."
        action={draft && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={locked} onClick={chooseFile}><FileUp /> Upload another CV</Button>
            <Button type="button" variant="outline" disabled={!dirty || locked} onClick={save}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />} Save draft
            </Button>
            <Button type="button" disabled={!fresh || !preview?.html || locked} onClick={() => saveBlob(
              new Blob([preview.html], { type: "text/html;charset=utf-8" }),
              preview.filename || "portfolio.html",
            )}><Download /> Download HTML</Button>
          </div>
        )}
      />
      <input ref={fileInput} type="file" accept=".doc,.docx" aria-label="Word CV" className="sr-only" tabIndex={-1} onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        importWord(file);
      }} />
      <FormAlert className="mb-4">{uploadError || saveError}</FormAlert>
      {notice && <p className="mb-4 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground" role="status">{notice}</p>}
      {!draft ? (
        <div className="grid overflow-hidden rounded-3xl border bg-card lg:grid-cols-[1fr_0.82fr]">
          <div className="p-5 sm:p-10 lg:p-12">
            <h2 className="max-w-lg text-3xl font-semibold tracking-tight sm:text-5xl">Turn your CV into a website</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Vega organizes your Word CV into editable sections. Choose a design, preview it, then download your site.</p>
            <div
              onDragOver={(event) => { event.preventDefault(); if (!locked) setDragging(true); }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (event.dataTransfer.files.length !== 1) {
                  setUploadError("Drop one Word CV at a time.");
                  return;
                }
                importWord(event.dataTransfer.files[0]);
              }}
              className={cn("mt-7 rounded-2xl border border-dashed bg-muted/35 p-4 transition sm:p-5", dragging && "border-primary-ink bg-accent")}
            >
              <Button type="button" size="lg" disabled={uploading} onClick={chooseFile} className="max-w-full">
                {uploading ? <Loader2 className="animate-spin" /> : <FileUp />} {uploading ? "Reading your CV…" : "Upload Word CV"}
              </Button>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Drop a .doc or .docx here, up to 5 MB.</p>
              {history.canRedo && (
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={history.redo} className="mt-3"><Redo2 /> Restore draft</Button>
              )}
            </div>
          </div>
          <div className="hidden min-w-0 items-center justify-center overflow-hidden border-l border-emerald-950/20 bg-[#102c2b] p-9 lg:flex" aria-hidden>
            <div className="w-full max-w-sm rotate-[-4deg] rounded-2xl border border-white/20 bg-[#edf5f0] p-5 text-[#18322d] shadow-xl">
              <div className="flex gap-1.5 border-b border-[#18322d]/15 pb-3"><i className="size-2 rounded-full bg-[#559481]" /><i className="size-2 rounded-full bg-[#559481]/60" /><i className="size-2 rounded-full bg-[#559481]/35" /></div>
              <div className="mt-5 h-2 w-14 rounded-full bg-[#559481]" />
              <div className="mt-3 h-7 w-4/5 rounded bg-[#18322d]" />
              <div className="mt-2 h-2 w-3/5 rounded-full bg-[#18322d]/25" />
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="grid h-16 content-end gap-2 rounded-lg bg-[#cfe4da] p-2"><span className="h-1.5 w-3/5 rounded-full bg-[#18322d]/60" /><span className="h-1 w-full rounded-full bg-[#18322d]/20" /></div>
                <div className="grid h-16 content-end gap-2 rounded-lg bg-white p-2"><span className="h-1.5 w-2/3 rounded-full bg-[#18322d]/60" /><span className="h-1 w-full rounded-full bg-[#18322d]/20" /></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
          <div className="sticky top-14 z-10 flex gap-2 rounded-xl border bg-background p-1 xl:hidden" role="group" aria-label="Studio workspace">
            <Button type="button" className="flex-1" variant={mobilePane === "edit" ? "secondary" : "ghost"} aria-pressed={mobilePane === "edit"} onClick={() => setMobilePane("edit")}>Edit</Button>
            <Button type="button" className="flex-1" variant={mobilePane === "preview" ? "secondary" : "ghost"} aria-pressed={mobilePane === "preview"} onClick={() => setMobilePane("preview")}>Preview</Button>
          </div>
          <Panel title="Edit website" className={cn("min-w-0", mobilePane === "preview" && "hidden xl:block")}>
            <div className="mb-4 flex items-center gap-1" role="group" aria-label="Website editing options">
              {[["content", "Content"], ["design", "Design"]].map(([item, label]) => (
                <Button key={item} type="button" variant={tab === item ? "secondary" : "ghost"} size="sm" aria-pressed={tab === item} onClick={() => setTab(item)}>{label}</Button>
              ))}
              <div className="ml-auto flex gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Undo" disabled={locked || !history.canUndo} onClick={history.undo}><Undo2 /></Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Redo" disabled={locked || !history.canRedo} onClick={history.redo}><Redo2 /></Button>
              </div>
            </div>
            <fieldset disabled={locked} className="grid min-w-0 gap-4">
              {tab === "content" ? (
                <>
                  <Field label="Name">
                    {(id) => <Input id={id} value={draft.name} maxLength={220} onChange={(event) => update({ name: event.target.value }, "name")} />}
                  </Field>
                  <Field label="Headline">
                    {(id) => <Input id={id} value={draft.headline} maxLength={220} onChange={(event) => update({ headline: event.target.value }, "headline")} />}
                  </Field>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium">Sections</h3>
                      <span className="text-xs text-muted-foreground">{draft.sections.filter((section) => section.visible && section.body.trim()).length} visible</span>
                    </div>
                    {draft.sections.map((section, index) => (
                      <SectionEditor
                        key={section.key}
                        section={section}
                        index={index}
                        count={draft.sections.length}
                        patch={(patch, field) => patchSection(section.key, patch, field)}
                        move={(step) => moveSection(index, step)}
                        remove={() => update({ sections: draft.sections.filter((item) => item.key !== section.key) })}
                      />
                    ))}
                  </div>
                  <Button type="button" variant="outline" disabled={draft.sections.length >= MAX_SECTIONS} onClick={() => update({
                    sections: [...draft.sections, { key: crypto.randomUUID(), title: "", body: "", visible: true }],
                  })}><Plus /> Add section</Button>
                </>
              ) : (
                <WebsiteStudioDesign options={draft.options} setOption={setOption} applyPreset={(preset) => update({ options: { ...draft.options, ...preset } })} />
              )}
            </fieldset>
          </Panel>
          <SitePreview
            html={preview?.html}
            waiting={!fresh}
            error={fresh && preview?.error}
            retry={() => setRevision((value) => value + 1)}
            device={device}
            setDevice={setDevice}
            className={mobilePane === "edit" && "hidden xl:block"}
          />
        </div>
      )}
    </>
  );
};

export const WebsiteStudioPage = () => {
  const resource = useResource(DRAFT_URL);
  if (resource.loading) return <ListSkeleton rows={4} />;
  if (resource.error) return <LoadError onRetry={resource.reload} />;
  return <Studio savedData={resource.data} onSave={resource.mutate} />;
};
