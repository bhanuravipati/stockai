import { LightbulbIcon, TriangleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeadingBlock({ text }: { text: string }) {
  return <h2 className="text-xl font-semibold tracking-tight text-foreground">{text}</h2>;
}

export function ProseBlock({ body }: { body: string[] }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
      {body.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}

export function CalloutBlock({ tone, body }: { tone: "tip" | "warn"; body: string }) {
  const Icon = tone === "tip" ? LightbulbIcon : TriangleAlertIcon;
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border p-3 text-sm",
        tone === "tip" ? "border-chart-3/30 bg-chart-3/10 text-foreground" : "border-loss/30 bg-loss/10 text-foreground",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "tip" ? "text-chart-3" : "text-loss")} />
      <p>{body}</p>
    </div>
  );
}
