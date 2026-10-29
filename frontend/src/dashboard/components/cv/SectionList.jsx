import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, GripVertical, PencilLine, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, FieldHint, Input, Label } from "@/components/ui/form";
import { Switch } from "@/dashboard/components/Choices";
import { Segmented } from "@/dashboard/components/cv/Pickers";
import { ListSkeleton, LoadError } from "@/dashboard/components/Page";
import { RichTextEditor } from "@/dashboard/components/RichTextEditor";
import { useResource } from "@/dashboard/lib/useResource";
import { CV_ITEM_SOURCES, CV_SECTIONS, OVERRIDE_KINDS, defaultItemIds, inSidebar, isCustomSection } from "@/lib/cv";
import { cvSectionTitle } from "@/lib/professions";
import { cn } from "@/lib/utils";

/** One entry's text rewritten for this CV only: a new title and/or body; empty = the profile's. */
const EntryRewrite = ({ kind, record, change, onChange }) => {
  const source = CV_ITEM_SOURCES[kind];
  const id = useId();
  const original = source.text(record) ?? "";
  const set = (patch) => {
    const next = { ...change, ...patch };
    if (!next.title) delete next.title;
    if (!next.body || next.body === original) delete next.body;
    onChange(Object.keys(next).length ? next : undefined);
  };
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-title`}>Title on this CV</Label>
        <Input id={`${id}-title`} value={change?.title ?? ""} maxLength={220} placeholder={source.title(record)} onChange={(e) => set({ title: e.target.value })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-body`}>Text on this CV</Label>
        <RichTextEditor
          id={`${id}-body`}
          label="Text on this CV"
          value={change?.body ?? original}
          maxLength={6000}
          placeholder="Nothing in your profile yet. Write it here for this CV."
          onChange={(body) => set({ body })}
        />
        <FieldHint>Only this CV changes; your profile and other CVs keep the original.</FieldHint>
      </div>
      {change && (
        <Button type="button" variant="ghost" size="sm" className="-ml-2 self-start text-muted-foreground" onClick={() => onChange(undefined)}>
          <RotateCcw /> Use the profile text
        </Button>
      )}
    </div>
  );
};

/** Which entries go on this CV (no choice = all; projects: featured), and per-entry rewrites. */
const EntryList = ({ kind, content, setContent }) => {
  const source = CV_ITEM_SOURCES[kind];
  const { data, loading, error, reload } = useResource(source.endpoint);
  const [editing, setEditing] = useState(null);
  if (loading) return <ListSkeleton rows={1} />;
  if (error) return <LoadError onRetry={reload} />;
  const records = data.filter(source.filter ?? (() => true));
  if (!records.length) return <p className="text-sm text-muted-foreground">Nothing in your profile yet.</p>;

  const value = content.items?.[kind];
  const picking = Array.isArray(value);
  const chosen = new Set(picking ? value : defaultItemIds(kind, records));
  const setItems = (ids) => {
    const items = { ...(content.items ?? {}) };
    if (ids === undefined) delete items[kind];
    else items[kind] = ids;
    setContent({ items }, `items:${kind}`);
  };
  const toggle = (rid) => setItems(chosen.has(rid) ? [...chosen].filter((x) => x !== rid) : [...chosen, rid]);
  const rewrites = content.overrides?.[kind] ?? {};
  const setRewrite = (rid, change) => {
    const overrides = { ...(content.overrides ?? {}), [kind]: { ...rewrites } };
    if (change) overrides[kind][rid] = change;
    else delete overrides[kind][rid];
    if (!Object.keys(overrides[kind]).length) delete overrides[kind];
    setContent({ overrides }, `rewrite:${kind}:${rid}`);
  };
  const canRewrite = OVERRIDE_KINDS.includes(kind);

  return (
    <div className="flex flex-col gap-2">
      <Segmented
        label="Entries"
        value={picking ? "pick" : "auto"}
        options={[
          { id: "auto", name: source.featuredByDefault ? "Featured" : "All" },
          { id: "pick", name: "Choose" },
        ]}
        onChange={(mode) => setItems(mode === "pick" ? [...chosen] : undefined)}
      />
      <ul className="divide-y overflow-hidden rounded-lg border" aria-label="Entries on this CV">
        {records.map((r) => {
          const rid = String(r.id);
          const on = chosen.has(r.id);
          const rewritten = Boolean(rewrites[rid]);
          return (
            <li key={r.id} className="bg-background">
              <div className="flex min-h-11 items-center gap-2 px-3 py-1.5">
                {picking ? (
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-sm">
                    <Checkbox checked={on} onChange={() => toggle(r.id)} />
                    <span className={cn("truncate", !on && "text-muted-foreground line-through")}>{source.label(r)}</span>
                  </label>
                ) : (
                  <span className={cn("min-w-0 flex-1 truncate text-sm", !on && "text-muted-foreground")}>{source.label(r)}</span>
                )}
                {rewritten && <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[0.7rem] font-medium text-accent-foreground">Rewritten</span>}
                {canRewrite && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-expanded={editing === rid}
                    aria-label={`Rewrite ${source.label(r)} for this CV`}
                    title="Rewrite for this CV"
                    onClick={() => setEditing(editing === rid ? null : rid)}
                  >
                    <PencilLine />
                  </Button>
                )}
              </div>
              {editing === rid && (
                <div className="px-3 pb-3">
                  <EntryRewrite kind={kind} record={r} change={rewrites[rid]} onChange={(change) => setRewrite(rid, change)} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const SectionRow = ({ section, index, count, open, onToggle, onMove, onChange, onRemove, content, setContent, profession, sidebar, drag }) => {
  const id = useId();
  const custom = isCustomSection(section.id);
  const defaultTitle = cvSectionTitle(profession, section.id) ?? CV_SECTIONS[section.id];
  const label = section.title || defaultTitle || "Custom section";
  const side = sidebar && inSidebar(section);

  return (
    <li
      id={`cv-section-${section.id}`}
      className={cn("scroll-mt-32 bg-background", !section.visible && "bg-muted/50", drag.over && "shadow-[inset_0_2px_0_var(--primary-ink)]")}
      {...drag.props}
    >
      <div className="flex min-h-14 items-center gap-1 px-1 py-2 sm:px-2">
        <span
          className="flex h-10 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
          title="Drag to reorder"
          aria-hidden
          {...drag.handle}
        >
          <GripVertical className="size-4" />
        </span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className={cn("flex min-h-10 min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-medium", !section.visible && "text-muted-foreground line-through")}
        >
          <span className="truncate">{label}</span>
          {side && <span className="shrink-0 rounded-full border px-1.5 text-[0.65rem] font-normal text-muted-foreground">sidebar</span>}
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
              placeholder={defaultTitle ?? "e.g. Publications, Awards, References"}
              onChange={(e) => onChange({ title: e.target.value }, "title")}
            />
          </div>
          {section.id === "summary" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-summary`}>Text for this CV</Label>
              <RichTextEditor
                id={`${id}-summary`}
                label="Summary for this CV"
                value={content.summary ?? ""}
                maxLength={4000}
                placeholder="Leave empty to use the About text from your profile."
                onChange={(summary) => setContent({ summary }, "summary")}
              />
            </div>
          )}
          {custom && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-body`}>Text</Label>
              <RichTextEditor
                id={`${id}-body`}
                label={`${label} text`}
                value={section.body ?? ""}
                maxLength={6000}
                placeholder="e.g. a list of publications, awards or references"
                onChange={(body) => onChange({ body }, "body")}
              />
            </div>
          )}
          {CV_ITEM_SOURCES[section.id] && <EntryList kind={section.id} content={content} setContent={setContent} />}

          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Layout</p>
            {sidebar && (
              <Segmented
                label="Place in"
                value={side ? "side" : "main"}
                options={[
                  { id: "main", name: "Main column" },
                  { id: "side", name: "Sidebar" },
                ]}
                onChange={(column) => onChange({ column })}
              />
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">
                Two columns
                <span className="block text-xs text-muted-foreground">Good for skills, languages and short lists</span>
              </span>
              <Switch checked={section.columns === 2} label="Two columns" onChange={(on) => onChange({ columns: on ? 2 : 1 })} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Start on a new page</span>
              <Switch checked={Boolean(section.break)} label="Start on a new page" onChange={(on) => onChange({ break: on })} />
            </div>
          </div>

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

/**
 * The CV's sections: drag (or the arrows) to reorder, expand to rename, write, pick entries and
 * set the layout. `focus` (a section id, from a click on the preview) opens and scrolls to that row.
 */
export const SectionList = ({ sections, setSections, content, setContent, profession, sidebar, focus }) => {
  // Open at first: new custom sections, and the section picked in the preview (if that brought us here)
  const [open, setOpen] = useState(
    () => new Set([...sections.filter((s) => isCustomSection(s.id) && !s.body).map((s) => s.id), focus?.id].filter(Boolean))
  );
  // armed: the row whose handle is held (only that row is draggable); from/over: the drag in progress
  const [drag, setDrag] = useState({ from: null, over: null, armed: null });

  // A section picked in the preview opens (adjusting state during render, not in an effect)…
  const [seen, setSeen] = useState(focus);
  if (focus !== seen) {
    setSeen(focus);
    if (focus?.id) setOpen((o) => new Set(o).add(focus.id));
  }
  // …and scrolls into view
  useEffect(() => {
    if (!focus?.id) return;
    requestAnimationFrame(() => document.getElementById(`cv-section-${focus.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [focus]);

  const move = (from, to) => {
    if (from === to || from == null || to == null) return;
    const next = [...sections];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setSections(next);
  };

  return (
    <ol className="divide-y overflow-hidden rounded-xl border">
      {sections.map((s, i) => (
        <SectionRow
          key={s.id}
          section={s}
          index={i}
          count={sections.length}
          open={open.has(s.id)}
          onToggle={() =>
            setOpen((o) => {
              const next = new Set(o);
              if (!next.delete(s.id)) next.add(s.id);
              return next;
            })
          }
          content={content}
          setContent={setContent}
          profession={profession}
          sidebar={sidebar}
          onMove={(step) => move(i, i + step)}
          onChange={(patch, key) => setSections(sections.map((x) => (x.id === s.id ? { ...x, ...patch } : x)), key && `section:${s.id}:${key}`)}
          onRemove={() => setSections(sections.filter((x) => x.id !== s.id))}
          drag={{
            over: drag.over === i && drag.from !== i,
            handle: { onPointerDown: () => setDrag((d) => ({ ...d, armed: i })), onPointerUp: () => setDrag((d) => ({ ...d, armed: null })) },
            props: {
              draggable: drag.armed === i,
              onDragStart: (e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", s.id);
                setDrag({ from: i, over: i, armed: i });
              },
              onDragOver: (e) => {
                if (drag.from == null) return;
                e.preventDefault();
                if (drag.over !== i) setDrag((d) => ({ ...d, over: i }));
              },
              onDrop: (e) => {
                e.preventDefault();
                move(drag.from, i);
              },
              onDragEnd: () => setDrag({ from: null, over: null, armed: null }),
            },
          }}
        />
      ))}
    </ol>
  );
};
