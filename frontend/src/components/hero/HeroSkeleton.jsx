import { Skeleton } from "@/components/ui/skeleton";

export const HeroSkeleton = () => (
  <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
    <div className="space-y-6">
      <Skeleton className="h-7 w-48 rounded-full" />
      <div className="space-y-3">
        <Skeleton className="h-14 w-4/5" />
        <Skeleton className="h-14 w-3/5" />
      </div>
      <Skeleton className="h-5 w-full max-w-lg" />
      <Skeleton className="h-5 w-2/3 max-w-md" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-11 w-36 rounded-full" />
        <Skeleton className="h-11 w-32 rounded-full" />
      </div>
    </div>
    <Skeleton className="hidden h-80 rounded-2xl lg:block" />
  </div>
);
