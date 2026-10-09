import { Img } from "@/components/ui/Img";
import { hashOf, initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Cover for a project without a thumbnail: the theme's accent, a grid and initials. */
export const GeneratedCover = ({ title = "", className }) => {
  const angle = 120 + (hashOf(title) % 90);
  return (
    <div
      aria-hidden
      className={cn("relative size-full overflow-hidden", className)}
      style={{
        background: `linear-gradient(${angle}deg, color-mix(in oklab, var(--primary) 26%, var(--card)), color-mix(in oklab, var(--primary) 8%, var(--background)))`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to bottom left, #000, transparent 80%)",
        }}
      />
      <span className="font-heading absolute right-5 bottom-3 text-6xl leading-none text-primary-ink/80 md:text-7xl">
        {initialsOf(title)}
      </span>
    </div>
  );
};

/** The uploaded thumbnail in a fixed-ratio box, or a generated cover. `ratio={null}` fills the parent. */
export const ProjectCover = ({ project, ratio = "16 / 9", className, eager }) => (
  <Img
    src={project.thumbnail}
    alt=""
    ratio={ratio ?? undefined}
    eager={eager}
    className={className}
    fallback={<GeneratedCover title={project.title} />}
  />
);
