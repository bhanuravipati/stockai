export {
  loadProgress,
  markLessonComplete,
  recordCheckpointAnswer,
  recordCourseQuizResult,
  setLastVisited,
  isLessonComplete,
  getCourseCompletion,
} from "./progress";
export type { LearnProgress, CheckpointResult, CourseQuizResult, LastVisited, Streak } from "./progress";
export { getCourseBySlug, getLessonBySlug, getAdjacentLessons } from "./content";
