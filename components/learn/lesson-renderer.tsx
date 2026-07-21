"use client";

import { recordCheckpointAnswer } from "@/lib/learn/progress";
import { WIDGET_REGISTRY } from "./widgets/registry";
import { HeadingBlock, ProseBlock, CalloutBlock } from "./prose-block";
import { MCQQuestionCard } from "./mcq-question";
import type { ContentBlock } from "@/content/learn/types";

interface LessonRendererProps {
  lessonId: string;
  content: ContentBlock[];
}

export function LessonRenderer({ lessonId, content }: LessonRendererProps) {
  return (
    <div className="space-y-6">
      {content.map((block, i) => {
        switch (block.type) {
          case "heading":
            return <HeadingBlock key={i} text={block.text} />;
          case "prose":
            return <ProseBlock key={i} body={block.body} />;
          case "callout":
            return <CalloutBlock key={i} tone={block.tone} body={block.body} />;
          case "widget": {
            const Widget = WIDGET_REGISTRY[block.widget];
            return <Widget key={i} {...(block.props ?? {})} />;
          }
          case "checkpoint":
            return (
              <MCQQuestionCard
                key={i}
                question={block.question}
                onAnswered={(correct) => recordCheckpointAnswer(lessonId, block.question.id, correct)}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
