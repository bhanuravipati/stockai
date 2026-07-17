"use client";

import type { Ref, SyntheticEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCursorChange: (cursor: number) => void;
  hasError?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

export function QueryEditor({ value, onChange, onCursorChange, hasError, ref }: QueryEditorProps) {
  function syncCursor(e: SyntheticEvent<HTMLTextAreaElement>) {
    onCursorChange(e.currentTarget.selectionStart ?? 0);
  }

  return (
    <Card size="sm" className={cn(hasError && "ring-destructive/50")}>
      <CardContent>
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onCursorChange(e.target.selectionStart ?? 0);
          }}
          onSelect={syncCursor}
          onKeyUp={syncCursor}
          onClick={syncCursor}
          placeholder="Market Cap > 1000 AND PE Ratio < 20 AND ROE > 15"
          className="min-h-24 font-mono text-sm"
          spellCheck={false}
          aria-invalid={hasError}
        />
      </CardContent>
    </Card>
  );
}
