import { Check, FileText, ImagePlus, Paperclip, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Checkbox, FieldError, FieldHint, Input, Label, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

/**
 * Renders a form from a field list:
 * { name, label, type, required, help, placeholder, options, wide, show(values) }
 * types: text, email, url, tel, textarea, number, date, checkbox, select,
 *        multiselect, image, file
 */
export const FormFields = ({ fields, values, errors = {}, onChange, disabled }) => (
  <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
    {fields
      .filter((field) => !field.show || field.show(values))
      .map((field) => (
        <FormField
          key={field.name}
          field={field}
          value={values[field.name]}
          error={errors[field.name]}
          disabled={disabled || field.readOnly}
          onChange={(value) => onChange(field.name, value)}
        />
      ))}
  </div>
);

const WIDE_TYPES = new Set(["textarea", "multiselect", "image", "file", "checkbox"]);

const FormField = ({ field, value, error, disabled, onChange }) => {
  const id = useId();
  const wide = field.wide ?? WIDE_TYPES.has(field.type);
  const describedBy = [field.help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    disabled,
    "aria-invalid": error ? true : undefined,
    "aria-required": field.required || undefined,
    "aria-describedby": describedBy,
  };

  if (field.type === "checkbox") {
    return (
      <div className={cn("flex flex-col gap-1.5", wide && "sm:col-span-2")}>
        <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background px-3 py-3">
          <Checkbox {...common} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{field.label}</span>
            {field.help && (
              <span id={`${id}-help`} className="text-xs text-muted-foreground">
                {field.help}
              </span>
            )}
          </span>
        </label>
        <FieldError id={`${id}-error`}>{error}</FieldError>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", wide && "sm:col-span-2")}>
      <Label htmlFor={id}>
        {field.label}
        {field.required && (
          <span aria-hidden className="text-primary">
            {" "}
            *
          </span>
        )}
      </Label>
      <FieldControl field={field} value={value} onChange={onChange} common={common} />
      {field.help && <FieldHint id={`${id}-help`}>{field.help}</FieldHint>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
};

const FieldControl = ({ field, value, onChange, common }) => {
  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          {...common}
          rows={field.rows ?? 4}
          value={value ?? ""}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "select":
      return (
        <Select {...common} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          {field.required ? (
            !value && (
              <option value="" disabled>
                Choose…
              </option>
            )
          ) : (
            <option value="">{field.emptyLabel ?? "—"}</option>
          )}
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
    case "multiselect":
      return <MultiSelect field={field} value={value ?? []} onChange={onChange} common={common} />;
    case "image":
    case "file":
      return <FileInput field={field} value={value} onChange={onChange} common={common} />;
    case "number":
      return (
        <Input
          {...common}
          type="number"
          inputMode="numeric"
          min={field.min ?? 0}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      );
    default:
      return (
        <Input
          {...common}
          type={field.type ?? "text"}
          value={value ?? ""}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          autoComplete={field.autoComplete}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
};

// Toggleable chips: easier than a <select multiple> on a phone
const MultiSelect = ({ field, value, onChange, common }) => {
  const selected = new Set(value);
  const toggle = (id) => onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);

  if (!field.options.length) {
    return (
      <p id={common.id} className="rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">
        {field.emptyText ?? "Nothing to choose from yet."}
      </p>
    );
  }
  return (
    <div id={common.id} role="group" aria-describedby={common["aria-describedby"]} className="flex flex-wrap gap-2">
      {field.options.map((o) => {
        const on = selected.has(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            disabled={common.disabled}
            onClick={() => toggle(o.value)}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition",
              on ? "border-primary/40 bg-accent text-accent-foreground" : "bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {on && <Check className="size-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
};

const fileName = (value) => {
  if (value instanceof File) return value.name;
  try {
    return decodeURIComponent(new URL(value, window.location.href).pathname.split("/").pop());
  } catch {
    return String(value);
  }
};

const usePreviewUrl = (value) => {
  const [preview, setPreview] = useState({ file: null, url: null });
  useEffect(() => {
    if (!(value instanceof File) || !value.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setPreview({ file: value, url: reader.result });
    reader.readAsDataURL(value);
    return () => reader.abort();
  }, [value]);
  if (value instanceof File) return preview.file === value ? preview.url : null;
  return typeof value === "string" && value ? value : null;
};

// value: URL string (saved file), File (picked, not uploaded yet) or null
const FileInput = ({ field, value, onChange, common }) => {
  const isImage = field.type === "image";
  const preview = usePreviewUrl(value);
  const Icon = isImage ? ImagePlus : Paperclip;

  return (
    <div className="flex flex-col gap-3">
      {value && (
        <div className="flex items-center gap-3 rounded-lg border bg-background p-2.5">
          {isImage && preview ? (
            <img src={preview} alt="" className="size-14 shrink-0 rounded-md border object-cover" />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </span>
          )}
          <div className="min-w-0 flex-1 text-sm">
            {typeof value === "string" ? (
              <a href={value} target="_blank" rel="noreferrer" className="block truncate font-medium hover:underline">
                {fileName(value)}
              </a>
            ) : (
              <p className="truncate font-medium">{fileName(value)}</p>
            )}
            <p className="text-xs text-muted-foreground">{value instanceof File ? "Uploads when you save" : "Current file"}</p>
          </div>
          {!field.required && (
            <button
              type="button"
              disabled={common.disabled}
              onClick={() => onChange(null)}
              aria-label={`Remove ${field.label}`}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}
      <label
        htmlFor={common.id}
        className={cn(
          "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed bg-background px-3 py-2.5 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground",
          common["aria-invalid"] && "border-destructive"
        )}
      >
        <Icon className="size-4" />
        {value ? "Replace" : isImage ? "Choose an image" : "Choose a file"}
      </label>
      <input
        {...common}
        type="file"
        accept={field.accept ?? (isImage ? "image/*" : undefined)}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
          e.target.value = ""; // allow picking the same file again after removing it
        }}
      />
    </div>
  );
};
