"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseCard } from "@/components/learn/course-card";
import { StreakXpBadge } from "@/components/learn/streak-xp-badge";
import { COURSES } from "@/content/learn/catalog";
import { getCourseBySlug, getLessonBySlug } from "@/lib/learn/content";
import { loadProgress, type LearnProgress } from "@/lib/learn/progress";

export function LearnDashboardView() {
  const [progress, setProgress] = useState<LearnProgress | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const continueLesson = progress?.lastVisited ? getLessonBySlug(progress.lastVisited.courseSlug, progress.lastVisited.lessonSlug) : undefined;
  const continueCourse = progress?.lastVisited ? getCourseBySlug(progress.lastVisited.courseSlug) : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Learn</h1>
          <p className="text-sm text-muted-foreground">Free, interactive lessons on stocks, bonds & commodities.</p>
        </div>
        {progress && <StreakXpBadge xp={progress.xp} streak={progress.streak.current} />}
      </div>

      {continueLesson && continueCourse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Continue where you left off</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{continueLesson.title}</p>
              <p className="text-sm text-muted-foreground">{continueCourse.title}</p>
            </div>
            <Button
              nativeButton={false}
              render={<Link href={`/learn/${continueCourse.slug}/${continueLesson.slug}`} />}
            >
              <PlayCircleIcon />
              Resume
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {COURSES.map((course) => {
          const completed = progress
            ? course.lessons.filter((l) => progress.completedLessons.includes(l.id)).length
            : 0;
          return <CourseCard key={course.slug} course={course} completed={completed} />;
        })}
      </div>
    </div>
  );
}
