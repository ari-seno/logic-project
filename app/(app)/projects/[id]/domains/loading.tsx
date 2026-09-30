import { Skeleton } from "@/components/ui/skeleton";

export default function SectionLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-full max-w-xl" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="flex shrink-0 gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {Array.from({ length: 2 }).map((_, block) => (
        <div key={block} className="card-glass p-6">
          <Skeleton className="h-4 w-28" />
          <div className="mt-3 flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, row) => (
              <Skeleton key={row} className="h-16 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
