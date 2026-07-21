"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { recordCourseQuizResult } from "@/lib/learn/progress";
import { MCQQuestionCard } from "./mcq-question";
import type { MCQQuestion } from "@/content/learn/types";

const PASS_THRESHOLD = 0.7;

interface CourseQuizProps {
  courseSlug: string;
  questions: MCQQuestion[];
  onFinished?: () => void;
}

export function CourseQuiz({ courseSlug, questions, onFinished }: CourseQuizProps) {
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState<{ correct: number; total: number; passed: boolean } | null>(null);

  const answeredCount = Object.keys(results).length;
  const allAnswered = answeredCount === questions.length;

  function handleAnswered(questionId: string, correct: boolean) {
    setResults((prev) => ({ ...prev, [questionId]: correct }));
  }

  function handleFinish() {
    const correct = Object.values(results).filter(Boolean).length;
    const total = questions.length;
    recordCourseQuizResult(courseSlug, correct, total, PASS_THRESHOLD);
    setFinished({ correct, total, passed: correct / total >= PASS_THRESHOLD });
    onFinished?.();
  }

  function handleRetake() {
    setAttempt((a) => a + 1);
    setResults({});
    setFinished(null);
  }

  if (finished) {
    return (
      <div
        className={cn(
          "space-y-3 rounded-xl border p-5 text-center",
          finished.passed ? "border-gain/30 bg-gain/10" : "border-loss/30 bg-loss/10",
        )}
      >
        <p className={cn("text-lg font-semibold", finished.passed ? "text-gain" : "text-loss")}>
          {finished.passed ? "You passed!" : "Not quite — give it another go"}
        </p>
        <p className="text-sm text-muted-foreground">
          You scored {finished.correct} out of {finished.total} ({Math.round((finished.correct / finished.total) * 100)}%).
          Passing requires {Math.round(PASS_THRESHOLD * 100)}%.
        </p>
        <Button size="sm" variant="outline" onClick={handleRetake}>
          Retake quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <MCQQuestionCard
          key={`${attempt}-${question.id}`}
          question={question}
          onAnswered={(correct) => handleAnswered(question.id, correct)}
        />
      ))}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {answeredCount} of {questions.length} answered
        </p>
        <Button size="sm" disabled={!allAnswered} onClick={handleFinish}>
          See results
        </Button>
      </div>
    </div>
  );
}
