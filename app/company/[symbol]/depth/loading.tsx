import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <Skeleton className="mb-4 h-6 w-40" />
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
