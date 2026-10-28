import { ArrowUpRight } from "lucide-react";
import { Img } from "@/components/ui/Img";
import { Tag } from "@/components/ui/Tag";
import { yearOf } from "@/lib/format";
import { cn } from "@/lib/utils";

/** One award, publication, exhibition, talk or grant: year, title (linked), where, who, and an optional image. */
export const AchievementItem = ({ item, showKind = false, compact = false, headingLevel = 3 }) => {
  const Heading = `h${headingLevel}`;
  return (
    <li className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:gap-x-6">
      <span className="pt-0.5 font-mono text-xs text-muted-foreground">{yearOf(item.date) ?? "—"}</span>
      <div className="min-w-0">
        {showKind && <Tag className="mb-2">{item.kind_display}</Tag>}
        <Heading className="font-medium break-words">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer" className="group inline-flex items-start gap-1 hover:text-primary-ink">
              {item.title}
              <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-muted-foreground group-hover:text-primary-ink" aria-label="(opens in a new tab)" />
            </a>
          ) : (
            item.title
          )}
        </Heading>
        {item.issuer && <p className="mt-0.5 text-sm break-words text-muted-foreground">{item.issuer}</p>}
        {item.authors && <p className="mt-0.5 text-sm break-words text-muted-foreground italic">{item.authors}</p>}
        {item.description && (
          <p className={cn("mt-2 text-sm leading-6 whitespace-pre-line text-muted-foreground", compact && "line-clamp-2")}>{item.description}</p>
        )}
      </div>
      {item.image && <Img src={item.image} alt="" ratio="4 / 3" className="col-start-2 mt-3 w-full max-w-60 rounded-xl border sm:col-start-3 sm:mt-0 sm:w-28" />}
    </li>
  );
};
