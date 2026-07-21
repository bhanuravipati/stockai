import { FlameIcon, SparklesIcon } from "lucide-react";

interface StreakXpBadgeProps {
  xp: number;
  streak: number;
}

export function StreakXpBadge({ xp, streak }: StreakXpBadgeProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="flex items-center gap-1 font-medium text-foreground">
        <SparklesIcon className="size-4 text-chart-3" />
        {xp} XP
      </span>
      {streak > 0 && (
        <span className="flex items-center gap-1 font-medium text-foreground">
          <FlameIcon className="size-4 text-loss" />
          {streak} day{streak === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}
