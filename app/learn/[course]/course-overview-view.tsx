"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2Icon, CircleIcon, ClockIcon, TrophyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseProgressBar } from "@/components/learn/course-progress-bar";
import { CourseQuiz } from "@/components/learn/course-quiz";
import { getCourseBySlug } from "@/lib/learn/content";
import { loadProgress, type LearnProgress } from "@/lib/learn/progress";
import { cn } from "@/lib/utils";

export function CourseOverviewView({ courseSlug }: { courseSlug: string }) {
  const course = getCourseBySlug(courseSlug);
  const [progress, setProgress] = useState<LearnProgress | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!course) return null;

  if (course.status === "coming-soon") {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 text-center md:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
        <p className="text-sm text-muted-foreground">This course isn&apos;t ready yet — check back soon.</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/learn" />}>
          Back to Learn
        </Button>
      </div>
    );
  }

  const completedIds = progress?.completedLessons ?? [];
  const completed = course.lessons.filter((l) => completedIds.includes(l.id)).length;
  const allComplete = completed === course.lessons.length;
  const quizResult = progress?.courseQuizResults[course.slug];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
        <p className="text-sm text-muted-foreground">{course.description}</p>
      </div>

      <CourseProgressBar completed={completed} total={course.lessons.length} />

      <div className="space-y-2">
        {course.lessons.map((lesson, i) => {
          const isComplete = completedIds.includes(lesson.id);
          return (
            <Link key={lesson.id} href={`/learn/${course.slug}/${lesson.slug}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-3 py-1">
                  {isComplete ? (
                    <CheckCircle2Icon className="size-5 shrink-0 text-gain" />
                  ) : (
                    <CircleIcon className="size-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {i + 1}. {lesson.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{lesson.summary}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <ClockIcon className="size-3.5" />
                    {lesson.estimatedMinutes} min
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className={cn(!allComplete && "opacity-60")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrophyIcon className="size-4.5 text-chart-3" />
            Final Quiz
            {quizResult?.passed && <CheckCircle2Icon className="size-4 text-gain" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!allComplete && (
            <p className="text-sm text-muted-foreground">Complete every lesson to unlock the final quiz.</p>
          )}
          {allComplete && !showQuiz && (
            <div className="space-y-2">
              {quizResult && (
                <p className="text-sm text-muted-foreground">
                  Last attempt: {quizResult.correct}/{quizResult.total} — {quizResult.passed ? "passed" : "not yet passed"}
                </p>
              )}
              <Button size="sm" onClick={() => setShowQuiz(true)}>
                {quizResult ? "Retake quiz" : "Start quiz"}
              </Button>
            </div>
          )}
          {allComplete && showQuiz && <CourseQuiz courseSlug={course.slug} questions={course.endOfCourseQuiz} />}
        </CardContent>
      </Card>
    </div>
  );
}
