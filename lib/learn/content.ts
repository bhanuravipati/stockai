import { COURSES } from "@/content/learn/catalog";
import type { Course, Lesson } from "@/content/learn/types";

export function getCourseBySlug(courseSlug: string): Course | undefined {
  return COURSES.find((c) => c.slug === courseSlug);
}

export function getLessonBySlug(courseSlug: string, lessonSlug: string): Lesson | undefined {
  return getCourseBySlug(courseSlug)?.lessons.find((l) => l.slug === lessonSlug);
}

export function getAdjacentLessons(
  courseSlug: string,
  lessonSlug: string,
): { prev: Lesson | null; next: Lesson | null } {
  const course = getCourseBySlug(courseSlug);
  if (!course) return { prev: null, next: null };
  const index = course.lessons.findIndex((l) => l.slug === lessonSlug);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? course.lessons[index - 1] : null,
    next: index < course.lessons.length - 1 ? course.lessons[index + 1] : null,
  };
}
