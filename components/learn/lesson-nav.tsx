import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lesson } from "@/content/learn/types";

interface LessonNavProps {
  courseSlug: string;
  prev: Lesson | null;
  next: Lesson | null;
}

export function LessonNav({ courseSlug, prev, next }: LessonNavProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
      {prev ? (
        <Button variant="outline" nativeButton={false} render={<Link href={`/learn/${courseSlug}/${prev.slug}`} />}>
          <ArrowLeftIcon />
          {prev.title}
        </Button>
      ) : (
        <Button variant="outline" nativeButton={false} render={<Link href={`/learn/${courseSlug}`} />}>
          <ListIcon />
          Course overview
        </Button>
      )}

      {next ? (
        <Button nativeButton={false} render={<Link href={`/learn/${courseSlug}/${next.slug}`} />}>
          {next.title}
          <ArrowRightIcon />
        </Button>
      ) : (
        <Button nativeButton={false} render={<Link href={`/learn/${courseSlug}`} />}>
          Finish course
          <ArrowRightIcon />
        </Button>
      )}
    </div>
  );
}
