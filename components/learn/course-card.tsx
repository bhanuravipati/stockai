import Link from "next/link";
import { ClockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CourseProgressBar } from "./course-progress-bar";
import type { Course } from "@/content/learn/types";

interface CourseCardProps {
  course: Course;
  completed?: number;
}

export function CourseCard({ course, completed = 0 }: CourseCardProps) {
  const comingSoon = course.status === "coming-soon";

  const body = (
    <Card className={cn("h-full transition-colors", !comingSoon && "hover:bg-muted/40", comingSoon && "opacity-60")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{course.title}</CardTitle>
          {comingSoon && (
            <Badge variant="secondary" className="shrink-0">
              Coming soon
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{course.description}</p>
        {!comingSoon && (
          <>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ClockIcon className="size-3.5" />
              {course.estimatedMinutes} min · {course.lessons.length} lessons
            </div>
            <CourseProgressBar completed={completed} total={course.lessons.length} />
          </>
        )}
      </CardContent>
    </Card>
  );

  if (comingSoon) return body;

  return (
    <Link href={`/learn/${course.slug}`} className="block">
      {body}
    </Link>
  );
}
