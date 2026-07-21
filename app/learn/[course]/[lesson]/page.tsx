import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getLessonBySlug } from "@/lib/learn/content";
import { LessonView } from "./lesson-view";

function LessonViewFallback() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default async function LessonPage({ params }: { params: Promise<{ course: string; lesson: string }> }) {
  const { course: courseSlug, lesson: lessonSlug } = await params;
  if (!getLessonBySlug(courseSlug, lessonSlug)) notFound();

  return (
    <Suspense fallback={<LessonViewFallback />}>
      <LessonView courseSlug={courseSlug} lessonSlug={lessonSlug} />
    </Suspense>
  );
}
