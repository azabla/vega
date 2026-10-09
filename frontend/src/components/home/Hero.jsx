import { Skeleton } from "@/components/ui/skeleton";
import { useAppearance } from "@/hooks/useAppearance";
import { useExperience, useProjects, useSkills } from "@/hooks/usePortfolio";
import { useProfile } from "@/hooks/useProfile";
import { HeroBento } from "./HeroBento";
import { HeroClassic } from "./HeroClassic";
import { HeroMinimal } from "./HeroMinimal";

const VARIANTS = { bento: HeroBento, classic: HeroClassic, minimal: HeroMinimal };

const HeroSkeleton = () => (
  <div className="grid auto-rows-[10.5rem] gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4" role="status" aria-label="Loading">
    <Skeleton className="rounded-2xl md:col-span-2 lg:row-span-2" />
    <Skeleton className="rounded-2xl" />
    <Skeleton className="rounded-2xl" />
    <Skeleton className="hidden rounded-2xl md:block" />
    <Skeleton className="hidden rounded-2xl md:block" />
  </div>
);

export const Hero = () => {
  const { settings } = useAppearance();
  const { profile, loading, error } = useProfile();
  const { data: projects, loading: l1 } = useProjects();
  const { data: experience, loading: l2 } = useExperience();
  const { data: skills, loading: l3 } = useSkills();
  // wait for everything the tiles need, so the grid doesn't reshuffle as data lands
  const Variant = VARIANTS[settings.hero] ?? HeroBento;

  return (
    <section id="top" className="relative pt-24 pb-8 md:pt-28 md:pb-12">
      <div className="container">
        {loading || l1 || l2 || l3 ? (
          <HeroSkeleton />
        ) : error || !profile ? (
          <div className="py-32 text-center">
            <p className="font-heading text-4xl">This portfolio couldn't be loaded.</p>
            <p className="mt-3 text-muted-foreground">Check the address, or try again in a moment.</p>
          </div>
        ) : (
          <Variant profile={profile} projects={projects ?? []} experience={experience ?? []} skills={skills ?? []} />
        )}
      </div>
    </section>
  );
};
