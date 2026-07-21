import { Progress } from "@/components/ui/progress";

interface CourseProgressBarProps {
  completed: number;
  total: number;
}

export function CourseProgressBar({ completed, total }: CourseProgressBarProps) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {completed} of {total} lessons complete
        </span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <Progress value={percent} />
    </div>
  );
}
