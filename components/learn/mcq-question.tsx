"use client";

import { useState } from "react";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { MCQQuestion } from "@/content/learn/types";

interface MCQQuestionCardProps {
  question: MCQQuestion;
  onAnswered?: (correct: boolean) => void;
  className?: string;
}

export function MCQQuestionCard({ question, onAnswered, className }: MCQQuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === question.correctOptionId;

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
    onAnswered?.(isCorrect);
  }

  function handleTryAgain() {
    setSelected(null);
    setSubmitted(false);
  }

  return (
    <div className={cn("space-y-3 rounded-xl border border-border bg-card p-4", className)}>
      <p className="text-sm font-medium text-foreground">{question.prompt}</p>

      <RadioGroup
        value={selected ?? undefined}
        onValueChange={(value) => !submitted && setSelected(value as string)}
        className="gap-2"
      >
        {question.options.map((option) => {
          const isSelected = selected === option.id;
          const showCorrect = submitted && option.id === question.correctOptionId;
          const showIncorrect = submitted && isSelected && option.id !== question.correctOptionId;
          return (
            <label
              key={option.id}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm transition-colors",
                isSelected && !submitted && "border-primary bg-muted",
                showCorrect && "border-gain bg-gain/10 text-gain",
                showIncorrect && "border-loss bg-loss/10 text-loss",
                submitted && "cursor-default",
              )}
            >
              <RadioGroupItem value={option.id} disabled={submitted} />
              <span className="flex-1">{option.label}</span>
              {showCorrect && <CheckCircle2Icon className="size-4 shrink-0" />}
              {showIncorrect && <XCircleIcon className="size-4 shrink-0" />}
            </label>
          );
        })}
      </RadioGroup>

      {!submitted && (
        <Button size="sm" disabled={!selected} onClick={handleSubmit}>
          Check answer
        </Button>
      )}

      {submitted && !isCorrect && (
        <div className="space-y-2">
          <p className="text-sm text-loss">Not quite — {question.explanation}</p>
          <Button size="sm" variant="outline" onClick={handleTryAgain}>
            Try again
          </Button>
        </div>
      )}

      {submitted && isCorrect && <p className="text-sm text-gain">Correct — {question.explanation}</p>}
    </div>
  );
}
