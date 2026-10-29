import { Choices } from "@/dashboard/components/Choices";
import { Segmented } from "@/dashboard/components/cv/Pickers";
import { CV_OPTIONS, PAPER, inkOf, sidebarOf } from "@/lib/cv";
import { cn } from "@/lib/utils";

// Tiny page wireframes so each layout is recognisable at a glance
const Bar = ({ className }) => <span className={cn("block rounded-[1px] bg-current", className)} />;
const Lines = ({ n = 4 }) => (
  <span className="flex flex-1 flex-col gap-1">
    {Array.from({ length: n }).map((_, i) => (
      <Bar key={i} className={cn("h-1 opacity-30", i % 3 === 2 && "w-2/3")} />
    ))}
  </span>
);
const Side = () => (
  <span className="flex w-1/3 flex-col gap-1 rounded-sm bg-current/15 p-1">
    <span className="mx-auto mb-0.5 size-2.5 rounded-full bg-current opacity-40" />
    <Bar className="h-0.5 opacity-40" />
    <Bar className="h-0.5 opacity-40" />
  </span>
);
const SKETCH = {
  auto: (
    <span className="flex h-full items-center justify-center font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">template</span>
  ),
  one: (
    <span className="flex h-full flex-col gap-1">
      <Bar className="h-1.5 w-1/2 opacity-60" />
      <Lines />
    </span>
  ),
  left: (
    <span className="flex h-full gap-1.5">
      <Side />
      <Lines />
    </span>
  ),
  right: (
    <span className="flex h-full gap-1.5">
      <Lines />
      <Side />
    </span>
  ),
};

/** A section title drawn the way each heading style draws it, in the CV's accent (on white, like the PDF). */
const HeadingSample = ({ style, accent }) => {
  const word = "Experience";
  const tone = { color: inkOf(accent) };
  switch (style) {
    case "caps":
      return <span className="font-mono text-[0.65rem] font-semibold tracking-[0.14em] uppercase" style={tone}>{word}</span>;
    case "line":
      return (
        <span className="block border-b pb-0.5 text-[0.65rem] font-semibold tracking-[0.14em] uppercase" style={{ ...tone, borderColor: accent }}>
          {word}
        </span>
      );
    case "underline":
      return (
        <span className="border-b-2 pb-0.5 text-sm font-semibold" style={{ ...tone, borderColor: accent }}>
          {word}
        </span>
      );
    case "bar":
      return (
        <span className="border-l-4 pl-1.5 text-sm font-bold" style={{ borderColor: accent, color: PAPER.text }}>
          {word}
        </span>
      );
    case "block":
      return (
        <span className="block rounded-sm px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-[0.12em] uppercase" style={{ ...tone, background: `${accent}22` }}>
          {word}
        </span>
      );
    case "serif":
      return <span className="font-heading text-lg leading-none" style={tone}>{word}</span>;
    default:
      return <span className="text-xs" style={{ color: PAPER.muted }}>As the template draws it</span>;
  }
};

/** Layout options that work on top of any template (design.layout, heading_style…). */
export const LayoutPanelBody = ({ template, design, setDesign }) => {
  const sidebar = sidebarOf(template, design);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-medium">Columns</p>
        <Choices
          name="layout"
          value={design.layout}
          onChange={(layout) => setDesign({ layout })}
          options={CV_OPTIONS.layout}
          columns="grid-cols-2"
          render={(o) => (
            <>
              <span className="block h-12 rounded-md border bg-card p-1.5 text-foreground">{SKETCH[o.id]}</span>
              <span className="pr-5">
                <span className="block font-medium">{o.name}</span>
                <span className="block text-xs leading-4 text-muted-foreground">{o.hint}</span>
              </span>
            </>
          )}
        />
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {sidebar
            ? "Choose which sections sit in the sidebar under Content → Sections."
            : "Any template can have a sidebar: it holds your photo, contact details and the sections you place there."}
        </p>
      </div>
      {sidebar && (
        <>
          <Segmented label="Sidebar width" value={design.sidebar_width} options={CV_OPTIONS.sidebar_width} onChange={(sidebar_width) => setDesign({ sidebar_width })} />
          <Segmented label="Sidebar colour" value={design.sidebar_style} options={CV_OPTIONS.sidebar_style} onChange={(sidebar_style) => setDesign({ sidebar_style })} />
        </>
      )}
      <div>
        <p className="mb-2 text-sm font-medium">Section titles</p>
        <Choices
          name="heading_style"
          value={design.heading_style}
          onChange={(heading_style) => setDesign({ heading_style })}
          options={CV_OPTIONS.heading_style}
          columns="grid-cols-2"
          render={(o) => (
            <>
              <span className="flex h-10 items-center rounded-md border px-2.5" style={{ background: PAPER.background }}>
                <span className="w-full min-w-0">
                  <HeadingSample style={o.id} accent={design.accent} />
                </span>
              </span>
              <span className="pr-5 font-medium">{o.name}</span>
            </>
          )}
        />
      </div>
      <Segmented label="Name and contact" value={design.header_align} options={CV_OPTIONS.header_align} onChange={(header_align) => setDesign({ header_align })} />
      <Segmented label="Page margins" value={design.margins} options={CV_OPTIONS.margins} onChange={(margins) => setDesign({ margins })} />
    </div>
  );
};
