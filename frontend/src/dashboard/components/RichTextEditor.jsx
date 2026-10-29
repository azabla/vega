import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Check, Italic, Link2, Link2Off, List, RemoveFormatting, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { docToMarkup, markupToHtml } from "@/dashboard/lib/richtext";
import { cn } from "@/lib/utils";

const ToolButton = ({ label, active, onClick, children, disabled }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    aria-pressed={active}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()} // keep the selection in the editor
    onClick={onClick}
    className={cn(
      "inline-flex size-9 items-center justify-center rounded-md transition disabled:opacity-40 md:size-8",
      active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    )}
  >
    {children}
  </button>
);

/**
 * WYSIWYG editing for CV text: bold, italic, bullet lists and links, nothing else, because
 * that's all the PDF renders. `value` and `onChange` use the stored markup (dashboard/lib/richtext.js).
 */
export const RichTextEditor = ({ id, value, onChange, placeholder, maxLength, label, minHeight = "7rem" }) => {
  const emitted = useRef(value ?? "");
  const [linking, setLinking] = useState(false);
  const [href, setHref] = useState("");
  const linkId = useId();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        orderedList: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", protocols: ["http", "https"] },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: markupToHtml(value ?? ""),
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        class: "cv-rich min-w-0 px-3 py-2.5 text-base leading-6 outline-none md:text-sm",
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: e }) => {
      const markup = docToMarkup(e.getJSON());
      emitted.current = markup;
      onChange(markup);
    },
  });

  // Outside changes (undo, reset to profile) replace the content
  useEffect(() => {
    if (!editor || (value ?? "") === emitted.current) return;
    emitted.current = value ?? "";
    editor.commands.setContent(markupToHtml(value ?? ""), { emitUpdate: false });
  }, [editor, value]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? { bold: e.isActive("bold"), italic: e.isActive("italic"), list: e.isActive("bulletList"), link: e.isActive("link") }
        : {},
  });

  const openLink = () => {
    setHref(editor.getAttributes("link").href ?? "https://");
    setLinking(true);
  };
  const applyLink = () => {
    const url = href.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (/^https?:\/\/\S+\.\S+/.test(url)) chain.setLink({ href: url }).run();
    else chain.unsetLink().run();
    setLinking(false);
  };

  const length = (value ?? "").length;
  return (
    <div className="overflow-hidden rounded-lg border border-input bg-background shadow-xs transition focus-within:border-primary focus-within:ring-3 focus-within:ring-ring/40">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1" role="toolbar" aria-label="Formatting">
        <ToolButton label="Bold" active={state?.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton label="Italic" active={state?.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="size-4" />
        </ToolButton>
        <ToolButton label="Bullet list" active={state?.list} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="size-4" />
        </ToolButton>
        <ToolButton label={state?.link ? "Edit link" : "Add link"} active={state?.link || linking} onClick={openLink}>
          <Link2 className="size-4" />
        </ToolButton>
        {state?.link && (
          <ToolButton label="Remove link" onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}>
            <Link2Off className="size-4" />
          </ToolButton>
        )}
        <ToolButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <RemoveFormatting className="size-4" />
        </ToolButton>
        {maxLength && (
          <span className={cn("ml-auto pr-1.5 font-mono text-[0.7rem]", length > maxLength ? "text-destructive" : "text-muted-foreground")}>
            {length}/{maxLength}
          </span>
        )}
      </div>
      {linking && (
        <div className="flex items-center gap-1.5 border-b px-2 py-1.5">
          <label htmlFor={linkId} className="sr-only">
            Link address
          </label>
          <input
            id={linkId}
            type="url"
            autoFocus
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              } else if (e.key === "Escape") setLinking(false);
            }}
            placeholder="https://…"
            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-base outline-none focus-visible:border-primary md:text-sm"
          />
          <ToolButton label="Apply link" onClick={applyLink}>
            <Check className="size-4" />
          </ToolButton>
          <ToolButton label="Cancel" onClick={() => setLinking(false)}>
            <X className="size-4" />
          </ToolButton>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};
