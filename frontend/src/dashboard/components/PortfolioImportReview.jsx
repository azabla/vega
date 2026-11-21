import { ArrowRight, Check, ChevronDown, CircleAlert, ListChecks, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, FieldError, Input, Label, Select } from "@/components/ui/form";
import { FormFields } from "@/dashboard/components/FormFields";
import { Panel } from "@/dashboard/components/Page";
import {
  IMPORT_GROUPS, MAX_RECORDS, MAX_SKILLS, PROFILE_IMPORT_FIELDS, REVIEW_SECTIONS,
  entryErrors, groupSummary, newImportRow,
} from "@/dashboard/lib/portfolioImport";
import { cn } from "@/lib/utils";

const ProfileReview = ({ fields, current, change, locked }) => (
  <Panel title="Profile" description="Compare the CV with your live profile. Existing values are kept unless you choose to replace them.">
    <div className="grid gap-3 sm:grid-cols-2">
      {PROFILE_IMPORT_FIELDS.map((field) => {
        const entry = fields[field.name];
        const saved = current[field.name];
        const same = entry.value.trim() === saved.trim();
        return (
          <div key={field.name} className={cn("min-w-0 rounded-xl border bg-background p-4", field.name === "bio" && "sm:col-span-2")}>
            <FormFields
              fields={[{ ...field, wide: true }]} values={{ [field.name]: entry.value }}
              onChange={(_, value) => change(field.name, { value })} disabled={locked}
            />
            {saved && !same && (
              <details className="mt-2 min-w-0 text-xs text-muted-foreground">
                <summary className="cursor-pointer py-1 font-medium">Current {field.label.toLowerCase()}</summary>
                <p className="mt-1 whitespace-pre-wrap break-words">{saved}</p>
              </details>
            )}
            <label className="mt-3 flex min-h-8 items-center gap-2 text-sm">
              <Checkbox
                checked={entry.included && Boolean(entry.value.trim()) && !same} disabled={locked || !entry.value.trim() || same}
                onChange={(event) => change(field.name, { included: event.target.checked })}
              />
              <span>{same && saved ? "Already on portfolio" : `Use this ${field.label.toLowerCase()}`}</span>
            </label>
          </div>
        );
      })}
    </div>
  </Panel>
);

const ImportEntry = ({ row, group, change, remove, locked }) => {
  const [open, setOpen] = useState(Boolean(row.openOnAdd));
  const panel = useId();
  const errors = entryErrors(group, row.values);
  const issues = Object.keys(errors).length;
  const title = row.values[group.fields[0].name].trim() || `New ${group.singular}`;
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="flex min-w-0 items-center gap-3 px-3 py-2.5 sm:px-4">
        <Checkbox
          aria-label={`Include ${title}`}
          checked={row.included && !issues}
          onChange={(event) => change({ included: event.target.checked })}
          disabled={locked || Boolean(issues)}
        />
        <button
          type="button" className="flex min-h-10 min-w-0 flex-1 items-center justify-between gap-3 text-left"
          aria-expanded={open} aria-controls={panel} onClick={() => setOpen(!open)}
        >
          <span className="min-w-0">
            <span className="block break-words text-sm font-medium">{title}</span>
            <span className={cn("mt-0.5 block text-xs", issues ? "text-amber-800 dark:text-amber-300" : "text-muted-foreground")}>
              {issues ? `${issues} ${issues === 1 ? "detail" : "details"} to complete` : row.included ? "Selected" : "Skipped"}
            </span>
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </div>
      {open && (
        <div id={panel} className="grid gap-4 border-t bg-muted/20 p-4">
          <FormFields
            fields={group.fields} values={row.values} errors={errors} disabled={locked}
            onChange={(name, value) => change({
              values: { ...row.values, [name]: value, ...(name === "current" && value ? { end_date: "" } : {}) },
            })}
          />
          <Button type="button" variant="ghost" size="sm" className="justify-self-start text-muted-foreground" disabled={locked} onClick={remove}>
            <Trash2 /> Remove from review
          </Button>
        </div>
      )}
    </div>
  );
};

const GroupSelection = ({ summary, toggleAll, locked }) => (
  <div className="flex flex-wrap items-center gap-1">
    <Button type="button" variant="ghost" size="sm" disabled={locked || summary.ready === summary.selected} onClick={() => toggleAll(true)}>Select ready</Button>
    <Button type="button" variant="ghost" size="sm" disabled={locked || !summary.selected} onClick={() => toggleAll(false)}>Skip all</Button>
  </div>
);

const RecordGroup = ({ group, rows, change, locked }) => {
  const summary = groupSummary(group, rows);
  return (
    <Panel title={group.label} description={summary.total ? `${summary.selected} selected · ${summary.total - summary.ready} need details` : "No entries found in this CV."}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <GroupSelection summary={summary} locked={locked} toggleAll={(included) => change(rows.map((row) => ({ ...row, included })))} />
        <Button
          type="button" variant="outline" size="sm" disabled={locked || rows.length >= MAX_RECORDS}
          onClick={() => change([{ ...newImportRow(group), openOnAdd: true }, ...rows])}
        ><Plus /> Add {group.singular}</Button>
      </div>
      <div className="grid gap-2.5">
        {rows.map((row) => (
          <ImportEntry key={row.id} row={row} group={group} locked={locked}
            change={(patch) => change(rows.map((item) => item.id === row.id ? { ...item, ...patch } : item))}
            remove={() => change(rows.filter((item) => item.id !== row.id))}
          />
        ))}
      </div>
    </Panel>
  );
};

const SkillReview = ({ group, rows, change, locked }) => {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const input = useId();
  const summary = groupSummary(group, rows);
  const add = (event) => {
    event.preventDefault();
    const seen = new Set(rows.map((row) => row.values.name.toLowerCase()));
    const additions = [];
    for (const name of text.split(/[,;]+/).map((word) => word.trim()).filter(Boolean)) {
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      additions.push({ id: crypto.randomUUID(), included: true, values: { name } });
    }
    if (additions.some((row) => Object.keys(entryErrors(group, row.values)).length)) {
      setError("Use skill names of up to 100 characters.");
      return;
    }
    if (rows.length + additions.length > MAX_SKILLS) {
      setError(`Choose up to ${MAX_SKILLS} skills per import.`);
      return;
    }
    setError("");
    setText("");
    change([...rows, ...additions]);
  };
  return (
    <Panel title="Skills" description={summary.total ? `${summary.selected} of ${summary.total} selected` : "No skills found in this CV."}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <GroupSelection summary={summary} locked={locked} toggleAll={(included) => change(rows.map((row) => ({ ...row, included })))} />
      </div>
      <ul className="mb-5 flex flex-wrap gap-2">
        {rows.map((row) => (
          <li key={row.id} className="max-w-full">
            <button
              type="button" aria-pressed={row.included} disabled={locked}
              className={cn("inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-left text-sm transition hover:bg-muted", row.included && "border-primary/30 bg-accent text-accent-foreground")}
              onClick={() => change(rows.map((item) => item.id === row.id ? { ...item, included: !item.included } : item))}
            >
              {row.included && <Check className="size-3.5 shrink-0" aria-hidden />}
              <span className="min-w-0 break-words">{row.values.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <form className="grid gap-2" onSubmit={add}>
        <Label htmlFor={input}>Add skills</Label>
        <div className="flex items-start gap-2">
          <Input id={input} value={text} placeholder="Python, research, project management" disabled={locked} onChange={(event) => setText(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${input}-error` : undefined} />
          <Button type="submit" size="lg" variant="outline" disabled={locked || !text.trim()}><Plus /> Add</Button>
        </div>
        <FieldError id={`${input}-error`}>{error}</FieldError>
      </form>
    </Panel>
  );
};

export const ReviewNavigator = ({ active, select, summaries, profileCount }) => (
  <>
    <label className="grid gap-2 rounded-xl border bg-card p-3 text-sm font-medium xl:hidden">
      <span className="sr-only">Review section</span>
      <Select aria-label="Review section" value={active} onChange={(event) => select(event.target.value)}>
        {REVIEW_SECTIONS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
      </Select>
    </label>
    <nav aria-label="Review sections" className="hidden gap-1 rounded-2xl border bg-card p-2 xl:grid">
      {REVIEW_SECTIONS.map((section) => {
        const selected = section.key === active;
        const summary = summaries[section.key];
        return (
          <button key={section.key} type="button" aria-current={selected ? "step" : undefined}
            className={cn("flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-left text-sm hover:bg-muted", selected && "bg-accent font-medium text-accent-foreground")}
            onClick={() => select(section.key)}
          >
            <section.icon className="size-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">{section.label}</span>
            {summary && summary.total > summary.ready && <CircleAlert className="size-3.5 shrink-0 text-amber-700 dark:text-amber-300" aria-label="Needs details" />}
            <span className="min-w-5 text-right text-xs tabular-nums text-muted-foreground">
              {section.key === "profile" ? profileCount : summary.selected}
            </span>
          </button>
        );
      })}
    </nav>
  </>
);

export const ReviewEditor = ({ active, review, current, changeProfile, changeRows, locked }) => {
  if (active === "profile") return <ProfileReview fields={review.profile} current={current} change={changeProfile} locked={locked} />;
  const group = IMPORT_GROUPS.find(({ key }) => key === active);
  const Group = active === "skills" ? SkillReview : RecordGroup;
  return <Group group={group} rows={review.entries[active]} change={(rows) => changeRows(active, rows)} locked={locked} />;
};

export const CompletionSuggestions = ({ current, existing, summaries, proposedTitle, proposedBio, choose, finished = false }) => {
  const heading = useId();
  const suggestions = [
    ...IMPORT_GROUPS.filter(({ key }) => summaries[key].total > summaries[key].ready).map(({ key, label, href }) => ({
      key, href, text: `Complete ${label.toLowerCase()} entries with missing details.`,
    })),
    ...(!proposedTitle && !current.title ? [{ key: "profile", href: "/dashboard/profile", text: "Add a clear headline." }] : []),
    ...(!proposedBio && !current.bio ? [{ key: "profile", href: "/dashboard/profile", text: "Write a short introduction." }] : []),
    ...(!existing.projects && !summaries.projects.selected ? [{ key: "projects", href: "/dashboard/projects", text: "Add work that shows what you can do." }] : []),
    ...(!existing.experience && !summaries.experience.total ? [{ key: "experience", href: "/dashboard/experience", text: "Add work, volunteering, or an internship." }] : []),
    ...(!existing.education && !summaries.education.selected ? [{ key: "education", href: "/dashboard/education", text: "Add education or training." }] : []),
    ...(!existing.skills && !summaries.skills.selected ? [{ key: "skills", href: "/dashboard/skills", text: "Add skills you can demonstrate." }] : []),
    ...(!current.has_photo ? [{ href: "/dashboard/profile", text: "Add a profile photo." }] : []),
    ...(!current.has_links ? [{ href: "/dashboard/profile", text: "Add a link to your work or professional profile." }] : []),
  ];
  if (!suggestions.length) return null;
  return (
    <aside className="rounded-2xl border bg-muted/35 p-4 lg:p-5" aria-labelledby={heading}>
      <h2 id={heading} className="flex items-center gap-2 text-sm font-semibold">
        <ListChecks className="size-4 text-primary-ink" aria-hidden /> What to complete
      </h2>
      <ul className="mt-3 grid gap-2.5 text-sm leading-5 text-muted-foreground">
        {suggestions.map(({ key, href, text }) => (
          <li key={text}>
            {!key || (finished && (!summaries[key] || summaries[key].total === summaries[key].ready)) ? (
              <a href={href} target={finished ? undefined : "_blank"} rel={finished ? undefined : "noreferrer"} className="inline-flex items-start gap-1.5 hover:text-foreground hover:underline">
                <span>{text}</span><ArrowRight className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              </a>
            ) : (
              <button type="button" className="inline-flex items-start gap-1.5 text-left hover:text-foreground hover:underline" onClick={() => choose(key)}>
                <span>{text}</span><ArrowRight className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};
