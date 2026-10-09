import { ChevronDown, MapPin } from "lucide-react";
import { useId, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Reveal } from "@/components/ui/Reveal";
import { TagList } from "@/components/ui/Tag";
import { bulletsOf, formatDuration, formatYearRange } from "@/lib/format";
import { cn } from "@/lib/utils";

const PREVIEW_BULLETS = 2;

const Highlights = ({ text, compact }) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  const bullets = bulletsOf(text);

  if (!bullets) {
    return <p className={cn("mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground", compact && "line-clamp-3")}>{text}</p>;
  }
  const hidden = bullets.length - PREVIEW_BULLETS;
  const shown = open ? bullets : bullets.slice(0, PREVIEW_BULLETS);
  return (
    <>
      <ul id={id} className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
        {shown.map((line) => (
          <li key={line} className="flex gap-3">
            <span className="mt-2.5 size-1 shrink-0 rounded-full bg-primary-ink/70" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={id}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-ink"
        >
          {open ? "Show less" : `Show ${hidden} more`}
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
      )}
    </>
  );
};

/** One entry on the vertical timeline (see timelineFrom* in lib/portfolio). */
export const TimelineItem = ({ item, index = 0, last, compact, headingLevel = 3 }) => {
  const Heading = `h${headingLevel}`;
  return (
    <Reveal as="li" delay={Math.min(index, 4) * 70} className="relative grid grid-cols-[2.5rem_1fr] gap-x-4 pb-8 last:pb-0 md:grid-cols-[3rem_1fr] md:gap-x-6">
      {/* rail */}
      {!last && <span aria-hidden className="absolute top-12 bottom-0 left-5 w-px bg-border md:left-6" />}
      <Avatar src={item.logo} name={item.org} className="size-10 rounded-xl md:size-12" />

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-mono text-xs text-muted-foreground">
            {formatYearRange(item.start, item.end, item.current)}
            {item.start && <span> · {formatDuration(item.start, item.current ? null : item.end)}</span>}
          </p>
          {item.current && (
            <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-accent-foreground">Current</span>
          )}
        </div>
        <Heading className="font-heading mt-1.5 text-2xl leading-tight">{item.title}</Heading>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-medium text-primary-ink">{item.org}</span>
          {item.badge && <span className="text-muted-foreground">{item.badge}</span>}
          {item.location && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-3" aria-hidden /> {item.location}
            </span>
          )}
        </p>
        {item.description && <Highlights text={item.description} compact={compact} />}
        {!compact && item.skills.length > 0 && <TagList items={item.skills} max={8} className="mt-4" />}
      </div>
    </Reveal>
  );
};
