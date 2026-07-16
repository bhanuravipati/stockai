import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function SwotCard({
  title,
  icon: Icon,
  items,
  tone,
}: {
  title: string;
  icon: LucideIcon;
  items: string[];
  tone: "gain" | "loss" | "info" | "warn";
}) {
  const toneClasses: Record<string, string> = {
    gain: "border-gain/30 bg-gain/5",
    loss: "border-loss/30 bg-loss/5",
    info: "border-chart-1/30 bg-[color-mix(in_oklab,var(--chart-1)_8%,transparent)]",
    warn: "border-chart-3/30 bg-[color-mix(in_oklab,var(--chart-3)_8%,transparent)]",
  };
  const iconClasses: Record<string, string> = {
    gain: "text-gain",
    loss: "text-loss",
    info: "text-chart-1",
    warn: "text-chart-3",
  };

  return (
    <div className={cn("rounded-xl border p-5", toneClasses[tone])}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn("size-4.5", iconClasses[tone])} />
        <h3 className="font-medium">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-foreground/90">
            <span className={cn("mt-2 size-1 shrink-0 rounded-full", iconClasses[tone], "bg-current")} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
