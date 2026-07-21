import type { Course } from "./types";
import { stocks101 } from "./courses/stocks-101";

export const COURSES: Course[] = [
  stocks101,
  {
    slug: "bonds-101",
    title: "Bonds 101",
    description: "How lending money to companies and governments works, and what makes a bond's yield move.",
    accent: "bg-chart-5/10 text-chart-5",
    status: "coming-soon",
    estimatedMinutes: 0,
    lessons: [],
    endOfCourseQuiz: [],
  },
  {
    slug: "commodities-101",
    title: "Commodities 101",
    description: "Gold, oil, and crops — how physical goods get traded and what drives their prices.",
    accent: "bg-chart-8/10 text-chart-8",
    status: "coming-soon",
    estimatedMinutes: 0,
    lessons: [],
    endOfCourseQuiz: [],
  },
];
