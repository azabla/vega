import { useId } from "react";
import { Choices } from "@/dashboard/components/Choices";
import { CV_ACCENTS, CV_TEMPLATES, templateOf } from "@/lib/cv";
import { cn } from "@/lib/utils";

/** A page of the template, drawn from the real renderer (see render_cv_thumbnails). */
export const TemplateThumb = ({ template, className }) => (
  <img
    src={templateOf(template).thumbnail}
    alt=""
    loading="lazy"
    className={cn("aspect-[210/297] w-full rounded-md border bg-white object-cover object-top", className)}
  />
);

export const TemplatePicker = ({ name, value, onChange, columns = "grid-cols-2 sm:grid-cols-3" }) => (
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

export const Segmented = ({ label, value, options, onChange }) => (
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

export const AccentPicker = ({ value, onChange }) => {
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
