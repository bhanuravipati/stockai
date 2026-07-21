export interface MCQOption {
  id: string;
  label: string;
}

export interface MCQQuestion {
  id: string;
  prompt: string;
  options: MCQOption[];
  correctOptionId: string;
  explanation: string;
}

export type WidgetKey =
  | "ownership-stake-slider"
  | "supply-demand-price"
  | "candlestick-anatomy"
  | "pe-ratio-explorer"
  | "real-pe-lookup"
  | "diversification-pie-simulator";

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "prose"; body: string[] }
  | { type: "callout"; tone: "tip" | "warn"; body: string }
  | { type: "widget"; widget: WidgetKey; props?: Record<string, unknown> }
  | { type: "checkpoint"; question: MCQQuestion };

export interface Lesson {
  /** Stable id, e.g. "stocks-101/what-is-a-stock" — used as the progress-tracking key. */
  id: string;
  /** URL segment, e.g. "what-is-a-stock". */
  slug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  content: ContentBlock[];
}

export type CourseStatus = "available" | "coming-soon";

export interface Course {
  slug: string;
  title: string;
  description: string;
  /** Tailwind classes for the catalog card accent, e.g. "bg-chart-3/10 text-chart-3". */
  accent: string;
  status: CourseStatus;
  estimatedMinutes: number;
  lessons: Lesson[];
  endOfCourseQuiz: MCQQuestion[];
}

/** All checkpoint questions across a lesson's content blocks. */
export function getLessonCheckpoints(lesson: Lesson): MCQQuestion[] {
  return lesson.content.filter((block) => block.type === "checkpoint").map((block) => block.question);
}
