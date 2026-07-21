"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LessonRenderer } from "@/components/learn/lesson-renderer";
import { LessonNav } from "@/components/learn/lesson-nav";
import { getAdjacentLessons, getLessonBySlug } from "@/lib/learn/content";
import { getLessonCheckpoints } from "@/content/learn/types";
import { loadProgress, markLessonComplete, setLastVisited, type LearnProgress } from "@/lib/learn/progress";

export function LessonView({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  const lesson = getLessonBySlug(courseSlug, lessonSlug);
  const { prev, next } = getAdjacentLessons(courseSlug, lessonSlug);
  const [progress, setProgress] = useState<LearnProgress | null>(null);

  useEffect(() => {
    setLastVisited(courseSlug, lessonSlug);
    setProgress(loadProgress());
  }, [courseSlug, lessonSlug]);

  if (!lesson) return null;
  const currentLesson = lesson;

  const isComplete = progress?.completedLessons.includes(currentLesson.id) ?? false;
  const checkpoints = getLessonCheckpoints(currentLesson);
  const answeredCheckpoints = checkpoints.filter(
    (q) => progress?.checkpointResults[`${currentLesson.id}:${q.id}`],
  ).length;

  function handleFinish() {
    const updated = markLessonComplete(currentLesson.id);
    setProgress(updated);
    toast.success(`"${currentLesson.title}" complete!`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
      <div className="space-y-1">
        <Link href={`/learn/${courseSlug}`} className="text-xs text-muted-foreground hover:text-foreground">
          &larr; Back to course
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{currentLesson.title}</h1>
        <p className="text-sm text-muted-foreground">{currentLesson.summary}</p>
      </div>

      <LessonRenderer lessonId={currentLesson.id} content={currentLesson.content} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          {isComplete ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-gain">
              <CheckCircle2Icon className="size-4" />
              Lesson complete
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {checkpoints.length > 0
                ? `${answeredCheckpoints} of ${checkpoints.length} checkpoints answered`
                : "Read through, then mark this lesson complete."}
            </p>
          )}
        </div>
        {!isComplete && <Button onClick={handleFinish}>Finish lesson</Button>}
      </div>

      <LessonNav courseSlug={courseSlug} prev={prev} next={next} />
    </div>
  );
}
