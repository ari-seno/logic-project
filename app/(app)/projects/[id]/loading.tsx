import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectOverviewLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Skeleton className="h-4 w-32" />
        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex shrink-0 gap-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <Skeleton className="mt-4 h-10 w-full max-w-2xl" />
      </div>

      <div className="card-glass p-6">
        <Skeleton className="h-4 w-28" />
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="card-glass p-6">
        <Skeleton className="h-4 w-24" />
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 15 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, column) => (
          <div key={column} className="flex flex-col gap-2">
            <Skeleton className="mb-1 h-4 w-40" />
            {Array.from({ length: 3 }).map((_, row) => (
              <Skeleton key={row} className="h-20 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
