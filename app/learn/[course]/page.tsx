import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourseBySlug } from "@/lib/learn/content";
import { CourseOverviewView } from "./course-overview-view";

function CourseOverviewFallback() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default async function CourseOverviewPage({ params }: { params: Promise<{ course: string }> }) {
  const { course: courseSlug } = await params;
  if (!getCourseBySlug(courseSlug)) notFound();

  return (
    <Suspense fallback={<CourseOverviewFallback />}>
      <CourseOverviewView courseSlug={courseSlug} />
    </Suspense>
  );
}
