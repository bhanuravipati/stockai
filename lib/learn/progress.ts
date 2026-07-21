/**
 * Learn-feature progress persistence. Same rationale as lib/screener/storage.ts:
 * no user/auth model exists in this app, so progress lives in the browser's localStorage.
 */

const LEARN_PROGRESS_KEY = "nebulion:learn-progress";
const SCHEMA_VERSION = 1;

const XP_CHECKPOINT_CORRECT = 10;
const XP_LESSON_COMPLETE = 25;
const XP_COURSE_QUIZ_PASS = 50;

export interface CheckpointResult {
  correct: boolean;
  attemptedAt: string;
}

export interface CourseQuizResult {
  correct: number;
  total: number;
  passed: boolean;
  lastAttemptAt: string;
}

export interface LastVisited {
  courseSlug: string;
  lessonSlug: string;
  updatedAt: string;
}

export interface Streak {
  current: number;
  longest: number;
  /** Local YYYY-MM-DD of the last activity that touched the streak. */
  lastActiveDate: string;
}

export interface LearnProgress {
  version: 1;
  completedLessons: string[];
  checkpointResults: Record<string, CheckpointResult>;
  courseQuizResults: Record<string, CourseQuizResult>;
  lastVisited: LastVisited | null;
  xp: number;
  streak: Streak;
}

function emptyProgress(): LearnProgress {
  return {
    version: SCHEMA_VERSION,
    completedLessons: [],
    checkpointResults: {},
    courseQuizResults: {},
    lastVisited: null,
    xp: 0,
    streak: { current: 0, longest: 0, lastActiveDate: "" },
  };
}

function isLearnProgress(v: unknown): v is LearnProgress {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return (
    p.version === SCHEMA_VERSION &&
    Array.isArray(p.completedLessons) &&
    typeof p.checkpointResults === "object" &&
    p.checkpointResults !== null &&
    typeof p.courseQuizResults === "object" &&
    p.courseQuizResults !== null &&
    typeof p.xp === "number" &&
    typeof p.streak === "object" &&
    p.streak !== null
  );
}

export function loadProgress(): LearnProgress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = window.localStorage.getItem(LEARN_PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    return isLearnProgress(parsed) ? parsed : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

function saveProgress(progress: LearnProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEARN_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Storage full/unavailable — silently drop, matching lib/screener/storage.ts.
  }
}

function todayLocalDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function touchStreak(progress: LearnProgress): void {
  const today = todayLocalDate();
  const { lastActiveDate, current, longest } = progress.streak;
  if (lastActiveDate === today) return;
  const gap = lastActiveDate ? daysBetween(lastActiveDate, today) : null;
  const next = gap === 1 ? current + 1 : 1;
  progress.streak = { current: next, longest: Math.max(longest, next), lastActiveDate: today };
}

function addXp(progress: LearnProgress, amount: number): void {
  progress.xp += amount;
  touchStreak(progress);
}

export function markLessonComplete(lessonId: string): LearnProgress {
  const progress = loadProgress();
  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
    addXp(progress, XP_LESSON_COMPLETE);
  } else {
    touchStreak(progress);
  }
  saveProgress(progress);
  return progress;
}

export function recordCheckpointAnswer(lessonId: string, questionId: string, correct: boolean): LearnProgress {
  const progress = loadProgress();
  const key = `${lessonId}:${questionId}`;
  const alreadyCorrect = progress.checkpointResults[key]?.correct === true;
  progress.checkpointResults[key] = { correct, attemptedAt: new Date().toISOString() };
  if (correct && !alreadyCorrect) {
    addXp(progress, XP_CHECKPOINT_CORRECT);
  } else {
    touchStreak(progress);
  }
  saveProgress(progress);
  return progress;
}

export function recordCourseQuizResult(
  courseSlug: string,
  correct: number,
  total: number,
  passThreshold = 0.7,
): LearnProgress {
  const progress = loadProgress();
  const passed = total > 0 && correct / total >= passThreshold;
  const alreadyPassed = progress.courseQuizResults[courseSlug]?.passed === true;
  progress.courseQuizResults[courseSlug] = { correct, total, passed, lastAttemptAt: new Date().toISOString() };
  if (passed && !alreadyPassed) {
    addXp(progress, XP_COURSE_QUIZ_PASS);
  } else {
    touchStreak(progress);
  }
  saveProgress(progress);
  return progress;
}

export function setLastVisited(courseSlug: string, lessonSlug: string): LearnProgress {
  const progress = loadProgress();
  progress.lastVisited = { courseSlug, lessonSlug, updatedAt: new Date().toISOString() };
  saveProgress(progress);
  return progress;
}

export function isLessonComplete(progress: LearnProgress, lessonId: string): boolean {
  return progress.completedLessons.includes(lessonId);
}

export function getCourseCompletion(
  progress: LearnProgress,
  lessonIds: string[],
): { completed: number; total: number; percent: number } {
  const completed = lessonIds.filter((id) => progress.completedLessons.includes(id)).length;
  const total = lessonIds.length;
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}
