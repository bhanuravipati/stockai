import { ExternalLink } from "lucide-react";
import { formatRelativeDate } from "@/lib/format";
import { SENTIMENT_STYLES } from "@/lib/colors";
import { Badge } from "@/components/ui/badge";

type NewsRow = {
  id: string;
  title: string;
  url: string;
  source: string | null;
  publishedAt: Date;
  sentiment: string | null;
};

export function NewsList({ items }: { items: NewsRow[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent news for this company.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground group-hover:text-primary">{item.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{item.source ?? "Unknown source"}</span>
                <span>·</span>
                <span>{formatRelativeDate(item.publishedAt)}</span>
                {item.sentiment && (
                  <Badge className={`${SENTIMENT_STYLES[item.sentiment] ?? ""} border-0 text-[10px] font-normal`}>
                    {item.sentiment.toLowerCase()}
                  </Badge>
                )}
              </div>
            </div>
            <ExternalLink className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
          </a>
        </li>
      ))}
    </ul>
  );
}
