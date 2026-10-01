import { cn } from "@/lib/utils";

// Stable hue per project, kept in the teal → blue → violet range so covers match the theme
const hueFor = (text) => {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return 165 + (hash % 125);
};

const initials = (title) =>
  title
    .split(/[\s—-]+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// Uses the uploaded thumbnail when there is one, otherwise a generated cover
export const ProjectCover = ({ project, className }) => {
  if (project.thumbnail) {
    return <img src={project.thumbnail} alt={project.title} className={cn("object-cover", className)} />;
  }
  const hue = hueFor(project.title);
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden", className)}
      style={{
        background: `radial-gradient(120% 120% at 0% 0%, oklch(0.72 0.13 ${hue}) 0%, oklch(0.5 0.14 ${hue + 35}) 55%, oklch(0.3 0.08 ${hue + 60}) 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0 / 35%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 35%) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to bottom right, #000, transparent 75%)",
        }}
      />
      <span className="absolute bottom-3 right-4 font-mono text-5xl font-semibold tracking-tighter text-white/85 md:text-6xl">
        {initials(project.title)}
      </span>
    </div>
  );
};
